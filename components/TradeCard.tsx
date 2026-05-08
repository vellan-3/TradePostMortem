import { useState } from 'react';

export default function TradeCard({ trade, rank, isOpen, onToggle, onVerdict, onMirror }: any) {
  const [showShare, setShowShare] = useState(false);

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
        <div style={{ textAlign: 'right' }}>
          <div className="ds-tc-win-pnl">{trade.topWinner ? `+${trade.topWinner.totalPnlSol.toFixed(1)}` : '—'}</div>
          <div className="ds-tc-win-lbl">TOP WINNER</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className={`ds-tc-pnl ${trade.pnlSol >= 0 ? 'ds-lb-pnl-pos' : 'ds-lb-pnl-neg'}`}>
            {trade.pnlSol >= 0 ? '+' : ''}{trade.pnlSol.toFixed(1)} SOL
          </div>
          <div className="ds-tc-pnl-lbl">{trade.pnlLabel}</div>
        </div>
      </div>

      {isOpen && (
        <div className="ds-tc-exp">
          <div className="ds-tc-grid">
            <div>
              <div className="ds-tc-exp-lbl">◉ YOUR TRADE</div>
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
              <div className="ds-tc-exp-lbl">◈ TOP WINNER</div>
              {trade.topWinner ? (
                <>
                  <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Entry Market Cap</span>
                    <span className="ds-tc-stat-v">${trade.topWinner.entryMarketCapLabel ?? 'N/A'}</span>
                  </div>
                   <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Entry Timing</span>
                    <span className="ds-tc-stat-v">{trade.topWinner.entryTimingLabel}</span>
                  </div>
                  <div className="ds-tc-stat">
                    <span className="ds-tc-stat-k">Total P&L</span>
                    <span className="ds-tc-stat-v" style={{ color: 'var(--slip-success)' }}>+{trade.topWinner.totalPnlSol.toFixed(1)} SOL</span>
                  </div>
                </>
              ) : (
                <div className="ds-tc-stat-v" style={{ opacity: 0.5 }}>Winner data unavailable</div>
              )}
            </div>
          </div>

          <div className="ds-tc-narrative">
            <b>Why they won:</b> {trade.narrative}
          </div>

          <div className="ds-tc-actions">
            <button className="ds-btn-ghost" onClick={() => onVerdict(trade.tokenSymbol, trade.tokenMint)}>⚖ Verdict</button>
            <button className="ds-btn-ghost" onClick={() => onMirror(trade.tokenSymbol, trade.tokenMint)}>🪞 Mirror</button>
            <button className="ds-btn-ghost" onClick={() => setShowShare(true)}>Share</button>
          </div>
        </div>
      )}
    </div>
  );
}


/* SLIP v2 Official Release */
