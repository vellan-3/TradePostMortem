'use client';

import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';

export default function ShareModal({ trade, onClose }: { trade: any; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState('7xKXtg...sAsU');

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Try to get wallet from URL
    const params = new URLSearchParams(window.location.search);
    const wallet = params.get('wallet');
    if (wallet) {
      setWalletAddress(`${wallet.slice(0, 6)}...${wallet.slice(-4)}`);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
        style: {
          transform: 'scale(1)',
          borderRadius: '0',
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

  // Extract stats for the grid
  const stats = [
    { label: 'Entry Price', value: trade.yourTrade?.find((s: any) => s.label === 'Entry Price')?.value || '—' },
    { 
      label: 'Entry Percentile', 
      value: trade.yourTrade?.find((s: any) => s.label === 'Entry Percentile')?.value || '—',
      colorClass: trade.diagnosis === 'BOUGHT_THE_TOP' ? 'red' : ''
    },
    { label: 'Peak After Entry', value: trade.yourTrade?.find((s: any) => s.label === 'Peak After Entry')?.value || '—', colorClass: 'green' },
    { label: 'Left on Table', value: trade.yourTrade?.find((s: any) => s.label === 'Left on Table')?.value || '—', colorClass: 'amber' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', zIndex: 9999 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-eyebrow">Share Payslip</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Card preview */}
        <div className="card-wrap">
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
            {/* Top row */}
            <div className="card-top">
              <div className="card-top-left">
                <div className="card-slip-label">
                  <span className="card-slip-dot" style={{ background: accentColor }}></span>
                  SLIP · TRADE AUTOPSY
                </div>
                <div className="card-diagnosis" style={{ color: accentColor }}>{diagnosis}</div>
                <div className="card-token-row">
                  <span className="card-symbol">${trade.tokenSymbol}</span>
                  <span className="card-date">{trade.entryDisplay}</span>
                </div>
              </div>

              <div className="card-pnl-block">
                <div className="card-pnl-label">Realized P&L</div>
                <div className="card-pnl-value" style={{ color: accentColor }}>
                   {isPos ? '+' : ''}{trade.pnlSol.toFixed(1)}
                </div>
                <div className="card-pnl-sol">SOL</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="card-stats">
              {stats.map((s, i) => (
                <div className="card-stat" key={i}>
                  <div className="card-stat-lbl">{s.label}</div>
                  <div className={`card-stat-val ${s.colorClass || ''}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Winner comparison bar */}
            <div className="card-winner-bar">
              <div className="winner-bar-you">
                <div className="winner-bar-lbl">You</div>
                <div className="winner-bar-val" style={{ color: accentColor }}>
                  {trade.pnlSol.toFixed(1)} SOL
                </div>
                <div className="winner-bar-sub">Entered {trade.entryMarketCapLabel || 'early'}</div>
              </div>

              <div className="winner-bar-sep"></div>

              <div className="winner-bar-winner">
                <div className="winner-bar-lbl" style={{ color: '#10b981' }}>Top Winner</div>
                <div className="winner-bar-val" style={{ color: '#10b981' }}>
                  +{trade.topWinner?.totalPnlSol.toFixed(1)} SOL
                </div>
                <div className="winner-bar-sub">{trade.topWinner?.entryTimingLabel}</div>
              </div>
            </div>

            {/* Narrative */}
            <div className="card-narrative" style={{ borderLeftColor: accentColor }}>
              {trade.narrative}
            </div>

            {/* Footer */}
            <div className="card-footer">
              <div className="card-footer-left">
                <div className="card-brand">
                  <div className="card-brand-dot"></div>
                  SLIP
                </div>
                <div className="card-wallet">{walletAddress}</div>
              </div>
              <div className="card-footer-right">slip.vercel.app</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="action-x" onClick={shareToX}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Post to X
          </button>

          <div className="action-row">
            <button className="action-btn" onClick={downloadImage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? 'Saving...' : 'Save PNG'}
            </button>
            <button className="action-btn" onClick={copyLink}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button className="action-btn solscan" onClick={() => window.open(`https://solscan.io/tx/${trade.id}`, '_blank')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Solscan ↗
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
