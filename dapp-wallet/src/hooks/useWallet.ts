import { useState, useEffect, useCallback, useRef } from 'react';
import { getWallets } from '@wallet-standard/app';
import type { Wallet, WalletAccount } from '@wallet-standard/base';

// ---------------------------------------------------------------------------
// Wallet Standard feature names
// ---------------------------------------------------------------------------
const STANDARD_CONNECT    = 'standard:connect';
const STANDARD_DISCONNECT = 'standard:disconnect';

const SOLANA_CHAINS = [
  'solana:mainnet',
  'solana:devnet',
  'solana:testnet',
  'solana:localnet',
] as const;

// ---------------------------------------------------------------------------
// Legacy window-injected provider types  (Phantom, Solflare, Backpack, etc.)
// ---------------------------------------------------------------------------
interface LegacyPublicKey {
  toBytes: () => Uint8Array;
  toString: () => string;
}

interface LegacySolanaProvider {
  connect:    (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: LegacyPublicKey }>;
  disconnect: () => Promise<void>;
  publicKey:  LegacyPublicKey | null;
  isPhantom?:   boolean;
  isSolflare?:  boolean;
  isBackpack?:  boolean;
  isGlow?:      boolean;
}

declare global {
  interface Window {
    phantom?:  { solana?: LegacySolanaProvider };
    solana?:   LegacySolanaProvider;
    backpack?: LegacySolanaProvider & { solana?: LegacySolanaProvider };
    glow?:     LegacySolanaProvider;
    solflare?: LegacySolanaProvider;
  }
}

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------
export interface DetectedWallet {
  name: string;
  icon: string;
  /** Present for Wallet Standard wallets */
  wallet?: Wallet;
  /** Present for legacy window-injected wallets */
  legacyProvider?: LegacySolanaProvider;
}

