
import type { DetectedWallet } from '../hooks/useWallet';

interface Props {
  wallets: DetectedWallet[];
  selected: DetectedWallet | null;
  isConnecting: boolean;
  onSelect: (wallet: DetectedWallet) => void;
}

export const WalletList: React.FC<Props> = ({ wallets, selected, isConnecting, onSelect }) => {
  if (wallets.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '36px 20px',
        background: 'rgba(255,255,255,0.01)',
        border: '1px dashed var(--border-subtle)',
        borderRadius: 12,
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🦊</div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 6 }}>
          No Solana wallets detected
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
          Install a Wallet Standard-compatible wallet extension such as{' '}
          <a href="https://phantom.app" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--purple-light)' }}>Phantom</a>,{' '}
          <a href="https://backpack.app" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--purple-light)' }}>Backpack</a>, or{' '}
          <a href="https://solflare.com" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--purple-light)' }}>Solflare</a>.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {wallets.map((w) => {
        const isSelected = selected?.name === w.name;
        return (
          <button
            key={w.name}
            id={`btn-connect-${w.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={`wallet-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(w)}
            disabled={isConnecting}
          >
            {/* Wallet icon */}
            {w.icon ? (
              <img
                src={w.icon}
                alt={`${w.name} icon`}
                width={36}
                height={36}
                style={{ borderRadius: 8, flexShrink: 0 }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg, #9945ff, #14f195)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', fontWeight: 700, color: '#fff',
              }}>
                {w.name[0]}
              </div>
            )}

            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{w.name}</p>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {isSelected ? 'Connected ✓' : 'Click to connect'}
              </p>
            </div>

            {isConnecting && isSelected ? (
              <div className="spinner" />
            ) : isSelected ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14f195" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
};
