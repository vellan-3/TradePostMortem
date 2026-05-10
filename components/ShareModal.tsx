'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';

export default function ShareModal({ trade, onClose }: { trade: any; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const diagnosis = trade.diagnosisLabel?.toUpperCase() || 'TRADE AUTOPSY';
  const isPos = trade.pnlSol >= 0;
  const accentColor = isPos ? 'var(--slip-green)' : 'var(--slip-red)';
  const glowColor = isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 59, 59, 0.15)';

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#06060a',
        style: {
           transform: 'scale(1)',
           transformOrigin: 'top left',
        }
      });
      const link = document.createElement('a');
      link.download = `slip-payslip-${trade.tokenSymbol.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setDownloading(false);
    }
  };

  const shareToX = () => {
    const text = `Just ran my trades through SLIP 🔍\n\n$${trade.tokenSymbol}: ${diagnosis} — ${trade.pnlSol.toFixed(1)} SOL\n\nThe tool shows exactly who won your money and why.\n\n#Solana #OnchainTrading`;
    const url = window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ds-modal-overlay" onClick={onClose}>
      <div className="ds-modal-box" onClick={e => e.stopPropagation()}>
        <div className="ds-modal-header">
          <div className="ds-modal-eyebrow">Share Payslip</div>
          <button className="ds-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="ds-card-wrap">
          <div 
            className="ds-share-card" 
            ref={cardRef}
            style={{ '--accent-color': accentColor, '--glow-color': glowColor } as any}
          >
            <div className="ds-sc-top">
              <div>
                <div className="ds-sc-diag">{diagnosis}</div>
                <div className="ds-sc-token">
                  <span className="ds-sc-sym">${trade.tokenSymbol}</span>
                  <span className="ds-sc-date">{trade.entryDisplay}</span>
                </div>
              </div>
              <div className="ds-sc-pnl-block">
                <div className="ds-sc-pnl-val" style={{ color: accentColor }}>
                  {isPos ? '+' : ''}{trade.pnlSol.toFixed(1)}
                </div>
                <div className="ds-sc-pnl-sol">SOL</div>
              </div>
            </div>

            <div className="ds-sc-grid">
              {trade.yourTrade?.slice(0, 4).map((s: any) => (
                <div className="ds-sc-stat" key={s.label}>
                  <div className="ds-sc-stat-k">{s.label}</div>
                  <div className="ds-sc-stat-v" style={{
                    color: s.tone === 'pass' ? 'var(--slip-success)' :
                           s.tone === 'warning' ? 'var(--slip-warning)' :
                           s.tone === 'critical' ? 'var(--slip-red)' : 'var(--slip-text)'
                  }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="ds-sc-winner-bar">
              <div className="ds-sc-wb-col">
                <div className="ds-sc-wb-lbl">You</div>
                <div className="ds-sc-wb-val" style={{ color: accentColor }}>{trade.pnlSol.toFixed(1)} SOL</div>
                <div className="ds-sc-wb-sub">Entered {trade.entryMarketCapLabel || 'early'}</div>
              </div>
              <div className="ds-sc-wb-sep" />
              <div className="ds-sc-wb-col">
                <div className="ds-sc-wb-lbl" style={{ color: 'var(--slip-green)' }}>Top Winner</div>
                <div className="ds-sc-wb-val" style={{ color: 'var(--slip-green)' }}>+{trade.topWinner?.totalPnlSol.toFixed(1)} SOL</div>
                <div className="ds-sc-wb-sub">{trade.topWinner?.entryTimingLabel}</div>
              </div>
            </div>

            <div className="ds-sc-narrative">
              <b>Why they won:</b> {trade.narrative}
            </div>

            <div className="ds-sc-footer">
              <div className="ds-sc-brand">
                <div className="ds-sc-brand-dot" />
                SLIP
              </div>
              <div className="ds-sc-url">slip.vercel.app</div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="action-x" onClick={shareToX}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Post to X
          </button>
          <div className="action-row">
            <button className="action-btn" onClick={downloadImage} disabled={downloading}>
              {downloading ? 'Saving...' : 'Save PNG'}
            </button>
            <button className="action-btn" onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button className="action-btn solscan" onClick={() => window.open(`https://solscan.io/tx/${trade.id}`, '_blank')}>
              Solscan ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
