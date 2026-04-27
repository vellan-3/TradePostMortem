'use client';

import { useState, useCallback } from 'react';
import Nav from '@/components/Nav';
import type { TradeAnalysis, PatternTax, TradingGrade, WalletSummary } from '@/types';

interface PayslipData {
  analyses: TradeAnalysis[];
  summary: WalletSummary;
  patternTax: PatternTax;
  grade: TradingGrade;
}

const DIAGNOSIS_LABELS: Record<string, string> = {
  BOUGHT_THE_TOP:      'Bought the Top',
  SOLD_THE_BOTTOM:     'Sold the Bottom',
  PAPER_HANDS:         'Paper Hands',
  DIAMOND_HANDS_REKT:  'Diamond Hands Rekt',
  GOOD_TRADE:          'Good Trade',
  UNKNOWN:             'Unknown',
};

const DIAGNOSIS_PILL: Record<string, string> = {
  BOUGHT_THE_TOP:     'pill-red',
  SOLD_THE_BOTTOM:    'pill-orange',
  PAPER_HANDS:        'pill-yellow',
  DIAMOND_HANDS_REKT: 'pill-red',
  GOOD_TRADE:         'pill-green',
  UNKNOWN:            'pill-yellow',
};

export default function PayslipPage() {
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PayslipData | null>(null);

  const generate = useCallback(async () => {
    const addr = wallet.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/analyze?wallet=${encodeURIComponent(addr)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
      if (!json.analyses?.length) throw new Error('No trades found for this wallet');
      setData(json as PayslipData);
      window.history.replaceState(null, '', `/payslip?wallet=${addr}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') generate();
  };

  return (
    <>
      <Nav active="payslip" />

      <section className="slip-screen slip-screen-wide">
        {/* ── HEADER ── */}
        <div className="slip-screen-header">
          <div className="slip-screen-label lbl-payslip">03 · Payslip</div>
          <h1 className="slip-screen-title">Your Trade Autopsy</h1>
          <p className="slip-screen-sub">
            What it cost you, who won it, and the pattern that keeps repeating.
          </p>
        </div>

        {/* ── INPUT ── */}
        <div
          id="ps-input-row"
          className="slip-input-row"
          style={{ marginBottom: '40px', borderColor: 'var(--slip-border2)' }}
        >
          <input
            id="payslip-wallet-input"
            className="slip-input"
            placeholder="Wallet address..."
            spellCheck={false}
            autoComplete="off"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button
            id="payslip-generate-btn"
            className="slip-btn slip-btn-payslip"
            onClick={generate}
            disabled={loading || !wallet.trim()}
          >
            {loading ? 'Analyzing...' : 'Generate Payslip →'}
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="error-block" style={{ marginBottom: 24 }}>
            <span style={{ marginRight: 8 }}>✕</span>{error}
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div className="v-loading">
            <div className="v-loading-ring" style={{ borderTopColor: 'var(--slip-purple)' }} />
            <p className="v-loading-text">
              Analyzing trades, computing grade, detecting patterns...
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {data && <PayslipResults data={data} />}

        {/* ── EMPTY STATE ── */}
        {!data && !loading && !error && <PayslipEmptyState />}
      </section>
    </>
  );
}

/* ─── EMPTY STATE ─── */
function PayslipEmptyState() {
  return (
    <div className="v-empty">
      <div style={{ fontSize: 13, color: 'var(--slip-muted)', textAlign: 'center', lineHeight: 1.8, maxWidth: 400 }}>
        Paste any Solana wallet address to run a full trade autopsy —
        entry percentile, peak missed, who won the most on each token you traded, and your recurring mistakes.
      </div>
    </div>
  );
}

/* ─── PAYSLIP RESULTS ─── */
function PayslipResults({ data }: { data: PayslipData }) {
  const { analyses, summary, patternTax, grade } = data;
  const [openCard, setOpenCard] = useState<string | null>(null);

  return (
    <>
      {/* ── GRADE HERO ── */}
      <div className="ps-grade-hero">
        <GradeCell label="Overall Grade" grade={grade.overall} score={grade.overallScore} wide />
        <GradeCell label="Entry Discipline" grade={gradeFromScore(grade.entryDiscipline)} score={grade.entryDiscipline} />
        <GradeCell label="Exit Discipline" grade={gradeFromScore(grade.exitDiscipline)} score={grade.exitDiscipline} />
        <GradeCell label="Size Management" grade={gradeFromScore(grade.sizeManagement)} score={grade.sizeManagement} />
        <GradeCell label="Token Selection" grade={gradeFromScore(grade.tokenSelection)} score={grade.tokenSelection} />
      </div>

      {/* ── PATTERN TAX BANNER ── */}
      {patternTax.timesRepeated > 0 && (
        <div className="ps-pattern-tax">
          <div className="ps-pt-icon">⚠</div>
          <div>
            <div className="ps-pt-title">
              You {DIAGNOSIS_LABELS[patternTax.mostCommonMistake]?.toLowerCase() ?? 'made the same mistake'}{' '}
              {patternTax.timesRepeated} times. It cost you {patternTax.totalCostSOL.toFixed(1)} SOL.
            </div>
            <div className="ps-pt-text">
              Your average hold time on losses is{' '}
              <b>{patternTax.avgLossHoldTimeHours.toFixed(1)} hours</b>.
              Winners on those same tokens exited in an average of{' '}
              <b>{(patternTax.avgLossHoldTimeHours * 0.3).toFixed(0)} minutes</b>.
              Winners entered an average of{' '}
              <b>{patternTax.avgWinnerEntryAdvantageMinutes} minutes earlier</b> at a lower market cap.
            </div>
          </div>
        </div>
      )}

      {/* ── SUMMARY STRIP ── */}
      <div className="ps-summary-strip">
        <div className="ps-sum-cell">
          <div className="ps-sum-label">Trades Analyzed</div>
          <div className="ps-sum-val" style={{ color: '#eeeef5' }}>{summary.tradesAnalyzed}</div>
        </div>
        <div className="ps-sum-cell">
          <div className="ps-sum-label">Total P&amp;L</div>
          <div
            className="ps-sum-val"
            style={{ color: summary.totalPnlSOL >= 0 ? 'var(--slip-green)' : 'var(--slip-red)' }}
          >
            {summary.totalPnlSOL >= 0 ? '+' : ''}{summary.totalPnlSOL.toFixed(1)} SOL
          </div>
        </div>
        <div className="ps-sum-cell">
          <div className="ps-sum-label">Left on Table</div>
          <div className="ps-sum-val" style={{ color: 'var(--slip-orange)' }}>
            +{summary.totalLeftOnTable.toFixed(1)} SOL
          </div>
        </div>
        <div className="ps-sum-cell">
          <div className="ps-sum-label">Worst Trade</div>
          <div className="ps-sum-val" style={{ color: 'var(--slip-red)' }}>
            {summary.worstTradePnl.toFixed(1)} SOL
          </div>
        </div>
      </div>

      {/* ── TRADE CARDS ── */}
      {analyses.map((trade, i) => (
        <TradeCard
          key={trade.signature}
          trade={trade}
          rank={i + 1}
          isOpen={openCard === trade.signature}
          onToggle={() => setOpenCard(openCard === trade.signature ? null : trade.signature)}
        />
      ))}
    </>
  );
}

/* ─── GRADE CELL ─── */
function GradeCell({
  label,
  grade,
  score,
  wide,
}: {
  label: string;
  grade: string;
  score: number;
  wide?: boolean;
}) {
  const gradeClass =
    grade === 'A' ? 'ps-grade-a' :
    grade === 'B' ? 'ps-grade-b' :
    grade === 'C' ? 'ps-grade-c' :
    grade === 'D' ? 'ps-grade-d' :
    'ps-grade-f';

  return (
    <div className={`ps-grade-cell ${wide ? 'ps-grade-cell-wide' : ''}`}>
      <div className="ps-grade-label">{label}</div>
      <div className={`ps-grade-letter ${gradeClass}`} style={wide ? {} : { fontSize: 32 }}>
        {grade}
      </div>
      <div className="ps-grade-score">{score} / 100</div>
    </div>
  );
}

/* ─── TRADE CARD ─── */
function TradeCard({
  trade,
  rank,
  isOpen,
  onToggle,
}: {
  trade: TradeAnalysis;
  rank: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pnl = trade.realizedPnlSOL ?? trade.unrealizedPnlSOL ?? 0;
  const rankClass = rank === 1 ? 'ps-rank-1' : rank === 2 ? 'ps-rank-2' : rank === 3 ? 'ps-rank-3' : '';
  const pillClass = DIAGNOSIS_PILL[trade.diagnosis] ?? 'pill-yellow';
  const diagLabel = DIAGNOSIS_LABELS[trade.diagnosis] ?? trade.diagnosis;

  const date = new Date(trade.entryTimestamp * 1000).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  return (
    <div className={`ps-card ${isOpen ? 'ps-card-open' : ''}`}>
      {/* ── TOP ROW ── */}
      <div className="ps-card-top" onClick={onToggle}>
        <div className={`ps-rank ${rankClass}`}>{rank}</div>

        <div className="ps-left">
          <div className="ps-token">
            ${trade.tokenSymbol || '???'}
            <span className={`diag-pill ${pillClass}`}>{diagLabel}</span>
          </div>
          <div className="ps-date">{date} UTC</div>
        </div>

        <div className="ps-winner-mini">
          {/* placeholder — extend with per-token MIRROR data in v2 */}
          <span style={{ color: 'var(--slip-muted)' }}>Top winner data</span>
          <br />
          <span style={{ color: 'var(--slip-muted)', fontSize: 10 }}>→ Run MIRROR for full view</span>
        </div>

        <div className="ps-pnl">
          <div
            className="ps-pnl-val"
            style={{ color: pnl >= 0 ? 'var(--slip-green)' : 'var(--slip-red)' }}
          >
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} SOL
          </div>
          <div className="ps-pnl-label">
            {trade.realizedPnlSOL !== null ? 'Realized' : 'Unrealized'} · Damage {Math.round(trade.damageScore)}
          </div>
        </div>
      </div>

      {/* ── EXPANDED DETAIL ── */}
      {isOpen && (
        <div className="ps-detail">
          <div className="ps-detail-grid">
            {/* Your Trade */}
            <div className="ps-detail-half">
              <div className="ps-dht ps-dht-you">◉ Your Trade</div>
              {trade.entryPrice && (
                <div className="ps-stat">
                  <span className="ps-stat-key">Entry Price</span>
                  <span className="ps-stat-val">${formatPrice(trade.entryPrice)}</span>
                </div>
              )}
              {trade.entryPercentile && (
                <div className="ps-stat">
                  <span className="ps-stat-key">Entry Percentile</span>
                  <span
                    className="ps-stat-val"
                    style={{ color: trade.diagnosis === 'BOUGHT_THE_TOP' ? 'var(--slip-red)' : 'var(--slip-green)' }}
                  >
                    {trade.entryPercentile}
                  </span>
                </div>
              )}
              {trade.exitPrice && (
                <div className="ps-stat">
                  <span className="ps-stat-key">Exit Price</span>
                  <span className="ps-stat-val">${formatPrice(trade.exitPrice)}</span>
                </div>
              )}
              {trade.peakPriceAfterEntry && (
                <div className="ps-stat">
                  <span className="ps-stat-key">Peak After Entry</span>
                  <span className="ps-stat-val" style={{ color: 'var(--slip-green)' }}>
                    ${formatPrice(trade.peakPriceAfterEntry)}
                  </span>
                </div>
              )}
              <div className="ps-stat">
                <span className="ps-stat-key">SOL Spent</span>
                <span className="ps-stat-val">{trade.solSpent.toFixed(2)} SOL</span>
              </div>
              {trade.solReceived !== null && (
                <div className="ps-stat">
                  <span className="ps-stat-key">SOL Received</span>
                  <span
                    className="ps-stat-val"
                    style={{ color: trade.solReceived >= trade.solSpent ? 'var(--slip-green)' : 'var(--slip-red)' }}
                  >
                    {trade.solReceived.toFixed(2)} SOL
                  </span>
                </div>
              )}
              {trade.leftOnTable !== null && trade.leftOnTable > 0 && (
                <div className="ps-stat">
                  <span className="ps-stat-key">Left on Table</span>
                  <span className="ps-stat-val" style={{ color: 'var(--slip-orange)' }}>
                    +{trade.leftOnTable.toFixed(2)} SOL
                  </span>
                </div>
              )}
            </div>

            {/* Diagnosis */}
            <div className="ps-detail-half">
              <div className="ps-dht ps-dht-diag">◈ Diagnosis</div>
              <div className="ps-stat">
                <span className="ps-stat-key">Verdict</span>
                <span className={`ps-stat-val diag-pill ${pillClass}`}>{diagLabel}</span>
              </div>
              <div className="ps-stat">
                <span className="ps-stat-key">Damage Score</span>
                <span
                  className="ps-stat-val"
                  style={{
                    color:
                      trade.damageScore > 70 ? 'var(--slip-red)' :
                      trade.damageScore > 40 ? 'var(--slip-orange)' :
                      'var(--slip-yellow)',
                  }}
                >
                  {Math.round(trade.damageScore)} / 100
                </span>
              </div>
              {trade.peakPnlSOL !== null && (
                <div className="ps-stat">
                  <span className="ps-stat-key">Peak P&amp;L Available</span>
                  <span className="ps-stat-val" style={{ color: 'var(--slip-green)' }}>
                    +{trade.peakPnlSOL.toFixed(2)} SOL
                  </span>
                </div>
              )}
              <div className="ps-stat">
                <span className="ps-stat-key">Source</span>
                <span className="ps-stat-val">{trade.source}</span>
              </div>
            </div>
          </div>

          {/* Why block */}
          <div className="ps-why-block">
            <b>Analysis:</b> {trade.diagnosisText}
          </div>

          {/* Actions */}
          <div className="ps-actions">
            <a
              href={`/mirror?mint=${trade.tokenMint}`}
              className="ps-action-btn"
            >
              See Mirror →
            </a>
            <a
              href={`/verdict?mint=${trade.tokenMint}`}
              className="ps-action-btn"
            >
              Run Verdict →
            </a>
            <a
              href={`https://solscan.io/tx/${trade.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ps-action-btn"
            >
              Solscan ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── HELPERS ─── */
function gradeFromScore(n: number): string {
  if (n >= 80) return 'A';
  if (n >= 65) return 'B';
  if (n >= 50) return 'C';
  if (n >= 35) return 'D';
  return 'F';
}

function formatPrice(p: number): string {
  if (p < 0.0001) return p.toExponential(2);
  if (p < 1) return p.toFixed(6);
  if (p < 1000) return p.toFixed(4);
  return p.toLocaleString();
}
