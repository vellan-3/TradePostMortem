'use client';

import { useState } from 'react';
import Link from 'next/link';
import TradeCard from '@/components/TradeCard';
import ScoreBadge from '@/components/ScoreBadge';
import { TradeAnalysis, WalletSummary } from '@/types';

interface ResultsViewProps {
  wallet: string;
  analyses: TradeAnalysis[];
  summary: WalletSummary;
}

type SortMode = 'worst' | 'recent' | 'size';

function shortWallet(w: string) {
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

function formatSol(n: number, sign = false): string {
  const s = sign && n > 0 ? '+' : '';
  return `${s}${n.toFixed(2)} SOL`;
}

export default function ResultsView({ wallet, analyses, summary }: ResultsViewProps) {
  const [sort, setSort] = useState<SortMode>('worst');

  const sorted = [...analyses].sort((a, b) => {
    if (sort === 'worst') return b.damageScore - a.damageScore;
    if (sort === 'recent') return b.entryTimestamp - a.entryTimestamp;
    if (sort === 'size') return b.solSpent - a.solSpent;
    return 0;
  });

  const gradeClass = `score-${summary.overallGrade.toLowerCase()}`;

  return (
    <>
      {/* ── Results header ── */}
      <div className="results-header animate-fade-up">
        <div className="results-wallet-tag">
          Analyzed · {shortWallet(wallet)}
        </div>
        <h1 className="results-title">
          Your Trade Autopsy
          <ScoreBadge grade={summary.overallGrade} />
        </h1>
        <div className="results-meta">
          <span>
            <b>{summary.tradesAnalyzed}</b>&nbsp;trades analyzed
          </span>
          <span>
            <b style={{ color: summary.totalPnlSOL >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatSol(summary.totalPnlSOL, true)}
            </b>
            &nbsp;total P&amp;L
          </span>
          {summary.totalLeftOnTable > 0 && (
            <span>
              <b style={{ color: 'var(--orange)' }}>
                +{formatSol(summary.totalLeftOnTable)}
              </b>
              &nbsp;left on table
            </span>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="summary-strip">
        <div className="summary-cell">
          <div className="summary-label">Worst Trade</div>
          <div className={`summary-val ${summary.worstTradePnl < 0 ? 'val-red' : 'val-green'}`}>
            {formatSol(summary.worstTradePnl, true)}
          </div>
        </div>
        <div className="summary-cell">
          <div className="summary-label">Left on Table</div>
          <div className="summary-val val-orange">
            {summary.totalLeftOnTable > 0 ? `+${formatSol(summary.totalLeftOnTable)}` : '—'}
          </div>
        </div>
        <div className="summary-cell">
          <div className="summary-label">Avg Entry Pct</div>
          <div className="summary-val val-text">
            {summary.avgEntryPercentile !== null
              ? `${summary.avgEntryPercentile.toFixed(0)}th`
              : '—'}
          </div>
        </div>
        <div className="summary-cell">
          <div className="summary-label">Damage Score</div>
          <div className="summary-val val-red">
            {summary.avgDamageScore.toFixed(0)}/100
          </div>
        </div>
      </div>

      {/* ── Sort tabs ── */}
      <div className="sort-tabs">
        {(['worst', 'recent', 'size'] as SortMode[]).map((mode) => (
          <button
            key={mode}
            className={`sort-tab ${sort === mode ? 'active' : ''}`}
            onClick={() => setSort(mode)}
          >
            {mode === 'worst' ? 'Worst First' : mode === 'recent' ? 'Most Recent' : 'Biggest Size'}
          </button>
        ))}
      </div>

      {/* ── Trades ── */}
      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">No trades to show</div>
          <p>This wallet has no analyzable swap history. Try a different address.</p>
        </div>
      ) : (
        <div className="trades-list">
          {sorted.map((trade, i) => (
            <TradeCard
              key={`${trade.tokenMint}-${trade.entryTimestamp}`}
              trade={trade}
              rank={i + 1}
              wallet={wallet}
            />
          ))}
        </div>
      )}

      {/* ── Back link ── */}
      <Link href="/" className="btn-new">
        ← Analyze another wallet
      </Link>
    </>
  );
}