export interface WalletState {
  detectedWallets:   DetectedWallet[];
  selectedWallet:    DetectedWallet | null;
  connectedAccount:  WalletAccount | null;
  address:           string | null;
  balance:           number | null;
  isConnecting:      boolean;
  isFetchingBalance: boolean;
  isLive:            boolean;
  lastUpdated:       Date | null;
  error:             string | null;
  connect:       (wallet: DetectedWallet) => Promise<void>;
  disconnect:    () => void;
  refreshBalance: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// RPC endpoints
// ---------------------------------------------------------------------------
const DEVNET_HTTP = 'https://api.devnet.solana.com';
const DEVNET_WS   = 'wss://api.devnet.solana.com';
const POLL_INTERVAL_MS = 30_000;

async function fetchDevnetBalance(address: string): Promise<number> {
  const res = await fetch(DEVNET_HTTP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'getBalance',
      params: [address, { commitment: 'confirmed' }],
    }),
  });
  if (!res.ok) throw new Error(`RPC failed: ${res.statusText}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? 'RPC error');
  return (data.result?.value ?? 0) / 1_000_000_000;
}

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

/** A Wallet Standard wallet counts as Solana if it has any solana:* feature */
function isStandardSolanaWallet(w: Wallet): boolean {
  return (
    Object.keys(w.features).some((k) => k.startsWith('solana:')) &&
    STANDARD_CONNECT in w.features
  );
}

const WALLET_ICONS: Record<string, string> = {
  Phantom:  'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/phantom/icon.png',
  Solflare: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/solflare/icon.png',
  Backpack: 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/backpack/icon.png',
  Glow:     'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/glow/icon.png',
};

/** Discover legacy window-injected Solana providers */
function detectLegacyWallets(): DetectedWallet[] {
  const found: DetectedWallet[] = [];
  const seen = new Set<string>();

  const add = (name: string, provider: LegacySolanaProvider) => {
    if (seen.has(name)) return;
    seen.add(name);
    found.push({ name, icon: WALLET_ICONS[name] ?? '', legacyProvider: provider });
  };

  // Phantom
  if (window.phantom?.solana?.isPhantom) {
    add('Phantom', window.phantom.solana);
  } else if (window.solana?.isPhantom) {
    add('Phantom', window.solana);
  }

  // Solflare
  if (window.solflare?.isSolflare) {
    add('Solflare', window.solflare);
  } else if (window.solana?.isSolflare) {
    add('Solflare', window.solana);
  }

  // Backpack
  if (window.backpack?.isBackpack) {
    add('Backpack', window.backpack as LegacySolanaProvider);
  }

  // Glow
  if (window.glow?.isGlow) {
    add('Glow', window.glow);
  }

  // Generic window.solana fallback (e.g. any other Solana wallet that isn't already seen)
  if (window.solana && !seen.size) {
    const name = (window.solana as unknown as Record<string, string>).walletName ?? 'Solana Wallet';
    add(name, window.solana);
  }

  return found;
}

/** Merge Wallet Standard list with legacy list, preferring the WS entry */
function mergeWallets(
  standard: DetectedWallet[],
  legacy: DetectedWallet[]
): DetectedWallet[] {
  const names = new Set(standard.map((w) => w.name));
  const extras = legacy.filter((w) => !names.has(w.name));
  return [...standard, ...extras];
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------
export function useWallet(): WalletState {
  const [detectedWallets,   setDetectedWallets]   = useState<DetectedWallet[]>([]);
  const [selectedWallet,    setSelectedWallet]    = useState<DetectedWallet | null>(null);
  const [connectedAccount,  setConnectedAccount]  = useState<WalletAccount | null>(null);
  const [address,           setAddress]           = useState<string | null>(null);
  const [balance,           setBalance]           = useState<number | null>(null);
  const [isConnecting,      setIsConnecting]      = useState(false);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const [isLive,            setIsLive]            = useState(false);
  const [lastUpdated,       setLastUpdated]       = useState<Date | null>(null);
  const [error,             setError]             = useState<string | null>(null);

  const wsRef      = useRef<WebSocket | null>(null);
  const subIdRef   = useRef<number | null>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const addressRef = useRef<string | null>(null);
  addressRef.current = address;

  // ── Discovery ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const walletsApi = getWallets();

    const fromStandard = (wallets: readonly Wallet[]): DetectedWallet[] =>
      wallets
        .filter(isStandardSolanaWallet)
        .map((w) => ({ name: w.name, icon: w.icon as string, wallet: w }));

    const refresh = () => {
      const standard = fromStandard(walletsApi.get());
      const legacy   = detectLegacyWallets();
      setDetectedWallets(mergeWallets(standard, legacy));
    };

    // Initial scan — run after a small delay so extensions have time to inject
    refresh();
    const timer = setTimeout(refresh, 500);

    // Also re-scan whenever a new Wallet Standard wallet registers
    const unsubscribe = walletsApi.on('register', refresh);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // ── WebSocket accountSubscribe ────────────────────────────────────────────
  const stopSubscription = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (subIdRef.current !== null) {
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'accountUnsubscribe', params: [subIdRef.current] }));
      }
      ws.close();
    }
    wsRef.current  = null;
    subIdRef.current = null;
    setIsLive(false);
  }, []);

  const startSubscription = useCallback((addr: string) => {
    stopSubscription();
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const openWs = () => {
      const ws = new WebSocket(DEVNET_WS);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'accountSubscribe',
          params: [addr, { encoding: 'base64', commitment: 'confirmed' }],
        }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.id === 1 && typeof msg.result === 'number') {
            subIdRef.current = msg.result;
            setIsLive(true);
            return;
          }
          if (msg.method === 'accountNotification' && msg.params?.result?.value?.lamports !== undefined) {
            setBalance(msg.params.result.value.lamports / 1_000_000_000);
            setLastUpdated(new Date());
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => setIsLive(false);

      ws.onclose = () => {
        setIsLive(false);
        wsRef.current = null;
        subIdRef.current = null;
        if (addressRef.current) {
          reconnectTimeout = setTimeout(() => { if (addressRef.current) openWs(); }, 5_000);
        }
      };
    };

    openWs();

    pollRef.current = setInterval(async () => {
      const cur = addressRef.current;
      if (!cur) return;
      try {
        const sol = await fetchDevnetBalance(cur);
        setBalance(sol);
        setLastUpdated(new Date());
      } catch { /* silently ignore */ }
    }, POLL_INTERVAL_MS);

    return () => { if (reconnectTimeout) clearTimeout(reconnectTimeout); };
  }, [stopSubscription]);

  useEffect(() => {
    if (address) startSubscription(address);
    else stopSubscription();
    return () => { stopSubscription(); };
  }, [address, startSubscription, stopSubscription]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async (detected: DetectedWallet) => {
    setIsConnecting(true);
    setError(null);
    setBalance(null);
    setAddress(null);
    setConnectedAccount(null);
    setLastUpdated(null);

    try {
      let addr: string;

      if (detected.legacyProvider) {
        // ── Legacy window-injected provider (Phantom, Solflare, etc.) ──────
        const result = await detected.legacyProvider.connect();
        addr = result.publicKey.toString();

      } else if (detected.wallet) {
        // ── Wallet Standard ──────────────────────────────────────────────
        const features = detected.wallet.features as Record<string, unknown>;
        const connectFn = (features[STANDARD_CONNECT] as { connect: Function } | undefined)?.connect;
        if (!connectFn) throw new Error(`${detected.name} does not expose standard:connect`);

        const result = await connectFn() as { accounts: readonly WalletAccount[] };
        const all = result.accounts;

        // Prefer accounts tagged with a Solana chain; fall back to first account
        const account =
          all.find((a) => a.chains.some((c) => (SOLANA_CHAINS as readonly string[]).includes(c))) ??
          all[0];
        if (!account) throw new Error('No accounts returned from wallet');

        setConnectedAccount(account);
        addr = encodeBase58(new Uint8Array(account.publicKey));

      } else {
        throw new Error('Wallet has no connection method');
      }

      setSelectedWallet(detected);
      setAddress(addr);

      // Initial HTTP balance fetch (WS takes a moment to connect)
      setIsFetchingBalance(true);
      try {
        const sol = await fetchDevnetBalance(addr);
        setBalance(sol);
        setLastUpdated(new Date());
      } finally {
        setIsFetchingBalance(false);
      }

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.toLowerCase().includes('user rejected') ||
        msg.toLowerCase().includes('cancelled') ||
        msg.includes('4001')
          ? 'Connection cancelled by user.'
          : msg
      );
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (selectedWallet) {
      try {
        if (selectedWallet.legacyProvider) {
          await selectedWallet.legacyProvider.disconnect();
        } else if (selectedWallet.wallet) {
          const features = selectedWallet.wallet.features as Record<string, unknown>;
          const disco = (features[STANDARD_DISCONNECT] as { disconnect?: Function } | undefined)?.disconnect;
          await disco?.();
        }
      } catch { /* always clear state regardless */ }
    }
    stopSubscription();
    setSelectedWallet(null);
    setConnectedAccount(null);
    setAddress(null);
    setBalance(null);
    setLastUpdated(null);
    setError(null);
  }, [selectedWallet, stopSubscription]);

  // ── Manual refresh ────────────────────────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!address) return;
    setIsFetchingBalance(true);
    setError(null);
    try {
      const sol = await fetchDevnetBalance(address);
      setBalance(sol);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsFetchingBalance(false);
    }
  }, [address]);

  return {
    detectedWallets, selectedWallet, connectedAccount, address, balance,
    isConnecting, isFetchingBalance, isLive, lastUpdated, error,
    connect, disconnect, refreshBalance,
  };
}

// ---------------------------------------------------------------------------
// Minimal base-58 encoder (for Wallet Standard Uint8Array public keys)
// ---------------------------------------------------------------------------
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(bytes: Uint8Array): string {
  let leading = 0;
  for (const b of bytes) { if (b !== 0) break; leading++; }

  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) { digits.push(carry % 58); carry = Math.floor(carry / 58); }
  }

  return '1'.repeat(leading) + digits.reverse().map((d) => BASE58[d]).join('');
}
