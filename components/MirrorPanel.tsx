'use client';

import { useEffect, useState } from 'react';

interface Props {
  mint: string | null;
  symbol: string;
  onClose: () => void;
}

export default function MirrorPanel({ mint, symbol, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mint) { setData(null); return; }

    setLoading(true);
    setData(null);

    fetch(`/api/mirror?mint=${mint}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mint]);

  const isOpen = !!mint;

  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`} id="panel-mirror">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-type-label" style={{ color: 'var(--slip-blue)' }}>🪞 MIRROR</div>
          <div className="panel-title" id="mirror-panel-title">${symbol} Winners</div>
        </div>
        <div className="panel-close" onClick={onClose}>✕</div>
      </div>

      <div className="panel-body">
        {loading && (
          <div className="panel-loading">Fetching winners for ${symbol}...</div>
        )}

        {data && data.error && !loading && (
          <div className="panel-error" style={{ padding: 24, color: 'var(--slip-red)' }}>
            Error: {data.error}
          </div>
        )}

        {data && !data.error && data.leaderboard && !loading && (
          <>
            <div className="mirror-panel-token" id="mirror-token-label">
              {data.dataSource === 'holders'
                ? <>No live winner leaderboard was available for <b>${symbol}</b>, so showing current top holders.</>
                : <>Showing all wallets that won on <b>${symbol}</b> — ranked by SOL gained</>}
            </div>

            <div className="lb-table">
              <div className="lb-head">
                <span>#</span>
                <span>Wallet</span>
                <span>{data.dataSource === 'holders' ? 'Tokens' : 'P&L'}</span>
                <span>Hold</span>
              </div>

              {data.leaderboard?.map((winner: any, i: number) => (
                <div key={winner.wallet} className={`lb-row ${i === 0 ? 'top-row' : ''}`}>
                  <div className={`lb-rank-num rk${i + 1}`}>{i + 1}</div>
                  <div>
                    <div className="lb-wallet-addr">
                      {winner.walletLabel}
                      {winner.tag && (
                        <span className={`wallet-tag-sm wt-${winner.tag.toLowerCase().replace(' ', '-')}`}>
                          {winner.tag}
                        </span>
                      )}
                    </div>
                    <div className="lb-wallet-sub">
                      {winner.entrySub ?? winner.entryLine ?? '—'}
                    </div>
                  </div>
                  <div className={`lb-pnl-val ${winner.totalPnlSol < 0 ? 'neg' : ''}`}>
                    {data.dataSource === 'holders'
                      ? winner.entryLine.replace(/^Holding\s+/, '').replace(/\s+tokens$/, '')
                      : `${winner.totalPnlSol > 0 ? '+' : ''}${winner.totalPnlSol.toFixed(1)}`}
                  </div>
                  <div className="lb-hold-time">
                    {winner.holdDisplay}
                  </div>
                </div>
              ))}

              {data.yourRow && (
                <div className="lb-row you-row">
                  <div className="lb-rank-num" style={{ color: 'var(--slip-purple)' }}>YOU</div>
                  <div>
                    <div className="lb-wallet-addr">
                      {data.yourRow.walletLabel}
                      <span className="wallet-tag-sm wt-you">You</span>
                    </div>
                    <div className="lb-wallet-sub">
                      {data.yourRow.entryMarketCap ? `$${(data.yourRow.entryMarketCap / 1000).toFixed(0)}k mcap` : '—'} ·{' '}
                      {data.yourRow.dex ?? 'Unknown DEX'}
                    </div>
                  </div>
                  <div className={`lb-pnl-val ${data.yourRow.totalPnlSol < 0 ? 'neg' : ''}`}>
                    {data.yourRow.totalPnlSol > 0 ? '+' : ''}{data.yourRow.totalPnlSol.toFixed(1)}
                  </div>
                  <div className="lb-hold-time">
                    {data.yourRow.holdDisplay}
                  </div>
                </div>
              )}
            </div>

            {data.patternInsights && (
              <div className="pattern-insights">
                <div className="pi-title">◈ What Top 10 Winners Had in Common</div>
                {data.patternInsights.avgEntryMarketCap && (
                  <div className="pi-row">
                    <span className="pi-key">Avg entry market cap</span>
                    <span className="pi-val">{data.patternInsights.avgEntryMarketCap}</span>
                  </div>
                )}
                {data.patternInsights.avgHoldBeforePartialExit && (
                  <div className="pi-row">
                    <span className="pi-key">Avg hold before exit</span>
                    <span className="pi-val">{data.patternInsights.avgHoldBeforePartialExit}</span>
                  </div>
                )}
                {data.patternInsights.mostUsedDex && (
                  <div className="pi-row">
                    <span className="pi-key">Most used DEX</span>
                    <span className="pi-val">{data.patternInsights.mostUsedDex}</span>
                  </div>
                )}
                {data.patternInsights.partialProfitFrequency && (
                  <div className="pi-row">
                    <span className="pi-key">Took partial profits</span>
                    <span className="pi-val">{data.patternInsights.partialProfitFrequency}</span>
                  </div>
                )}
                {data.patternInsights.avgEntryBeforePeak && (
                  <div className="pi-row">
                    <span className="pi-key">Avg entry before peak</span>
                    <span className="pi-val">{data.patternInsights.avgEntryBeforePeak}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


/* SLIP v2 Official Release */
