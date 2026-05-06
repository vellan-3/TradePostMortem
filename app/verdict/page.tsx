'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Nav from '@/components/Nav';
import type { LabeledValue, VerdictCheckRow, VerdictViewModel } from '@/types';

export default function VerdictPage() {
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerdictViewModel | null>(null);
  const bootstrapped = useRef(false);

  const runScan = useCallback(async (nextMint = mint) => {
    const addr = nextMint.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/verdict?mint=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setResult(data as VerdictViewModel);
      window.history.replaceState(null, '', `/verdict?mint=${addr}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const nextMint = new URLSearchParams(window.location.search).get('mint')?.trim() ?? '';
    if (!nextMint) return;
    setMint(nextMint);
    void runScan(nextMint);
  }, [runScan]);

  return (
    <>
      <Nav />
      <section className="slip-screen">
        <div className="slip-screen-header">
          <div className="slip-screen-label lbl-verdict">01 · Verdict</div>
          <h1 className="slip-screen-title">Token Safety Scanner</h1>
          <p className="slip-screen-sub">Paste any Solana token contract. Get a full verdict before you enter.</p>
        </div>

        <div className="slip-input-row" style={{ marginBottom: 40 }}>
          <input
            className="slip-input"
            placeholder="Token contract address..."
            value={mint}
            spellCheck={false}
            autoComplete="off"
            disabled={loading}
            onChange={event => setMint(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') void runScan();
            }}
          />
          <button className="slip-btn slip-btn-verdict" disabled={loading || !mint.trim()} onClick={() => void runScan()}>
            {loading ? 'Scanning...' : 'Run Verdict →'}
          </button>
        </div>

        {error && <div className="error-block" style={{ marginBottom: 24 }}>✕ {error}</div>}
        {loading && (
          <div className="v-loading">
            <div className="v-loading-ring" />
            <p className="v-loading-text">Scanning token safety, market structure and timing...</p>
          </div>
        )}
        {result && <VerdictResults data={result} />}
        {!result && !loading && !error && <VerdictEmptyState />}
      </section>
    </>
  );
}

function VerdictEmptyState() {
  const checks = ['Mint Authority', 'Freeze Authority', 'Liquidity Lock', 'Transfer Hook', 'Sell Route Simulation', 'Deployer History', 'Entry Timing'];
  return (
    <div className="v-empty">
      <div className="v-empty-check-grid">
        {checks.map(check => (
          <div key={check} className="v-empty-check">
            <div className="v-empty-dot v-empty-dot-pass" />
            <span>{check}</span>
          </div>
        ))}
      </div>
      <p className="v-empty-label">Paste a token contract address above to run a full scan</p>
    </div>
  );
}

function VerdictResults({ data }: { data: VerdictViewModel }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (data.hero.score / 100) * circumference;
  const verdictColor =
    data.hero.verdict === 'CLEAN'
      ? 'var(--slip-green)'
      : data.hero.verdict === 'CAUTION'
      ? 'var(--slip-yellow)'
      : data.hero.verdict === 'FLAGGED'
      ? 'var(--slip-orange)'
      : 'var(--slip-red)';

  return (
    <>
      <div className="v-hero">
        <div className="v-score-ring-wrap">
          <svg className="v-score-ring-svg" width="100" height="100" viewBox="0 0 100 100">
            <circle className="v-ring-track" cx="50" cy="50" r="42" />
            <circle className="v-ring-fill" cx="50" cy="50" r="42" stroke={verdictColor} strokeDasharray={circumference} strokeDashoffset={offset} />
          </svg>
          <div className="v-score-num">
            <span style={{ color: verdictColor, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28 }}>{data.hero.score}</span>
            <span className="v-score-sub">/ 100</span>
          </div>
        </div>

        <div className="v-hero-info">
          <div className={`v-verdict-badge ${badgeClass(data.hero.verdict)}`}>{data.hero.verdict}</div>
          <div className="v-symbol">
            {data.hero.symbol !== 'UNKNOWN' ? `$${data.hero.symbol}` : data.hero.name} · {data.hero.mint.slice(0, 8)}...{data.hero.mint.slice(-5)}
          </div>
          <div className="v-summary">{data.hero.summary}</div>
        </div>
      </div>

      <VerdictSection title="Safety Layer" subtitle="Can you exit?" rows={data.safetyLayer} />
      <VerdictSection title="Market Structure" subtitle="Is the setup healthy?" rows={data.marketStructure} />

      <div className="v-section">
        <div className="v-section-head">Market Metrics <span>Volume, momentum, timing</span></div>
        <div className="v-metrics-grid">
          {data.marketMetrics.map(metric => (
            <MetricCell key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      <VerdictSection title="Timing Position" subtitle="Where are you in the curve?" rows={data.timingPosition} />

      <div className="v-cta">
        <span>Already in this token?</span>
        <a href={`/mirror?mint=${data.hero.mint}`} className="v-cta-btn">See who&apos;s winning → MIRROR</a>
      </div>
    </>
  );
}

function VerdictSection({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: VerdictCheckRow[];
}) {
  return (
    <div className="v-section">
      <div className="v-section-head">{title} <span>{subtitle}</span></div>
      {rows.map(row => <CheckRow key={row.name} check={row} />)}
    </div>
  );
}

function CheckRow({ check }: { check: VerdictCheckRow }) {
  const icon = check.status === 'pass' ? '✓' : check.status === 'warning' ? '!' : '✕';
  const iconClass =
    check.status === 'pass' ? 'v-check-icon v-check-pass' :
    check.status === 'warning' ? 'v-check-icon v-check-warn' :
    'v-check-icon v-check-fail';

  return (
    <div className="v-check-row">
      <div className={iconClass}>{icon}</div>
      <div className="v-check-body">
        <div className="v-check-name">
          {check.name}
          {check.confidence !== 'live' && <span className="slip-note-chip">{check.confidence === 'simulated' ? 'Simulated' : check.confidence === 'estimated' ? 'Estimated' : 'Unavailable'}</span>}
        </div>
        <div className="v-check-detail">{check.detail}</div>
      </div>
      <span className={severityClass(check.badge)}>{check.badge}</span>
    </div>
  );
}

function MetricCell({ metric }: { metric: LabeledValue }) {
  return (
    <div className="v-metric-cell">
      <div className="v-metric-label">
        {metric.label}
        {metric.confidence && metric.confidence !== 'live' && <span className="slip-note-chip">{metric.confidence === 'simulated' ? 'Simulated' : metric.confidence === 'estimated' ? 'Estimated' : 'Unavailable'}</span>}
      </div>
      <div className="v-metric-val" style={{ color: toneColor(metric.tone) }}>{metric.value}</div>
      <div className="v-metric-sub">{metric.sublabel ?? ''}</div>
    </div>
  );
}

function badgeClass(verdict: VerdictViewModel['hero']['verdict']) {
  if (verdict === 'CLEAN') return 'vbadge-clean';
  if (verdict === 'CAUTION') return 'vbadge-caution';
  if (verdict === 'FLAGGED') return 'vbadge-flagged';
  return 'vbadge-trap';
}

function severityClass(badge: VerdictCheckRow['badge']) {
  if (badge === 'CRITICAL') return 'v-sev v-sev-critical';
  if (badge === 'WARNING') return 'v-sev v-sev-warning';
  return 'v-sev v-sev-info';
}

function toneColor(tone?: LabeledValue['tone']) {
  if (tone === 'pass') return 'var(--slip-green)';
  if (tone === 'warning') return 'var(--slip-yellow)';
  if (tone === 'critical') return 'var(--slip-red)';
  return '#eeeef5';
}
