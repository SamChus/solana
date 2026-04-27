import { useState, useCallback } from 'react';

interface Props {
  address: string;
}

export const AddressDisplay: React.FC<Props> = ({ address }) => {
  const [copied, setCopied] = useState(false);

  const short = `${address.slice(0, 6)}...${address.slice(-6)}`;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select text
    }
  }, [address]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p className="section-label">Wallet Address</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="address-chip" title={address}>
          {address}
        </span>
        <button
          id="btn-copy-address"
          className="btn-secondary"
          onClick={copy}
          title="Copy to clipboard"
          style={{ flexShrink: 0, padding: '8px 14px' }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Short form: <span style={{ fontFamily: 'Space Grotesk, monospace', color: 'var(--text-secondary)' }}>{short}</span>
      </p>
    </div>
  );
};
