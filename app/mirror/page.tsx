'use client';

import { useState, useCallback } from 'react';
import Nav from '@/components/Nav';
import type { MirrorResult, WinnerWallet } from '@/lib/mirror-engine';

export default function MirrorPage() {
  const [mint, setMint] = useState('');
  const [sol, setSol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MirrorResult | null>(null);

  const fetchMirror = useCallback(async () => {
    const addr = mint.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ mint: addr });
      if (sol.trim()) params.set('sol', sol.trim());
      const res = await fetch(`/api/mirror?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fetch failed');
      setResult(data as MirrorResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [mint, sol]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchMirror();
  };

  return (
    <>
      <Nav active="mirror" />

      <section className="slip-screen slip-screen-wide">
        {/* ── HEADER ── */}
        <div className="slip-screen-header">
          <div className="slip-screen-label lbl-mirror">02 · Mirror</div>
          <h1 className="slip-screen-title">Winner Leaderboard</h1>
          <p className="slip-screen-sub">
            See who is winning your token right now — and exactly how they&apos;re doing it.
          </p>
        </div>

        {/* ── INPUT ROW ── */}
        <div className="m-inputs">
          <div className="m-input-wrap m-input-wrap-first">
            <label className="m-input-label">Token Contract</label>
            <input
              id="mirror-mint-input"
              className="m-input"
              placeholder="Token mint address..."
              spellCheck={false}
              autoComplete="off"
              value={mint}
              onChange={e => setMint(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
          </div>
          <div className="m-input-wrap">
            <label className="m-input-label">Your Entry (SOL)</label>
            <input
              id="mirror-sol-input"
              className="m-input"
              placeholder="e.g. 5.0"
              value={sol}
              onChange={e => setSol(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
          </div>
          <button
            id="mirror-find-btn"
            className="slip-btn slip-btn-mirror m-find-btn"
            onClick={fetchMirror}
            disabled={loading || !mint.trim()}
          >
            {loading ? 'Scanning...' : 'Find Winners →'}
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
            <div className="v-loading-ring" style={{ borderTopColor: 'var(--slip-blue)' }} />
            <p className="v-loading-text">
              Fetching winner leaderboard and gap analysis...
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && <MirrorResults data={result} userSol={sol ? Number(sol) : null} />}

        {/* ── EMPTY STATE ── */}
        {!result && !loading && !error && <MirrorEmptyState />}
      </section>
    </>
  );
}

/* ─── EMPTY STATE ─── */
function MirrorEmptyState() {
  return (
    <div className="v-empty">
      <div style={{ fontSize: 13, color: 'var(--slip-muted)', textAlign: 'center', lineHeight: 1.8, maxWidth: 400 }}>
        Enter a token mint address to see every wallet currently winning on that token —
        ranked by SOL gained. Optionally enter your position size to see the gap analysis.
      </div>
    </div>
  );
}

/* ─── MIRROR RESULTS ─── */
function MirrorResults({ data, userSol }: { data: MirrorResult; userSol: number | null }) {
  const { winners, topWinner, patternInsights, yourPosition, symbol, totalWinners, totalLosers } = data;

  const [selectedWinner, setSelectedWinner] = useState<WinnerWallet | null>(null);

  return (
    <div className="mirror-layout">
      {/* ── LEADERBOARD ── */}
      <div className="mirror-lb-col">
        {/* Header bar */}
        <div className="mirror-lb-wrap">
          <div className="mirror-lb-top">
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#eeeef5' }}>
              {symbol !== 'UNKNOWN' ? `$${symbol}` : 'Token'} · {totalWinners} winning · {totalLosers} losing
            </span>
          </div>

          <div className="lb-header">
            <span>#</span>
            <span>Wallet</span>
            <span>Total P&amp;L</span>
            <span>ROI</span>
            <span>Hold Time</span>
          </div>

          {winners.slice(0, 15).map((w, i) => (
            <WinnerRow
              key={w.address}
              winner={w}
              rank={i + 1}
              isSelected={selectedWinner?.address === w.address}
              onSelect={() => setSelectedWinner(
                selectedWinner?.address === w.address ? null : w
              )}
            />
          ))}

          {yourPosition && (
            <div className="lb-row lb-row-you">
              <div className="lb-rank" style={{ color: 'var(--slip-purple)' }}>YOU</div>
              <div className="lb-wallet">
                <div className="lb-addr">
                  Your position
                  <span className="lb-tag lb-tag-you">Your Wallet</span>
                </div>
                <div className="lb-entry-info">
                  {yourPosition.solDeployed} SOL deployed
                </div>
              </div>
              <div className={`lb-pnl ${yourPosition.currentPnlSOL < 0 ? 'lb-pnl-neg' : ''}`}>
                {yourPosition.currentPnlSOL >= 0 ? '+' : ''}{yourPosition.currentPnlSOL.toFixed(1)} SOL
              </div>
              <div className="lb-roi" style={{ color: yourPosition.currentPnlPct < 0 ? 'var(--slip-red)' : 'var(--slip-green)' }}>
                {yourPosition.currentPnlPct >= 0 ? '+' : ''}{yourPosition.currentPnlPct.toFixed(0)}%
              </div>
              <div className="lb-hold">Live</div>
            </div>
          )}

          {winners.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--slip-muted)', fontSize: 13 }}>
              No profitable wallets found in the last 24h for this token.
            </div>
          )}
        </div>
      </div>

      {/* ── SIDE PANEL ── */}
      <div className="mirror-side">
        {/* Gap card — only if user gave position */}
        {yourPosition && topWinner && (
          <GapCard yourPosition={yourPosition} topWinner={topWinner} />
        )}

        {/* Pattern insights */}
        {winners.length > 0 && (
          <PatternCard insights={patternInsights} winnerCount={Math.min(totalWinners, 10)} />
        )}

        {/* Selected winner detail */}
        {selectedWinner && (
          <WinnerDetailCard winner={selectedWinner} />
        )}

        {/* No position CTA */}
        {!yourPosition && !userSol && (
          <div className="mirror-cta-card">
            <div className="mirror-cta-label">Compare your position?</div>
            <p className="mirror-cta-text">
              Enter your SOL size in the input above to see how you stack up against the top winner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── WINNER ROW ─── */
function WinnerRow({
  winner,
  rank,
  isSelected,
  onSelect,
}: {
  winner: WinnerWallet;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const rankClass = rank === 1 ? 'lb-rank-1' : rank === 2 ? 'lb-rank-2' : rank === 3 ? 'lb-rank-3' : '';
  const tagClass =
    winner.tag === 'Smart Money' ? 'lb-tag-smart' :
    winner.tag === 'KOL'        ? 'lb-tag-kol' :
    winner.tag === 'Bot'        ? 'lb-tag-bot' : '';

  const holdDisplay =
    winner.holdTimeMinutes === null
      ? 'Still in'
      : winner.holdTimeMinutes < 60
      ? `${winner.holdTimeMinutes}m`
      : `${Math.floor(winner.holdTimeMinutes / 60)}h ${winner.holdTimeMinutes % 60}m`;

  return (
    <div
      className={`lb-row ${rank === 1 ? 'lb-row-top' : ''} ${isSelected ? 'lb-row-selected' : ''}`}
      onClick={onSelect}
    >
      <div className={`lb-rank ${rankClass}`}>{rank}</div>
      <div className="lb-wallet">
        <div className="lb-addr">
          {winner.address.slice(0, 4)}...{winner.address.slice(-4)}
          {winner.tag && (
            <span className={`lb-tag ${tagClass}`}>{winner.tag}</span>
          )}
        </div>
        <div className="lb-entry-info">
          {winner.entryMarketCap
            ? `Entered $${formatMcap(winner.entryMarketCap)} mcap`
            : 'Entry mcap unknown'}
          {winner.entryTimestamp
            ? ` · ${timeAgo(winner.entryTimestamp)}`
            : ''}
        </div>
      </div>
      <div className={`lb-pnl ${winner.totalPnlSOL < 0 ? 'lb-pnl-neg' : ''}`}>
        {winner.totalPnlSOL >= 0 ? '+' : ''}{winner.totalPnlSOL.toFixed(1)} SOL
      </div>
      <div
        className="lb-roi"
        style={{ color: winner.roi >= 0 ? 'var(--slip-green)' : 'var(--slip-red)' }}
      >
        {winner.roi >= 0 ? '+' : ''}{winner.roi.toFixed(0)}%
      </div>
      <div className="lb-hold">
        {winner.tookPartialProfits ? 'Partial exit' : holdDisplay}
      </div>
    </div>
  );
}

/* ─── GAP CARD ─── */
function GapCard({
  yourPosition,
  topWinner,
}: {
  yourPosition: NonNullable<MirrorResult['yourPosition']>;
  topWinner: WinnerWallet;
}) {
  const timingAbs = Math.abs(yourPosition.entryTimingDiffMinutes);
  const timingHuman =
    timingAbs < 60
      ? `${timingAbs}m`
      : `${Math.floor(timingAbs / 60)}h ${timingAbs % 60}m`;
  const late = yourPosition.entryTimingDiffMinutes > 0;

  return (
    <div className="gap-card">
      <div className="gap-label">Your Position vs #1 Winner</div>
      <div className="gap-vs">
        <div className="gap-side">
          <div className="gap-side-label" style={{ color: 'var(--slip-purple)' }}>YOU</div>
          <div
            className="gap-side-val"
            style={{ color: yourPosition.currentPnlSOL >= 0 ? 'var(--slip-green)' : 'var(--slip-red)' }}
          >
            {yourPosition.currentPnlSOL >= 0 ? '+' : ''}{yourPosition.currentPnlSOL.toFixed(1)} SOL
          </div>
          <div className="gap-side-sub">
            {yourPosition.solDeployed} SOL in
          </div>
        </div>
        <div className="gap-divider">vs</div>
        <div className="gap-side" style={{ textAlign: 'right' }}>
          <div className="gap-side-label" style={{ color: 'var(--slip-green)' }}>WINNER</div>
          <div className="gap-side-val" style={{ color: 'var(--slip-green)' }}>
            +{topWinner.totalPnlSOL.toFixed(1)} SOL
          </div>
          <div className="gap-side-sub">
            {topWinner.entryMarketCap
              ? `$${formatMcap(topWinner.entryMarketCap)} mcap entry`
              : 'entry mcap unknown'}
          </div>
        </div>
      </div>

      <div className="gap-stat-row">
        <span className="gap-stat-key">Entry timing</span>
        <span className={`gap-stat-val ${late ? 'gap-neg' : 'gap-pos'}`}>
          You were {timingHuman} {late ? 'later' : 'earlier'}
        </span>
      </div>
      <div className="gap-stat-row">
        <span className="gap-stat-key">SOL gap</span>
        <span className="gap-stat-val gap-neg">
          {yourPosition.vsTopWinnerGapSOL.toFixed(1)} SOL behind
        </span>
      </div>
      <div className="gap-stat-row">
        <span className="gap-stat-key">Your ROI</span>
        <span
          className={`gap-stat-val ${yourPosition.currentPnlPct >= 0 ? 'gap-pos' : 'gap-neg'}`}
        >
          {yourPosition.currentPnlPct >= 0 ? '+' : ''}{yourPosition.currentPnlPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

/* ─── PATTERN CARD ─── */
function PatternCard({
  insights,
  winnerCount,
}: {
  insights: MirrorResult['patternInsights'];
  winnerCount: number;
}) {
  const holdDisplay =
    insights.avgHoldTimeMinutes < 60
      ? `${insights.avgHoldTimeMinutes} min`
      : `${Math.floor(insights.avgHoldTimeMinutes / 60)}h ${insights.avgHoldTimeMinutes % 60}m`;

  return (
    <div className="pattern-card">
      <div className="pattern-title">
        <span style={{ color: 'var(--slip-blue)' }}>◈</span>
        What Top {winnerCount} Winners Had in Common
      </div>

      {insights.avgEntryMarketCap && (
        <div className="pattern-item">
          <span className="pattern-key">Avg entry market cap</span>
          <span className="pattern-val">${formatMcap(insights.avgEntryMarketCap)}</span>
        </div>
      )}
      <div className="pattern-item">
        <span className="pattern-key">Avg hold before exit</span>
        <span className="pattern-val">{holdDisplay}</span>
      </div>
      <div className="pattern-item">
        <span className="pattern-key">Most used DEX</span>
        <span className="pattern-val">{insights.mostUsedDex}</span>
      </div>
      <div className="pattern-item">
        <span className="pattern-key">Took partial profits</span>
        <span className="pattern-val">
          {insights.mostTookPartials ? 'Majority did' : 'Minority did'}
        </span>
      </div>
      {insights.avgSolDeployed > 0 && (
        <div className="pattern-item">
          <span className="pattern-key">Avg size deployed</span>
          <span className="pattern-val">{insights.avgSolDeployed} SOL</span>
        </div>
      )}
    </div>
  );
}

/* ─── WINNER DETAIL CARD ─── */
function WinnerDetailCard({ winner }: { winner: WinnerWallet }) {
  const holdDisplay =
    winner.holdTimeMinutes === null
      ? 'Still in position'
      : winner.holdTimeMinutes < 60
      ? `${winner.holdTimeMinutes} min`
      : `${Math.floor(winner.holdTimeMinutes / 60)}h ${winner.holdTimeMinutes % 60}m`;

  return (
    <div className="winner-detail-card">
      <div className="gap-label">
        Selected Winner · {winner.address.slice(0, 4)}...{winner.address.slice(-4)}
      </div>
      <div className="gap-stat-row">
        <span className="gap-stat-key">Total P&amp;L</span>
        <span className="gap-stat-val gap-pos">+{winner.totalPnlSOL.toFixed(1)} SOL</span>
      </div>
      <div className="gap-stat-row">
        <span className="gap-stat-key">ROI</span>
        <span className="gap-stat-val gap-pos">+{winner.roi.toFixed(0)}%</span>
      </div>
      <div className="gap-stat-row">
        <span className="gap-stat-key">SOL deployed</span>
        <span className="gap-stat-val">{winner.solDeployed.toFixed(1)} SOL</span>
      </div>
      {winner.entryMarketCap && (
        <div className="gap-stat-row">
          <span className="gap-stat-key">Entry market cap</span>
          <span className="gap-stat-val">${formatMcap(winner.entryMarketCap)}</span>
        </div>
      )}
      <div className="gap-stat-row">
        <span className="gap-stat-key">Hold time</span>
        <span className="gap-stat-val">{holdDisplay}</span>
      </div>
      <div className="gap-stat-row">
        <span className="gap-stat-key">Took partials</span>
        <span className="gap-stat-val">{winner.tookPartialProfits ? 'Yes' : 'No'}</span>
      </div>
      {winner.tag && (
        <div className="gap-stat-row">
          <span className="gap-stat-key">Wallet type</span>
          <span className="gap-stat-val">{winner.tag}</span>
        </div>
      )}
    </div>
  );
}

/* ─── HELPERS ─── */
function formatMcap(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toFixed(0);
}

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
