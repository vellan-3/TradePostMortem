'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { MirrorLeaderboardRow, MirrorViewModel } from '@/types';
import { cleanSolanaAddress } from '@/lib/address';

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
    const addr = cleanSolanaAddress(nextMint);
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
    <div className="page-canvas canvas-mirror">

      {/* Header */}
      <div>
        <div className="ds-eyebrow ds-eyebrow-mirror">
          <span className="ds-eyebrow-num">02</span>
          <span className="ds-eyebrow-sep" />
          <span className="ds-eyebrow-lbl-mirror">Mirror</span>
        </div>
        <h1 className="ds-page-title">Winner<br />Leaderboard</h1>
        <p className="ds-page-sub">See who is winning your token right now — and exactly how they&apos;re doing it.</p>
      </div>

      {/* Input grid */}
      <div className="ds-mirror-input-grid">
        <div className="ds-mirror-field">
          <div className="ds-mirror-field-lbl">Token Contract</div>
          <input value={mint} onChange={e => setMint(e.target.value)} placeholder="Token mint address..." spellCheck={false} disabled={loading} />
        </div>
        <div className="ds-mirror-field">
          <div className="ds-mirror-field-lbl">Your Wallet (optional)</div>
          <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="For your row..." disabled={loading} />
        </div>
        <div className="ds-mirror-field">
          <div className="ds-mirror-field-lbl">Your Entry (SOL)</div>
          <input value={sol} onChange={e => setSol(e.target.value)} placeholder="e.g. 3.0" disabled={loading} />
        </div>
        <button className="ds-mirror-submit" onClick={() => void fetchMirror()} disabled={loading || !mint.trim()}>
          {loading ? 'Scanning...' : 'Find Winners →'}
        </button>
      </div>

      {error && <div style={{ color: 'var(--slip-red)', fontSize: '14px', fontFamily: 'Space Mono, monospace' }}>✕ {error}</div>}

      {/* Idle */}
      {!result && !loading && (
        <div className="ds-idle">
          <p className="ds-idle-hint">
            Enter a token mint address to rank all wallets that traded it,
            compare your position against the top winner, and see the winner pattern panel.
          </p>
        </div>
      )}

       {/* Loading */}
       {loading && (
        <div className="ds-idle">
           <div className="v-loading-ring" style={{ borderTopColor: 'var(--slip-blue)', width: 40, height: 40, borderWidth: 3 }} />
          <p className="ds-idle-hint">
            Fetching winner leaderboard and gap analysis...
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="ds-fade-up ds-mirror-layout">

          {/* Left: leaderboard */}
          <div>
            <div className="ds-section-lbl">
              {result.symbol} · {result.leaderboard.length} {result.dataSource === 'holders' ? 'holders' : 'traders'} · {result.dataSource === 'holders' ? 'fallback holder data' : 'ranked by realized P&L'}
            </div>
            <div className="ds-lb-head">
              <div className="ds-lb-head-lbl">#</div>
              <div className="ds-lb-head-lbl">Wallet</div>
              <div className="ds-lb-head-lbl">P&L (SOL)</div>
              <div className="ds-lb-head-lbl">Entry</div>
              <div className="ds-lb-head-lbl">Hold</div>
            </div>

            {result.leaderboard?.map((winner, i) => (
              <div
                key={`${winner.wallet}-${i}`}
                className={`ds-lb-row ${i === 0 ? 'ds-lb-row-top' : ''} ${winner.tag === 'Your Wallet' ? 'ds-lb-row-you' : ''}`}
              >
                <div className={`ds-lb-rank ${i === 0 ? 'ds-lb-rank-1' : i === 1 ? 'ds-lb-rank-2' : i === 2 ? 'ds-lb-rank-3' : ''} ${winner.tag === 'Your Wallet' ? 'ds-lb-rank-you' : ''}`}>
                  {winner.tag === 'Your Wallet' ? 'YOU' : i + 1}
                </div>
                <div>
                  <div className="ds-lb-addr">
                    {winner.walletLabel}
                    {winner.tag && winner.tag !== 'Your Wallet' && <span className={`ds-wallet-tag ds-wt-${winner.tag.toLowerCase().replace(' ', '')}`}>{winner.tag}</span>}
                    {winner.tag === 'Your Wallet' && <span className="ds-wallet-tag ds-wt-you">You</span>}
                  </div>
                  <div className="ds-lb-sub">{winner.entrySub ?? winner.entryLine}</div>
                </div>
                <div className={`ds-lb-pnl ${winner.totalPnlSol >= 0 ? 'ds-lb-pnl-pos' : 'ds-lb-pnl-neg'}`}>
                  {winner.totalPnlSol >= 0 ? '+' : ''}{winner.totalPnlSol.toFixed(1)}
                </div>
                <div className="ds-lb-entry">{winner.entrySol !== null ? `${winner.entrySol} SOL` : '—'}</div>
                <div className="ds-lb-hold">{winner.holdDisplay}</div>
              </div>
            ))}
          </div>

          {/* Right: gap card + pattern insights */}
          <div className="ds-mirror-side">
            {result.comparison && (
              <div className="ds-gap-card">
                <div className="ds-gap-card-title">Your Position vs #1 Winner</div>
                <div className="ds-gap-vs">
                  <div className="ds-gap-side">
                    <span className="ds-gap-side-lbl" style={{ color: 'var(--slip-purple)' }}>You</span>
                    <span className="ds-gap-side-val" style={{ color: result.comparison.yourPnlSol < 0 ? 'var(--slip-red)' : 'var(--slip-success)' }}>
                      {result.comparison.yourPnlSol >= 0 ? '+' : ''}{result.comparison.yourPnlSol.toFixed(1)} SOL
                    </span>
                    <span className="ds-gap-side-sub">{result.comparison.yourEntryLine}</span>
                  </div>
                  <div className="ds-gap-divider">vs</div>
                  <div className="ds-gap-side" style={{ textAlign: 'right' }}>
                    <span className="ds-gap-side-lbl" style={{ color: 'var(--slip-success)' }}>Winner</span>
                    <span className="ds-gap-side-val" style={{ color: 'var(--slip-success)' }}>
                      +{result.comparison.winnerPnlSol.toFixed(1)} SOL
                    </span>
                    <span className="ds-gap-side-sub">{result.comparison.winnerEntryLine}</span>
                  </div>
                </div>
                
                <div className="ds-gap-stat">
                  <span className="ds-gap-key">Entry timing gap</span>
                  <span className="ds-gap-val ds-gap-val-neg">{result.comparison.entryTimingGapLabel}</span>
                </div>
                <div className="ds-gap-stat">
                  <span className="ds-gap-key">Entry mcap gap</span>
                  <span className="ds-gap-val ds-gap-val-neg">{result.comparison.entryMarketCapGapLabel}</span>
                </div>
                <div className="ds-gap-stat">
                  <span className="ds-gap-key">SOL gap</span>
                  <span className="ds-gap-val ds-gap-val-neg">{result.comparison.solGapLabel}</span>
                </div>
                <div className="ds-gap-stat">
                  <span className="ds-gap-key">Winner used</span>
                  <span className="ds-gap-val">{result.comparison.winnerDex}</span>
                </div>
              </div>
            )}

            {result.patternInsights && (
              <div className="ds-pattern-insights">
                <div className="ds-pi-title">◈ What Top 10 Winners Had in Common</div>
                {result.patternInsights.avgEntryMarketCap && (
                  <div className="ds-pi-row"><span className="ds-pi-key">Avg entry market cap</span><span className="ds-pi-val">{result.patternInsights.avgEntryMarketCap}</span></div>
                )}
                {result.patternInsights.avgHoldBeforePartialExit && (
                  <div className="ds-pi-row"><span className="ds-pi-key">Avg hold before exit</span><span className="ds-pi-val">{result.patternInsights.avgHoldBeforePartialExit}</span></div>
                )}
                {result.patternInsights.mostUsedDex && (
                  <div className="ds-pi-row"><span className="ds-pi-key">Most used DEX</span><span className="ds-pi-val">{result.patternInsights.mostUsedDex}</span></div>
                )}
                {result.patternInsights.partialProfitFrequency && (
                  <div className="ds-pi-row"><span className="ds-pi-key">Took partial profits</span><span className="ds-pi-val">{result.patternInsights.partialProfitFrequency}</span></div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

/* SLIP v2 Official Release */
