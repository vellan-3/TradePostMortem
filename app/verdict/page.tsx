'use client';

import { useState, useCallback } from 'react';
import Nav from '@/components/Nav';

export default function VerdictPage() {
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const runScan = useCallback(async () => {
    const addr = mint.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/verdict?mint=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setResult(data);
      window.history.replaceState(null, '', `/verdict?mint=${addr}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [mint]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') runScan();
  };

  return (
    <>
      <Nav active="verdict" />

      <section className="slip-screen">
        {/* ── HEADER ── */}
        <div className="slip-screen-header">
          <div className="slip-screen-label lbl-verdict">01 · Verdict</div>
          <h1 className="slip-screen-title">Token Safety Scanner</h1>
          <p className="slip-screen-sub">
            Paste any Solana token contract. Get a full verdict before you enter.
          </p>
        </div>

        {/* ── INPUT ── */}
        <div
          className={`slip-input-row${loading ? ' input-scanning' : ''}`}
          style={{ marginBottom: '40px' }}
        >
          <input
            id="verdict-mint-input"
            className="slip-input"
            placeholder="Token contract address..."
            spellCheck={false}
            autoComplete="off"
            value={mint}
            onChange={e => setMint(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button
            id="verdict-scan-btn"
            className="slip-btn slip-btn-verdict"
            onClick={runScan}
            disabled={loading || !mint.trim()}
          >
            {loading ? 'Scanning...' : 'Run Verdict →'}
          </button>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="error-block" style={{ marginBottom: '24px' }}>
            <span style={{ marginRight: 8 }}>✕</span>{error}
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {loading && (
          <div className="v-loading">
            <div className="v-loading-ring" />
            <p className="v-loading-text">
              Scanning token safety, deployer history and market structure...
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && <VerdictResults data={result} />}

        {/* ── EMPTY STATE ── */}
        {!result && !loading && !error && <VerdictEmptyState />}
      </section>
    </>
  );
}

/* ─── EMPTY STATE ─── */
function VerdictEmptyState() {
  const checks = [
    { label: 'Mint Authority', state: 'pass' },
    { label: 'Freeze Authority', state: 'pass' },
    { label: 'Liquidity Lock', state: 'warn' },
    { label: 'Transfer Hook', state: 'pass' },
    { label: 'Holder Concentration', state: 'warn' },
    { label: 'Deployer History', state: 'pass' },
    { label: 'Entry Timing', state: 'warn' },
  ];

  return (
    <div className="v-empty">
      <div className="v-empty-check-grid">
        {checks.map(c => (
          <div key={c.label} className="v-empty-check">
            <div className={`v-empty-dot v-empty-dot-${c.state}`} />
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      <p className="v-empty-label">
        Paste a token contract address above to run a full scan
      </p>
    </div>
  );
}

/* ─── FULL RESULTS ─── */
function VerdictResults({ data }: { data: any }) {
  const {
    overallScore,
    verdict,
    symbol,
    name,
    mint,
    summary,
    checks,
    topHolderConcentration,
    priceMove6h,
    isLate,
    deployerHistory,
  } = data;

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (overallScore / 100) * circumference;

  const verdictColor =
    verdict === 'CLEAN'   ? 'var(--slip-green)'  :
    verdict === 'CAUTION' ? 'var(--slip-yellow)' :
    verdict === 'FLAGGED' ? 'var(--slip-orange)' :
                            'var(--slip-red)';

  const verdictBadgeClass =
    verdict === 'CLEAN'   ? 'vbadge-clean'   :
    verdict === 'CAUTION' ? 'vbadge-caution' :
    verdict === 'FLAGGED' ? 'vbadge-flagged' :
                            'vbadge-trap';

  const safetyChecks = checks.filter((c: any) =>
    ['Mint Authority', 'Freeze Authority', 'Liquidity Lock', 'Transfer Hook'].includes(c.name)
  );
  const marketChecks = checks.filter((c: any) =>
    ['Top 10 Holder Concentration', 'Deployer History'].includes(c.name)
  );
  const timingChecks = checks.filter((c: any) => c.name === 'Entry Timing');

  return (
    <>
      {/* ── SCORE HERO ── */}
      <div className="v-hero">
        <div className="v-score-ring-wrap">
          <svg className="v-score-ring-svg" width="100" height="100" viewBox="0 0 100 100">
            <circle className="v-ring-track" cx="50" cy="50" r="42" />
            <circle
              className="v-ring-fill"
              cx="50" cy="50" r="42"
              stroke={verdictColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="v-score-num">
            <span style={{ color: verdictColor, fontFamily: 'Syne', fontWeight: 800, fontSize: 28 }}>
              {overallScore}
            </span>
            <span className="v-score-sub">/ 100</span>
          </div>
        </div>

        <div className="v-hero-info">
          <div className={`v-verdict-badge ${verdictBadgeClass}`}>{verdict}</div>
          <div className="v-symbol">
            {symbol !== 'UNKNOWN' ? `$${symbol}` : name} · {mint.slice(0, 8)}...{mint.slice(-4)}
          </div>
          <div className="v-summary">{summary}</div>
        </div>
      </div>

      {/* ── SAFETY LAYER ── */}
      {safetyChecks.length > 0 && (
        <div className="v-section">
          <div className="v-section-head">
            Safety Layer <span>Can you exit?</span>
          </div>
          {safetyChecks.map((c: any) => <CheckRow key={c.name} check={c} />)}
        </div>
      )}

      {/* ── MARKET STRUCTURE ── */}
      {marketChecks.length > 0 && (
        <div className="v-section">
          <div className="v-section-head">
            Market Structure <span>Is the setup healthy?</span>
          </div>
          {marketChecks.map((c: any) => <CheckRow key={c.name} check={c} />)}
        </div>
      )}

      {/* ── MARKET METRICS ── */}
      <div className="v-section">
        <div className="v-section-head">
          Market Metrics <span>Volume, momentum, timing</span>
        </div>
        <div className="v-metrics-grid">
          <div className="v-metric-cell">
            <div className="v-metric-label">Top 10 Concentration</div>
            <div
              className="v-metric-val"
              style={{
                color:
                  topHolderConcentration > 70 ? 'var(--slip-red)' :
                  topHolderConcentration > 50 ? 'var(--slip-yellow)' :
                  'var(--slip-green)',
              }}
            >
              {topHolderConcentration.toFixed(1)}%
            </div>
            <div className="v-metric-sub">
              {topHolderConcentration > 70
                ? 'Extreme dump risk'
                : topHolderConcentration > 50
                ? 'High concentration'
                : 'Acceptable distribution'}
            </div>
          </div>

          <div className="v-metric-cell">
            <div className="v-metric-label">6h Price Move</div>
            <div
              className="v-metric-val"
              style={{ color: isLate ? 'var(--slip-orange)' : 'var(--slip-green)' }}
            >
              {priceMove6h >= 0 ? '+' : ''}{priceMove6h?.toFixed(0) ?? '—'}%
            </div>
            <div className="v-metric-sub">
              {isLate ? 'You may be entering late' : 'Move appears early'}
            </div>
          </div>

          <div className="v-metric-cell">
            <div className="v-metric-label">Deployer Risk</div>
            <div
              className="v-metric-val"
              style={{
                color:
                  deployerHistory?.knownScammer ? 'var(--slip-red)' :
                  deployerHistory?.rugRate > 0.3 ? 'var(--slip-yellow)' :
                  deployerHistory ? 'var(--slip-green)' : 'var(--slip-muted)',
              }}
            >
              {deployerHistory
                ? `${(deployerHistory.rugRate * 100).toFixed(0)}% rug rate`
                : 'Unknown'}
            </div>
            <div className="v-metric-sub">
              {deployerHistory
                ? `${deployerHistory.totalTokensDeployed} tokens deployed`
                : 'No deployer data'}
            </div>
          </div>

          <div className="v-metric-cell">
            <div className="v-metric-label">Verdict Score</div>
            <div className="v-metric-val" style={{ color: verdictColor }}>
              {overallScore} / 100
            </div>
            <div className="v-metric-sub">{verdict}</div>
          </div>
        </div>
      </div>

      {/* ── TIMING ── */}
      {timingChecks.length > 0 && (
        <div className="v-section">
          <div className="v-section-head">
            Timing Position <span>Where are you in the curve?</span>
          </div>
          {timingChecks.map((c: any) => <CheckRow key={c.name} check={c} />)}
        </div>
      )}

      {/* ── MIRROR CTA ── */}
      <div className="v-cta">
        <span>Already in this token?</span>
        <a href="/mirror" className="v-cta-btn">
          See who&apos;s winning → MIRROR
        </a>
      </div>
    </>
  );
}

/* ─── CHECK ROW COMPONENT ─── */
function CheckRow({ check }: { check: any }) {
  const iconClass =
    check.passed ? 'v-check-icon v-check-pass' :
    check.severity === 'warning' ? 'v-check-icon v-check-warn' :
    'v-check-icon v-check-fail';

  const icon = check.passed ? '✓' : check.severity === 'warning' ? '!' : '✕';

  const sevClass =
    !check.passed && check.severity === 'critical' ? 'v-sev v-sev-critical' :
    !check.passed && check.severity === 'warning'  ? 'v-sev v-sev-warning'  :
    'v-sev v-sev-info';

  const sevLabel = check.passed
    ? 'PASS'
    : check.severity === 'critical'
    ? 'CRITICAL'
    : 'WARNING';

  return (
    <div className="v-check-row">
      <div className={iconClass}>{icon}</div>
      <div className="v-check-body">
        <div className="v-check-name">{check.name}</div>
        <div className="v-check-detail">{check.detail}</div>
      </div>
      <span className={sevClass}>{sevLabel}</span>
    </div>
  );
}
