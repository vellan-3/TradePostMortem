'use client';

import { useRef, useState, useCallback } from 'react';
import type { PayslipTradeCard } from '@/types';

interface Props {
  trade: PayslipTradeCard;
  onClose: () => void;
}

const DIAG_COLOR: Record<string, string> = {
  'Bought the Top':     '#ff3232',
  'Sold the Bottom':    '#ff7a1a',
  'Paper Hands':        '#f5c200',
  'Diamond Hands Rekt': '#ff3232',
  'Good Trade':         '#00d68a',
  'Unknown':            '#f5c200',
};

export default function ShareModal({ trade, onClose }: Props) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const diagColor  = DIAG_COLOR[trade.diagnosisLabel] ?? '#f5c200';
  const pnlPos     = trade.pnlSol >= 0;
  const pnlColor   = pnlPos ? '#00d68a' : '#ff3232';
  const pnlDisplay = `${pnlPos ? '+' : ''}${trade.pnlSol.toFixed(1)}`;

  const narrative = trade.narrative.length > 200
    ? trade.narrative.slice(0, 197) + '…'
    : trade.narrative;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/payslip?wallet=${encodeURIComponent(trade.wallet)}`
    : '';

  /* ── actions ── */
  const copyLink = useCallback(async () => {
    setCopying(true);
    try { await navigator.clipboard.writeText(shareUrl); } catch {}
    setTimeout(() => setCopying(false), 1600);
  }, [shareUrl]);

  const postToX = useCallback(() => {
    const text = [
      `Just ran my trade autopsy on $${trade.tokenSymbol} — ${trade.diagnosisLabel}.`,
      `${pnlDisplay} SOL realized.`,
      ``,
      `Check your trades on SLIP 👇`,
      shareUrl,
    ].join('\n');
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      '_blank',
    );
  }, [trade, pnlDisplay, shareUrl]);

  const savePng = useCallback(async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0d0d1a',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `slip-${trade.tokenSymbol.toLowerCase()}-autopsy.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('html2canvas error', e);
    } finally {
      setSaving(false);
    }
  }, [trade]);

  return (
    <div className="modal open" onClick={onClose}>
      <div className="modal-inner" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Your SLIP Card</div>

        <div className="slip-share-card" ref={cardRef}>
          <div className="ssc-inner">
            <div className="ssc-eyebrow">PAYSLIP · SLIP · SOLANA</div>
            <div className="ssc-diag" style={{ color: diagColor }}>{trade.diagnosisLabel.toUpperCase()}</div>
            <div className="ssc-token">${trade.tokenSymbol} · {trade.entryDisplay}</div>
            <div className="ssc-text">{narrative}</div>
          </div>
          <div className="ssc-pnl" style={{ color: pnlColor }}>
            {pnlDisplay}<br/><span style={{ fontSize: 14, letterSpacing: 0 }}>SOL</span>
          </div>
          <div className="ssc-footer">
            <div className="ssc-brand">SLIP</div>
            <div>slip.xyz · onchain trade intelligence</div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="action-btn" onClick={copyLink} disabled={copying}>
            {copying ? '✓ Copied!' : 'Copy Link'}
          </button>
          <button className="action-btn x-action" onClick={postToX} style={{ background: '#000', color: '#fff', border: '1px solid #333' }}>
            Post to 𝕏
          </button>
          <button className="action-btn" onClick={savePng} disabled={saving}>
            {saving ? 'Saving…' : 'Save PNG'}
          </button>
        </div>
      </div>
    </div>
  );
}
