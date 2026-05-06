'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TradeAnalysis } from '@/types';
import {
  diagnosisColor,
  diagnosisPillClass,
  diagnosisBlockClass,
  diagnosisLabel,
} from './ScoreBadge';
import ShareCard from './ShareCard';
import { playLossTrade } from '@/lib/sound';
import { EASE_OUT_EXPO } from '@/lib/motion';

const LOSS_DIAGNOSES = ['BOUGHT_THE_TOP', 'DIAMOND_HANDS_REKT', 'SOLD_THE_BOTTOM', 'PAPER_HANDS'];

interface TradeCardProps {
  trade: TradeAnalysis;
  rank: number;
  wallet: string;
}

function formatPrice(p: number | null): string {
  if (p === null) return 'N/A';
  if (p < 0.0001) return `$${p.toExponential(2)}`;
  if (p < 1) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(4)}`;
}

function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  }) + ' UTC';
}

function pnlSign(val: number | null): string {
  if (val === null) return '';
  return val >= 0 ? '+' : '';
}

function DamageRing({ score, color }: { score: number; color: string }) {
  const size = 44;
  const r = 18;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="trade-dmg">
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border)" strokeWidth={3} />
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            color: 'var(--text)',
          }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

export default function TradeCard({ trade, rank, wallet }: TradeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const pnl = trade.realizedPnlSOL ?? trade.unrealizedPnlSOL;
  const pnlLabel = trade.realizedPnlSOL !== null ? 'Realized' : 'Unrealized';
  const pnlColor = pnl !== null && pnl >= 0 ? 'var(--green)' : 'var(--red)';
  const color = diagnosisColor(trade.diagnosis);
  const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : '';

  const solscanUrl = `https://solscan.io/tx/${trade.signature}`;

  return (
    <>
      <div
        className={`trade-card ${expanded ? 'expanded' : ''}`}
        style={{ animationDelay: `${(rank - 1) * 0.07}s` }}
      >
        {/* ── Card header (always visible) ── */}
        <div className="trade-card-top" onClick={() => {
          const opening = !expanded;
          setExpanded(opening);
          if (opening && LOSS_DIAGNOSES.includes(trade.diagnosis)) {
            playLossTrade();
          }
        }}>
          <div className={`trade-rank ${rankClass}`}>{rank}</div>

          <div className="trade-info">
            <div className="trade-token">
              ${trade.tokenSymbol}
              <span className={`diagnosis-pill ${diagnosisPillClass(trade.diagnosis)}`}>
                {diagnosisLabel(trade.diagnosis)}
              </span>
            </div>
            <div className="trade-date">{formatTs(trade.entryTimestamp)}</div>
          </div>

          <div className="trade-pnl">
            {pnl !== null ? (
              <>
                <div className="trade-pnl-val" style={{ color: pnlColor }}>
                  {pnlSign(pnl)}{pnl.toFixed(2)} SOL
                </div>
                <div className="trade-pnl-label">{pnlLabel}</div>
              </>
            ) : (
              <div className="trade-pnl-val" style={{ color: 'var(--muted)' }}>—</div>
            )}
          </div>

          <DamageRing score={trade.damageScore} color={color} />
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="trade-detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height:  { duration: 0.32, ease: EASE_OUT_EXPO },
                opacity: { duration: 0.2, delay: expanded ? 0.08 : 0 },
              }}
              style={{ overflow: 'hidden' }}
            >
              <div className="detail-grid">
                <div className="detail-box">
                  <div className="detail-box-label">Entry Price</div>
                  <div className="detail-box-val">{formatPrice(trade.entryPrice)}</div>
                  <div className="detail-box-sub">
                    {trade.entryPercentile || `${formatTs(trade.entryTimestamp)}`}
                  </div>
                </div>

                <div className="detail-box">
                  <div className="detail-box-label">
                    {trade.exitTimestamp ? 'Exit Price' : 'Current Price'}
                  </div>
                  <div className="detail-box-val" style={{ color: pnlColor }}>
                    {formatPrice(trade.exitPrice ?? trade.currentPrice)}
                  </div>
                  <div className="detail-box-sub">
                    {pnl !== null
                      ? `${pnlSign(pnl)}${pnl.toFixed(2)} SOL ${pnlLabel.toLowerCase()}`
                      : 'No exit on record'}
                  </div>
                </div>

                <div className="detail-box">
                  <div className="detail-box-label">Peak After Entry</div>
                  <div className="detail-box-val" style={{ color: 'var(--green)' }}>
                    {formatPrice(trade.peakPriceAfterEntry)}
                  </div>
                  <div className="detail-box-sub">
                    {trade.peakPnlSOL !== null
                      ? `Could have been +${trade.peakPnlSOL.toFixed(2)} SOL`
                      : 'No OHLCV data'}
                  </div>
                </div>

                <div className="detail-box">
                  <div className="detail-box-label">SOL Spent</div>
                  <div className="detail-box-val">{trade.solSpent.toFixed(3)} SOL</div>
                  <div className="detail-box-sub">Position size</div>
                </div>

                <div className="detail-box">
                  <div className="detail-box-label">SOL Received</div>
                  <div className="detail-box-val" style={{ color: pnlColor }}>
                    {trade.solReceived !== null
                      ? `${trade.solReceived.toFixed(3)} SOL`
                      : 'Still holding'}
                  </div>
                  <div className="detail-box-sub">From exit</div>
                </div>

                <div className="detail-box">
                  <div className="detail-box-label">Left on Table</div>
                  <div
                    className="detail-box-val"
                    style={{ color: trade.leftOnTable ? 'var(--orange)' : 'var(--muted)' }}
                  >
                    {trade.leftOnTable !== null
                      ? `+${trade.leftOnTable.toFixed(2)} SOL`
                      : '—'}
                  </div>
                  <div className="detail-box-sub">Peak vs actual</div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className={`diagnosis-block ${diagnosisBlockClass(trade.diagnosis)}`}>
                {trade.diagnosisText || 'No diagnosis available for this trade.'}
              </div>

              {/* Optimal exit note */}
              {trade.peakPnlSOL !== null && (
                <div className="optimal-block">
                  <div className="optimal-label">Optimal Exit</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7 }}>
                    {trade.exitTimestamp
                      ? `Peak of +${trade.peakPnlSOL.toFixed(2)} SOL was available before your exit.`
                      : `Peak unrealized gain was +${trade.peakPnlSOL.toFixed(2)} SOL.`}
                    {trade.leftOnTable !== null && trade.leftOnTable > 0
                      ? ` You left ${trade.leftOnTable.toFixed(2)} SOL on the table.`
                      : ''}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="detail-actions">
                <button
                  className="btn-share"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareOpen(true);
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share Autopsy Card
                </button>

                {trade.signature && (
                  <a
                    href={solscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-share"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View on Solscan
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share modal */}
      {shareOpen && (
        <ShareCard
          trade={trade}
          wallet={wallet}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
