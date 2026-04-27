
import { useWallet } from './hooks/useWallet';
import { WalletList } from './components/WalletList';
import { AddressDisplay } from './components/AddressDisplay';
import { BalanceDisplay } from './components/BalanceDisplay';
import './index.css';

const SolanaLogo = () => (
  <svg width="28" height="28" viewBox="0 0 397.7 311.7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sol-a" x1="360.88" y1="351.45" x2="141.21" y2="-69.68" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#00ffa3"/>
        <stop offset="1" stopColor="#dc1fff"/>
      </linearGradient>
      <linearGradient id="sol-b" x1="264.41" y1="401.56" x2="44.74" y2="-19.57" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#00ffa3"/>
        <stop offset="1" stopColor="#dc1fff"/>
      </linearGradient>
      <linearGradient id="sol-c" x1="312.55" y1="376.52" x2="92.88" y2="-44.61" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#00ffa3"/>
        <stop offset="1" stopColor="#dc1fff"/>
      </linearGradient>
    </defs>
    <path fill="url(#sol-a)" d="M64.6 237.9a14 14 0 0 1 9.9-4.1h317.4c6.2 0 9.4 7.5 5 12L332.1 300a14 14 0 0 1-9.9 4.1H4.8c-6.2 0-9.4-7.5-5-12L64.6 237.9z"/>
    <path fill="url(#sol-b)" d="M64.6 8.1A14.3 14.3 0 0 1 74.5 4h317.4c6.2 0 9.4 7.5 5 12L332.1 70.2a14 14 0 0 1-9.9 4.1H4.8c-6.2 0-9.4-7.5-5-12L64.6 8.1z"/>
    <path fill="url(#sol-c)" d="M332.1 122.8a14 14 0 0 0-9.9-4.1H4.8c-6.2 0-9.4 7.5-5 12l59.8 54.2a14 14 0 0 0 9.9 4.1h317.4c6.2 0 9.4-7.5 5-12L332.1 122.8z"/>
  </svg>
);

function App() {
  const {
    detectedWallets,
    selectedWallet,
    address,
    balance,
    isConnecting,
    isFetchingBalance,
    isLive,
    lastUpdated,
    error,
    connect,
    disconnect,
    refreshBalance,
  } = useWallet();

  const isConnected = !!address;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ── */}
      <header style={{
        padding: '18px 32px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10,11,15,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SolanaLogo />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="network-badge">
            <span className="network-dot" />
            Devnet
          </span>
          {isConnected && (
            <button id="btn-disconnect" className="btn-danger" onClick={disconnect}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Disconnect
            </button>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 24px 80px',
      }}>
        <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero headline */}
          <div className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: 8 }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              background: 'linear-gradient(135deg, #f0f0f5 30%, #9945ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 10,
            }}>
              {isConnected ? 'Wallet Connected' : 'Connect Your Wallet'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {isConnected
                ? 'Your Solana devnet balance is shown below.'
                : 'Select a detected wallet to connect and view your devnet balance.'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="error-banner animate-fade-in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Wallet Selection Card ── */}
          <div className="card animate-fade-in-up" style={{ padding: 24, animationDelay: '0.05s' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Detected Wallets</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {detectedWallets.length} wallet{detectedWallets.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div style={{
                background: 'rgba(153,69,255,0.12)',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple-light)" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
            </div>

            <WalletList
              wallets={detectedWallets}
              selected={selectedWallet}
              isConnecting={isConnecting}
              onSelect={connect}
            />
          </div>

          {/* ── Account Details Card (shown after connection) ── */}
          {isConnected && address && (
            <div className="card animate-fade-in-up" style={{ padding: 24, animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#14f195', boxShadow: '0 0 8px #14f195',
                }} />
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Account Details</span>
                {selectedWallet?.icon && (
                  <img
                    src={selectedWallet.icon}
                    alt={selectedWallet.name}
                    width={20}
                    height={20}
                    style={{ borderRadius: 4, marginLeft: 'auto' }}
                  />
                )}
                {selectedWallet && (
                  <span style={{
                    marginLeft: selectedWallet.icon ? 4 : 'auto',
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                  }}>
                    via {selectedWallet.name}
                  </span>
                )}
              </div>

              <AddressDisplay address={address} />

              <div className="divider" />

              <BalanceDisplay
                balance={balance}
                isFetching={isFetchingBalance}
                isLive={isLive}
                lastUpdated={lastUpdated}
                onRefresh={refreshBalance}
              />
            </div>
          )}

          {/* ── How it works ── */}
          {!isConnected && (
            <div className="card animate-fade-in-up" style={{ padding: 24, animationDelay: '0.1s' }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 16 }}>How it works</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '🔍', title: 'Detects wallets', desc: 'Scans for Wallet Standard-compatible browser extensions automatically.' },
                  { icon: '🔌', title: 'Connects securely', desc: 'Triggers your wallet\'s native approval popup — no keys are ever shared.' },
                  { icon: '⚡', title: 'Live balance updates', desc: 'Subscribes to your account via WebSocket — balance refreshes instantly on any transaction.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(153,69,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.1rem',
                    }}>
                      {icon}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 3, lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{
        padding: '16px 32px',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
      }}>
        Built with{' '}
        <a href="https://github.com/wallet-standard/wallet-standard" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--purple-light)' }}>Wallet Standard</a>
        {' '}·{' '}
        <a href="https://github.com/solana-labs/solana-web3.js" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--purple-light)' }}>@solana/kit</a>
        {' '}· Solana Devnet
      </footer>
    </div>
  );
}

export default App;
