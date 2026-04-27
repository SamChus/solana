
interface Props {
  balance: number | null;
  isFetching: boolean;
  isLive: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export const BalanceDisplay = ({ balance, isFetching, isLive, lastUpdated, onRefresh }: Props) => {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className="section-label" style={{ marginBottom: 0 }}>Devnet Balance</p>
        {/* Live / polling indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.05em',
            padding: '3px 8px', borderRadius: 20,
            background: isLive ? 'rgba(20,241,149,0.1)' : 'rgba(255,165,0,0.1)',
            border: `1px solid ${isLive ? 'rgba(20,241,149,0.3)' : 'rgba(255,165,0,0.3)'}`,
            color: isLive ? '#14f195' : '#ffad33',
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isLive ? '#14f195' : '#ffad33',
              boxShadow: isLive ? '0 0 6px #14f195' : '0 0 6px #ffad33',
              animation: 'pulse-glow 1.5s ease-in-out infinite',
            }} />
            {isLive ? 'LIVE' : 'POLLING'}
          </span>
        </div>
      </div>

      <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          {isFetching && balance === null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="loading-dots"><span /><span /><span /></div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Fetching…</span>
            </div>
          ) : balance !== null ? (
            <div>
              <span className="balance-value">{balance.toFixed(4)}</span>
              <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 500 }}>SOL</span>
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>N/A</span>
          )}

          {balance !== null && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              ≈ {(balance * 1_000_000_000).toLocaleString()} lamports
              {timeStr && (
                <> · <span style={{ color: 'var(--text-muted)' }}>updated {timeStr}</span></>
              )}
            </p>
          )}
        </div>

        <button
          id="btn-refresh-balance"
          className="btn-secondary"
          onClick={onRefresh}
          disabled={isFetching}
          title="Refresh balance"
          style={{ flexShrink: 0 }}
        >
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
            style={{ animation: isFetching ? 'spin 0.7s linear infinite' : 'none' }}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
        {isLive
          ? 'Balance updates automatically via WebSocket when your account changes.'
          : 'Connecting to live feed… balance polls every 30 s in the meantime.'}
        {' '}Airdrop SOL at{' '}
        <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--purple-light)', textDecoration: 'underline' }}>
          faucet.solana.com
        </a>
      </p>
    </div>
  );
};
