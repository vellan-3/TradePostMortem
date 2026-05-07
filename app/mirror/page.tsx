'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { MirrorLeaderboardRow, MirrorViewModel } from '@/types';

export default function MirrorPage() {
  const [mint, setMint] = useState('');
  const [wallet, setWallet] = useState('');
  const [sol, setSol] = useState('');
  const [entryTs, setEntryTs] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MirrorViewModel | null>(null);
  const bootstrapped = useRef(false);

  const fetchMirror = useCallback(async (nextMint = mint, nextSol = sol, nextWallet = wallet, nextEntryTs = entryTs) => {
    const addr = nextMint.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const params = new URLSearchParams({ mint: addr });
      if (nextSol.trim()) params.set('sol', nextSol.trim());
      if (nextWallet.trim()) params.set('wallet', nextWallet.trim());
      if (nextEntryTs.trim()) params.set('entryTs', nextEntryTs.trim());
      const res = await fetch(`/api/mirror?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fetch failed');
      setResult(data as MirrorViewModel);
      window.history.replaceState(null, '', `/mirror?${params.toString()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [entryTs, mint, sol, wallet]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const params = new URLSearchParams(window.location.search);
    const nextMint = params.get('mint')?.trim() ?? '';
    const nextSol = params.get('sol')?.trim() ?? '';
    const nextWallet = params.get('wallet')?.trim() ?? '';
    const nextEntryTs = params.get('entryTs')?.trim() ?? '';
    if (nextMint) setMint(nextMint);
    if (nextSol) setSol(nextSol);
    if (nextWallet) setWallet(nextWallet);
    if (nextEntryTs) setEntryTs(nextEntryTs);
    if (nextMint) void fetchMirror(nextMint, nextSol, nextWallet, nextEntryTs);
  }, [fetchMirror]);

  return (
    <>
      <section className="slip-screen slip-screen-wide slip-page-body slip-bg-mirror">
        <div className="page-hero">
          <span className="eyebrow accent-mirror">02 · MIRROR</span>
          <h1 className="page-title">Winner Leaderboard</h1>
          <p className="page-subtitle">See who is winning your token right now — and exactly how they&apos;re doing it.</p>
        </div>

        <div className="m-inputs">
          <div className="m-input-group-wrapper">
            <div className="m-input-wrap m-input-wrap-first">
              <label className="m-input-label">Token Contract</label>
              <input className="m-input" placeholder="Token mint address..." value={mint} onChange={e => setMint(e.target.value)} disabled={loading} />
            </div>
            <div className="m-input-wrap">
              <label className="m-input-label">Your Wallet</label>
              <input className="m-input" placeholder="Optional wallet for YOU row..." value={wallet} onChange={e => setWallet(e.target.value)} disabled={loading} />
            </div>
            <div className="m-input-wrap">
              <label className="m-input-label">Your Entry (SOL)</label>
              <input className="m-input" placeholder="e.g. 5.0" value={sol} onChange={e => setSol(e.target.value)} disabled={loading} />
            </div>
          </div>
          <button className="slip-btn slip-btn-mirror m-find-btn" disabled={loading || !mint.trim()} onClick={() => void fetchMirror()}>
            {loading ? 'Scanning...' : 'Find Winners →'}
          </button>
        </div>

        {error && <div className="error-block" style={{ marginBottom: 24 }}>✕ {error}</div>}
        {loading && (
          <div className="v-loading">
            <div className="v-loading-ring" style={{ borderTopColor: 'var(--slip-blue)' }} />
            <p className="v-loading-text">Fetching winner leaderboard and gap analysis...</p>
          </div>
        )}
        {result && <MirrorResults data={result} />}
        {!result && !loading && !error && (
          <div className="v-empty">
            <div style={{ fontSize: 13, color: 'var(--slip-muted)', textAlign: 'center', lineHeight: 1.8, maxWidth: 420 }}>
              Enter a token mint address to rank the current winners on that token, compare your position against the top wallet, and see the winner pattern panel.
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function MirrorResults({ data }: { data: MirrorViewModel }) {
  const rows = data.yourRow ? [...data.leaderboard.slice(0, 5), data.yourRow] : data.leaderboard.slice(0, 5);
  const topWinner = data.leaderboard[0] ?? null;

  return (
    <div className="mirror-layout">
      <div className="mirror-lb-col">
        <div className="mirror-lb-wrap">
          <div className="mirror-lb-top">
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#eeeef5' }}>
              {data.symbol !== 'UNKNOWN' ? `$${data.symbol}` : 'Token'} · Winner board
            </span>
          </div>
          <div className="lb-header">
            <span>#</span>
            <span>Wallet</span>
            <span>Total P&amp;L</span>
            <span>ROI</span>
            <span>Hold Time</span>
          </div>
          {rows.map((row, index) => (
            <LeaderboardRow
              key={`${row.wallet}-${index}`}
              row={row}
              rank={row.tag === 'Your Wallet' ? 'YOU' : `${index + 1}`}
              isYou={row.tag === 'Your Wallet'}
            />
          ))}
        </div>
      </div>

      <div className="mirror-side">
        {data.comparison && topWinner && (
          <div className="gap-card">
            <div className="gap-label">Your Position vs #1 Winner</div>
            <div className="gap-vs">
              <div className="gap-side">
                <div className="gap-side-label" style={{ color: 'var(--slip-purple)' }}>YOU</div>
                <div className="gap-side-val" style={{ color: data.comparison.yourPnlSol >= 0 ? 'var(--slip-green)' : 'var(--slip-red)' }}>
                  {data.comparison.yourPnlSol >= 0 ? '+' : ''}{data.comparison.yourPnlSol.toFixed(1)} SOL
                </div>
                <div className="gap-side-sub">{data.comparison.yourEntryLine}</div>
              </div>
              <div className="gap-divider">vs</div>
              <div className="gap-side" style={{ textAlign: 'right' }}>
                <div className="gap-side-label" style={{ color: 'var(--slip-green)' }}>WINNER</div>
                <div className="gap-side-val" style={{ color: 'var(--slip-green)' }}>+{data.comparison.winnerPnlSol.toFixed(1)} SOL</div>
                <div className="gap-side-sub">{data.comparison.winnerEntryLine}</div>
              </div>
            </div>

            <GapStat label="Entry timing gap" value={data.comparison.entryTimingGapLabel} negative />
            <GapStat label="Entry mcap gap" value={data.comparison.entryMarketCapGapLabel} negative />
            <GapStat label="SOL gap" value={data.comparison.solGapLabel} negative />
            <GapStat label="Winner used" value={`${data.comparison.winnerDex ?? 'Unavailable'}${data.comparison.winnerDexConfidence !== 'live' ? ' (Estimated)' : ''}`} />
            <GapStat label="You used" value={`${data.comparison.yourDex ?? 'Unavailable'}${data.comparison.yourDexConfidence !== 'live' ? ' (Estimated)' : ''}`} />
          </div>
        )}

        <div className="pattern-card">
          <div className="pattern-title"><span style={{ color: 'var(--slip-blue)' }}>◈</span> What Top 10 Winners Had in Common</div>
          <PatternStat label="Avg entry market cap" value={data.patternInsights.avgEntryMarketCap} />
          <PatternStat label="Avg hold before partial exit" value={data.patternInsights.avgHoldBeforePartialExit} />
          <PatternStat label="Most used DEX" value={data.patternInsights.mostUsedDex} />
          <PatternStat label="Took partial profits" value={data.patternInsights.partialProfitFrequency} />
          <PatternStat label="Avg entry before peak" value={data.patternInsights.avgEntryBeforePeak} />
          <PatternStat label="Avg size deployed" value={data.patternInsights.avgSizeDeployed} />
        </div>

        {data.comparisonNote && (
          <div className="mirror-cta-card">
            <div className="mirror-cta-label">Comparison Status</div>
            <p className="mirror-cta-text">{data.comparisonNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardRow({ row, rank, isYou }: { row: MirrorLeaderboardRow; rank: string; isYou: boolean }) {
  const tagClass =
    row.tag === 'Smart Money' ? 'lb-tag-smart' :
    row.tag === 'KOL' ? 'lb-tag-kol' :
    row.tag === 'Bot' ? 'lb-tag-bot' :
    '';

  return (
    <div className={`lb-row ${rank === '1' ? 'lb-row-top' : ''} ${isYou ? 'lb-row-you' : ''}`}>
      <div className="lb-rank">{rank}</div>
      <div className="lb-wallet">
        <div className="lb-addr">
          {row.walletLabel}
          {row.tag && <span className={`lb-tag ${tagClass}`}>{row.tag}</span>}
        </div>
        <div className="lb-entry-info">
          {row.entryLine}
          {(row.confidence.entryMarketCap || row.confidence.dex) && <span className="slip-note-chip">Estimated</span>}
        </div>
      </div>
      <div className={`lb-pnl ${row.totalPnlSol < 0 ? 'lb-pnl-neg' : ''}`}>{row.totalPnlSol >= 0 ? '+' : ''}{row.totalPnlSol.toFixed(1)} SOL</div>
      <div className="lb-roi" style={{ color: row.roi >= 0 ? 'var(--slip-green)' : 'var(--slip-red)' }}>{row.roi >= 0 ? '+' : ''}{row.roi.toFixed(0)}%</div>
      <div className="lb-hold">{row.holdDisplay}</div>
    </div>
  );
}

function PatternStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pattern-item">
      <span className="pattern-key">{label}</span>
      <span className="pattern-val">{value}</span>
    </div>
  );
}

function GapStat({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div className="gap-stat-row">
      <span className="gap-stat-key">{label}</span>
      <span className={`gap-stat-val ${negative ? 'gap-neg' : ''}`}>{value}</span>
    </div>
  );
}

/* SLIP v2 Official Release */
