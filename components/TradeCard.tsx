import { useState } from 'react';

export default function TradeCard({ trade, rank, isOpen, onToggle, onVerdict, onMirror }: any) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetText = `I just got my $${trade.tokenSymbol} payslip on SLIP!

📉 My P&L: ${trade.pnlSol >= 0 ? '+' : ''}${trade.pnlSol.toFixed(1)} SOL
🏆 Top Winner: ${trade.topWinner ? `+${trade.topWinner.totalPnlSol.toFixed(1)} SOL` : 'N/A'}

Analyze your trades at:`;
  return (
    <div className={`ds-trade-card ${isOpen ? 'ds-trade-card-open' : ''}`}>
      <div className="ds-tc-top" onClick={onToggle}>
        <div className={`ds-tc-rank ${rank === 1 ? 'ds-tc-rank-1' : rank === 2 ? 'ds-tc-rank-2' : rank === 3 ? 'ds-tc-rank-3' : ''}`}>
          {rank}
        </div>
        <div>
          <div className="ds-tc-token">
            ${trade.tokenSymbol}
            <span className="ds-tc-diag">{trade.diagnosisLabel}</span>
          </div>
          <div className="ds-tc-sub">{trade.entryDisplay}</div>
        </div>
        <div style={{ textAlign: 'right', paddingRight: 40 }}>
          <div className="ds-tc-win-pnl">{trade.topWinner ? `+${trade.topWinner.totalPnlSol.toFixed(1)} SOL` : '—'}</div>
          <div className="ds-tc-win-lbl">TOP WINNER SAME TOKEN</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`ds-tc-pnl ${trade.pnlSol >= 0 ? 'ds-lb-pnl-pos' : 'ds-lb-pnl-neg'}`} style={{ color: trade.pnlSol >= 0 ? 'var(--slip-success)' : 'var(--slip-red)' }}>
            {trade.pnlSol >= 0 ? '+' : ''}{trade.pnlSol.toFixed(1)} SOL
          </div>
          <div className="ds-tc-pnl-lbl">{trade.pnlLabel}</div>
        </div>
      </div>

      {isOpen && (
        <div className="ds-tc-exp ds-fade-in">
          <div className="ds-tc-grid">
            <div>
              <div className="ds-tc-exp-lbl" style={{ color: 'var(--slip-purple)' }}>◉ YOUR TRADE</div>
              {trade.yourTrade?.map((s: any) => (
                <div className="ds-tc-stat" key={s.label}>
                  <span className="ds-tc-stat-k">{s.label}</span>
                  <span className="ds-tc-stat-v" style={{
                    color: s.tone === 'pass' ? 'var(--slip-success)' :
                           s.tone === 'warning' ? 'var(--slip-warning)' :
                           s.tone === 'critical' ? 'var(--slip-red)' : 'var(--slip-text)'
                  }}>{s.value}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="ds-tc-exp-lbl" style={{ color: 'var(--slip-success)' }}>◈ TOP WINNER — {trade.topWinner?.walletLabel ?? 'N/A'}</div>
              {trade.topWinner ? (
                <>
                  <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Entry Price</span>
                    <span className="ds-tc-stat-v">${trade.topWinner.entryPrice?.toFixed(8) || 'N/A'}</span>
                  </div>
                  <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Entry Market Cap</span>
                    <span className="ds-tc-stat-v">${trade.topWinner.entryMarketCapLabel ?? 'N/A'}</span>
                  </div>
                   <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Entry Timing</span>
                    <span className="ds-tc-stat-v" style={{ color: 'var(--slip-success)' }}>{trade.topWinner.entryTimingLabel}</span>
                  </div>
                  <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">SOL Deployed</span>
                    <span className="ds-tc-stat-v">{trade.topWinner.sizeSol?.toFixed(1)} SOL</span>
                  </div>
                  <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Total P&L</span>
                    <span className="ds-tc-stat-v" style={{ color: 'var(--slip-success)' }}>+{trade.topWinner.totalPnlSol.toFixed(1)} SOL</span>
                  </div>
                  <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Used DEX</span>
                    <span className="ds-tc-stat-v">{trade.topWinner.dex ?? 'Unknown'}</span>
                  </div>
                </>
              ) : (
                <div className="ds-tc-stat-v" style={{ opacity: 0.5 }}>Winner data unavailable for this trade</div>
              )}
            </div>
          </div>

          <div className="ds-tc-narrative">
            <b>Why they won and you didn&apos;t:</b> {trade.narrative}
          </div>

          <div className="ds-tc-actions">
            <div className="ds-tc-actions-left">
              <button className="ds-btn-tertiary" onClick={() => onVerdict(trade.tokenSymbol, trade.tokenMint)}>⚖ RUN VERDICT ON {trade.tokenSymbol}</button>
              <button className="ds-btn-tertiary" onClick={() => onMirror(trade.tokenSymbol, trade.tokenMint)}>🪞 FULL MIRROR →</button>
            </div>
            <div className="ds-tc-actions-right">
              <button 
                className="ds-btn-tertiary" 
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                𝕏 POST
              </button>
              <button className="ds-btn-tertiary" onClick={handleShare}>
                {copied ? '✓ COPIED!' : 'SHARE PAYSLIP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* SLIP v2 Official Release */
