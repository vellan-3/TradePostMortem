'use client';

import { useRef, useCallback, useState } from 'react';
import { TradeAnalysis } from '@/types';
import { diagnosisColor, diagnosisLabel } from './ScoreBadge';

interface ShareCardProps {
  trade: TradeAnalysis;
  wallet: string;
  onClose: () => void;
}

function shortWallet(w: string) {
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

function pnlStr(trade: TradeAnalysis) {
  const pnl = trade.realizedPnlSOL ?? trade.unrealizedPnlSOL;
  if (pnl === null) return '— SOL';
  return `${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} SOL`;
}

function monthYear(ts: number) {
  return new Date(ts * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export default function ShareCard({ trade, wallet, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copying, setCopying] = useState(false);
  const color = diagnosisColor(trade.diagnosis);
  const pnl = trade.realizedPnlSOL ?? trade.unrealizedPnlSOL;
  const pnlColor = pnl !== null && pnl >= 0 ? 'var(--green)' : 'var(--red)';

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(cardRef.current, { width: 800, height: 420 });
      const link = document.createElement('a');
      link.download = `trade-autopsy-${trade.tokenSymbol}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('PNG export failed:', e);
    }
  }, [trade.tokenSymbol]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/analyze/${wallet}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  }, [wallet]);

  const handleShareX = useCallback(() => {
    const pnlDisplay = pnlStr(trade);
    const appUrl = window.location.origin;
    const text = encodeURIComponent(
      `Just ran my wallet through SLIP\n\n` +
      `$${trade.tokenSymbol}: ${diagnosisLabel(trade.diagnosis).toUpperCase()} — ${pnlDisplay}\n\n` +
      `See the full onchain breakdown: ${appUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [trade]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">Share Your L</div>

        {/* ── Preview card (gets exported as PNG) ── */}
        <div
          ref={cardRef}
          className="share-card-preview"
          style={{ borderColor: color }}
        >
          <div className="sc-eyebrow">TRADE AUTOPSY · SLIP</div>
          <div className="sc-diagnosis" style={{ color }}>
            {diagnosisLabel(trade.diagnosis).toUpperCase()}
          </div>
          <div className="sc-token">${trade.tokenSymbol} · Solana</div>
          <div className="sc-desc">
            {trade.diagnosisText.slice(0, 140)}
            {trade.diagnosisText.length > 140 ? '...' : ''}
          </div>

          <div className="sc-pnl" style={{ color: pnlColor }}>
            {pnlStr(trade)}
          </div>

          <div className="sc-footer">
            <div className="sc-brand">SLIP</div>
            <div>
              {shortWallet(wallet)} · {monthYear(trade.entryTimestamp)}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="modal-actions">
          <button className="btn-share" onClick={handleCopyLink}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {copying ? 'Copied!' : 'Copy Link'}
          </button>

          <button className="btn-share-x" onClick={handleShareX}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Post to X
          </button>

          <button className="btn-share" onClick={handleDownload}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Save PNG
          </button>
        </div>
      </div>
    </div>
  );
}
