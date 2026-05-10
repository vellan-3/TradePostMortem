'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';

export default function ShareModal({ trade, onClose }: { trade: any; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [walletShort, setWalletShort] = useState('');

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    // Pull wallet from URL e.g. /payslip?wallet=3XSY...
    const params = new URLSearchParams(window.location.search);
    const w = params.get('wallet') || '';
    setWalletShort(w ? `${w.slice(0, 6)}...${w.slice(-4)}` : '');

    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mounted) return null;

  /* ── Data helpers ───────────────────────────────────────── */
  const diagnosis    = (trade.diagnosisLabel || 'TRADE AUTOPSY').toUpperCase();
  const isPos        = trade.pnlSol >= 0;
  const accentColor  = isPos ? '#10b981' : '#ff3232';
  const glowColor    = isPos ? 'rgba(16,185,129,0.18)' : 'rgba(255,50,50,0.18)';
  const pnlStr       = `${isPos ? '+' : ''}${trade.pnlSol.toFixed(1)}`;

  // yourTrade is an array of { label, value } — map by label name
  const stat = (label: string) =>
    trade.yourTrade?.find((s: any) => s.label === label)?.value ?? '—';

  const entryPrice   = stat('Entry Price');
  const entryPct     = stat('Entry Percentile');
  const peakPrice    = stat('Peak After Entry') !== '—' ? stat('Peak After Entry') : stat('Exit Price');
  const leftOnTable  = stat('Left on Table');

  const winnerPnl    = trade.topWinner ? `+${trade.topWinner.totalPnlSol.toFixed(1)} SOL` : '—';
  const winnerSub    = trade.topWinner?.entryTimingLabel ?? '';

  // "Entered $240k mcap" — comes from entryMarketCap on the trade object
  const youSub = trade.entryMarketCap
    ? `Entered $${(trade.entryMarketCap / 1000).toFixed(0)}k mcap`
    : trade.yourTrade?.find((s: any) => s.label === 'Entry Market Cap')?.value
      ? `Entered ${trade.yourTrade.find((s: any) => s.label === 'Entry Market Cap').value}`
      : '';

  /* ── Download ───────────────────────────────────────────── */
  const downloadImage = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: '#06060a',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.download = `slip-${trade.tokenSymbol.toLowerCase()}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  /* ── Tweet ──────────────────────────────────────────────── */
  const shareToX = () => {
    const text =
      `Just ran my trades through SLIP 🔍\n\n` +
      `$${trade.tokenSymbol}: ${diagnosis} — ${pnlStr} SOL\n\n` +
      `The tool shows exactly who won your money and why.\n\n` +
      `slip.vercel.app\n\n#Solana #OnchainTrading`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  /* ── Modal ──────────────────────────────────────────────── */
  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '24px',
      }}
    >
      {/* modal-box — stop click propagation */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#0e0e14',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '20px',
          overflow: 'hidden',
          animation: 'modal-in .22s cubic-bezier(.16,1,.3,1) both',
        }}
      >
        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-eyebrow">Share Payslip</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Share Card ── */}
        <div className="card-wrap">
          <div
            ref={cardRef}
            className="share-card"
            style={{ '--accent-color': accentColor, '--glow-color': glowColor } as any}
          >
            {/* Top row */}
            <div className="card-top">
              <div className="card-top-left">
                <div className="card-slip-label">
                  <span className="card-slip-dot"></span>
                  SLIP · TRADE AUTOPSY
                </div>
                <div className="card-diagnosis">{diagnosis}</div>
                <div className="card-token-row">
                  <span className="card-symbol">${trade.tokenSymbol}</span>
                  <span className="card-date">{trade.entryDisplay}</span>
                </div>
              </div>

              <div className="card-pnl-block">
                <div className="card-pnl-label">Realized P&L</div>
                <div className="card-pnl-value">{pnlStr}</div>
                <div className="card-pnl-sol">SOL</div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="card-stats">
              <div className="card-stat">
                <div className="card-stat-lbl">Entry Price</div>
                <div className="card-stat-val">{entryPrice}</div>
              </div>
              <div className="card-stat">
                <div className="card-stat-lbl">Entry Percentile</div>
                <div className={`card-stat-val ${!isPos ? 'red' : 'green'}`}>{entryPct}</div>
              </div>
              <div className="card-stat">
                <div className="card-stat-lbl">Peak After Entry</div>
                <div className="card-stat-val green">{peakPrice}</div>
              </div>
              <div className="card-stat">
                <div className="card-stat-lbl">Left on Table</div>
                <div className="card-stat-val amber">{leftOnTable}</div>
              </div>
            </div>

            {/* Winner comparison bar */}
            <div className="card-winner-bar">
              <div className="winner-bar-you">
                <div className="winner-bar-lbl">You</div>
                <div className="winner-bar-val" style={{ color: accentColor }}>{pnlStr} SOL</div>
                {youSub && <div className="winner-bar-sub">{youSub}</div>}
              </div>

              <div className="winner-bar-sep"></div>

              <div className="winner-bar-winner">
                <div className="winner-bar-lbl" style={{ color: '#10b981' }}>Top Winner</div>
                <div className="winner-bar-val" style={{ color: '#10b981' }}>{winnerPnl}</div>
                {winnerSub && <div className="winner-bar-sub">{winnerSub}</div>}
              </div>
            </div>

            {/* Narrative */}
            <div className="card-narrative">{trade.narrative}</div>

            {/* Footer */}
            <div className="card-footer">
              <div className="card-footer-left">
                <div className="card-brand">
                  <div className="card-brand-dot"></div>
                  SLIP
                </div>
                {walletShort && <div className="card-wallet">{walletShort}</div>}
              </div>
              <div className="card-footer-right">slip.vercel.app</div>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="modal-actions">
          <button className="action-x" onClick={shareToX}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Post to X
          </button>

          <div className="action-row">
            <button className="action-btn" onClick={downloadImage} disabled={downloading}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {downloading ? 'Saving...' : 'Save JPEG'}
            </button>

            <button className="action-btn" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            <button
              className="action-btn solscan"
              onClick={() => window.open(`https://solscan.io/tx/${trade.id}`, '_blank')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Solscan ↗
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
