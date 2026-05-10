'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';

export default function ShareModal({ trade, onClose }: { trade: any; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!mounted) return null;

  const diagnosis = trade.diagnosisLabel?.toUpperCase() || 'TRADE AUTOPSY';
  const isPos = trade.pnlSol >= 0;
  const accentColor = isPos ? '#10b981' : '#ff3232';
  const glowColor = isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 50, 50, 0.18)';

  const downloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#06060a',
        width: 1200,
        height: 628,
        style: { transform: 'scale(1)', borderRadius: '0' }
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
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const modalContent = (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-box" style={{ maxWidth: '560px' }}>
        
        {/* Prototype Header */}
        <div className="modal-header">
          <div className="modal-eyebrow">Share Payslip</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* The Card - Exact Prototype Structure */}
        <div className="card-wrap" style={{ padding: '16px 24px' }}>
          <div 
            className="share-card" 
            ref={cardRef}
            style={{ 
              '--accent-color': accentColor, 
              '--glow-color': glowColor,
              width: '100%',
              aspectRatio: '1.91 / 1',
              background: '#06060a',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px 32px 24px'
            } as any}
          >
            <div className="card-top">
              <div className="card-top-left">
                <div className="card-slip-label">
                  <span className="card-slip-dot" style={{ background: accentColor }}></span>
                  SLIP · TRADE AUTOPSY
                </div>
                <div className="card-diagnosis" style={{ color: accentColor, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{diagnosis}</div>
                <div className="card-token-row">
                  <span className="card-symbol" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>${trade.tokenSymbol}</span>
                  <span className="card-date" style={{ fontFamily: 'var(--font-mono)' }}>{trade.entryDisplay}</span>
                </div>
              </div>
              <div className="card-pnl-block">
                <div className="card-pnl-label" style={{ fontFamily: 'var(--font-mono)' }}>Realized P&L</div>
                <div className="card-pnl-value" style={{ color: accentColor, fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                  {isPos ? '+' : ''}{trade.pnlSol.toFixed(1)}
                </div>
                <div className="card-pnl-sol" style={{ fontFamily: 'var(--font-mono)' }}>SOL</div>
              </div>
            </div>

            <div className="card-stats">
              <div className="card-stat">
                <div className="card-stat-lbl">Entry Price</div>
                <div className="card-stat-val">{trade.yourTrade?.[0]?.value || '—'}</div>
              </div>
              <div className="card-stat">
                <div className="card-stat-lbl">Entry Percentile</div>
                <div className={`card-stat-val ${trade.diagnosis === 'BOUGHT_THE_TOP' ? 'red' : ''}`}>{trade.yourTrade?.[1]?.value || '—'}</div>
              </div>
              <div className="card-stat">
                <div className="card-stat-lbl">Peak After Entry</div>
                <div className="card-stat-val green">{trade.yourTrade?.[2]?.value || '—'}</div>
              </div>
              <div className="card-stat">
                <div className="card-stat-lbl">Left on Table</div>
                <div className="card-stat-val amber">{trade.yourTrade?.[3]?.value || '—'}</div>
              </div>
            </div>

            <div className="card-winner-bar">
              <div className="winner-bar-you">
                <div className="winner-bar-lbl">You</div>
                <div className="winner-bar-val" style={{ color: accentColor }}>{trade.pnlSol.toFixed(1)} SOL</div>
                <div className="winner-bar-sub">Entered {trade.entryMarketCapLabel || 'early'}</div>
              </div>
              <div className="winner-bar-sep"></div>
              <div className="winner-bar-winner">
                <div className="winner-bar-lbl" style={{ color: '#10b981' }}>Top Winner</div>
                <div className="winner-bar-val" style={{ color: '#10b981' }}>+{trade.topWinner?.totalPnlSol.toFixed(1)} SOL</div>
                <div className="winner-bar-sub">{trade.topWinner?.entryTimingLabel}</div>
              </div>
            </div>

            <div className="card-narrative" style={{ borderLeftColor: accentColor }}>
              {trade.narrative}
            </div>

            <div className="card-footer">
              <div className="card-footer-left">
                <div className="card-brand" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
                  <div className="card-brand-dot"></div>
                  SLIP•
                </div>
                <div className="card-wallet" style={{ fontFamily: 'var(--font-mono)' }}>{trade.walletDisplay || '7xKXtg...sAsU'}</div>
              </div>
              <div className="card-footer-right" style={{ fontFamily: 'var(--font-mono)' }}>slip.vercel.app</div>
            </div>
          </div>
        </div>

        {/* Prototype Actions */}
        <div className="modal-actions" style={{ padding: '0 24px 24px' }}>
          <button className="action-x" onClick={shareToX}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Post to X
          </button>
          <div className="action-row">
            <button className="action-btn" onClick={downloadImage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {downloading ? 'Saving...' : 'Save PNG'}
            </button>
            <button className="action-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(()=>setCopied(false), 2000); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button className="action-btn solscan" onClick={() => window.open(`https://solscan.io/tx/${trade.id}`, '_blank')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Solscan ↗
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
