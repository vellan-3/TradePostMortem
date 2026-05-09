'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LabeledValue, VerdictCheckRow, VerdictViewModel } from '@/types';

export default function VerdictPage() {
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerdictViewModel | null>(null);
  const bootstrapped = useRef(false);

  const runScan = useCallback(async (nextMint = mint) => {
    const addr = cleanAddress(nextMint);
    if (!addr) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/verdict?mint=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Scan failed');
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
    <div className="page-canvas canvas-verdict">
      {/* ── Header ── */}
      <div>
        <div className="ds-eyebrow ds-eyebrow-verdict">
          <span className="ds-eyebrow-num">01</span>
          <span className="ds-eyebrow-sep" />
          <span className="ds-eyebrow-lbl-verdict">Verdict</span>
        </div>
        <h1 className="ds-page-title">Token Safety<br />Scanner</h1>
        <p className="ds-page-sub">
          Paste any Solana token contract. Get a full verdict before you enter.
        </p>
      </div>

      {/* ── Input ── */}
      <div className="ds-input-row">
        <input
          value={mint}
          onChange={e => setMint(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void runScan()}
          placeholder="Token contract address..."
          spellCheck={false}
          autoComplete="off"
          disabled={loading}
        />
        <button className="ds-btn-run ds-btn-verdict" onClick={() => void runScan()} disabled={loading || !mint.trim()}>
          {loading ? 'Scanning...' : 'Run Verdict →'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--slip-red)', fontSize: '14px', fontFamily: 'Space Mono, monospace', marginTop: '12px' }}>
          <div>✕ {error}</div>
          {error.includes('failed') && (
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>
              Check your API keys and try again. If this persists, the token might be too new for the scanner.
            </div>
          )}
        </div>
      )}

      {/* ── Idle state ── */}
      {!result && !loading && (
        <div className="ds-idle">
          <div className="ds-idle-checks">
            {[
              'Mint Authority', 'Freeze Authority', 'Liquidity Lock',
              'Transfer Hook', 'Sell Route Simulation', 'Deployer History', 'Entry Timing'
            ].map(label => (
              <div className="ds-check-row" key={label}>
                <span className="ds-dot ds-dot-idle" />
                {label}
                <span className="ds-check-badge ds-cb-idle">Pending</span>
              </div>
            ))}
          </div>
          <p className="ds-idle-hint">Paste a token contract address above to run a full scan</p>
        </div>
      )}

      {/* ── Loading state ── */}
      {loading && (
        <div className="ds-idle">
           <div className="ds-idle-checks">
            {[
              'Mint Authority', 'Freeze Authority', 'Liquidity Lock',
              'Transfer Hook', 'Sell Route Simulation', 'Deployer History', 'Entry Timing'
            ].map((label, i) => (
              <div className="ds-check-row" key={label}>
                <span className={`ds-dot ${i < 3 ? 'ds-dot-pass' : 'ds-dot-idle'}`} />
                {label}
                <span className={`ds-check-badge ${i < 3 ? 'ds-cb-pass' : 'ds-cb-idle'}`}>{i < 3 ? 'PASS' : 'Scanning...'}</span>
              </div>
            ))}
          </div>
          <p className="ds-idle-hint">Scanning token safety, market structure and timing...</p>
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div className="ds-fade-up">
          <div className="ds-verdict-layout">

            {/* Left: main card */}
            <div>
              <div className="ds-card">

                {/* Score hero */}
                <div className="ds-score-hero">
                  <div className="ds-score-ring-wrap">
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="40" fill="none"
                        stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <circle cx="48" cy="48" r="40" fill="none"
                        stroke={getScoreColor(result.hero.score)} strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="251.3"
                        strokeDashoffset={251.3 * (1 - result.hero.score / 100)} />
                    </svg>
                    <div className="ds-score-ring-center">
                      <span className="ds-score-number" style={{ color: getScoreColor(result.hero.score) }}>
                        {result.hero.score}
                      </span>
                      <span className="ds-score-denom">/100</span>
                    </div>
                  </div>

                  <div className="ds-score-meta">
                    <span className={`ds-v-badge ds-vb-${badgeType(result.hero.verdict)}`}>
                      {result.hero.verdict}
                    </span>
                    <div className="ds-verdict-badge-lg" style={{ color: getScoreColor(result.hero.score) }}>
                      {result.hero.verdict.toUpperCase()}
                    </div>
                    <p className="ds-verdict-summary">{result.hero.summary}</p>
                  </div>
                </div>

                {/* Safety Layer checks */}
                <div className="ds-check-section">
                  <div className="ds-check-section-title">
                    <span>Safety Layer</span>
                    <span style={{ color: 'var(--slip-text-soft)', fontSize: 10, fontWeight: 400 }}>Can you exit?</span>
                  </div>
                  {result.safetyLayer?.map((check) => (
                    <div className="ds-check-row" key={check.name} style={{ marginBottom: 10 }}>
                      <span className={`ds-dot ds-dot-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`} />
                      {check.name}
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--slip-text-soft)', marginLeft: 8 }}>
                        {check.detail}
                      </span>
                      <span className={`ds-check-badge ds-cb-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`}>
                        {check.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="ds-divider" />

                {/* Market Structure checks */}
                <div className="ds-check-section">
                  <div className="ds-check-section-title">
                    <span>Market Structure</span>
                    <span style={{ color: 'var(--slip-text-soft)', fontSize: 10, fontWeight: 400 }}>Is the setup healthy?</span>
                  </div>
                  {result.marketStructure?.map((check) => (
                    <div className="ds-check-row" key={check.name} style={{ marginBottom: 10 }}>
                      <span className={`ds-dot ds-dot-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`} />
                      {check.name}
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--slip-text-soft)', marginLeft: 8 }}>
                        {check.detail}
                      </span>
                      <span className={`ds-check-badge ds-cb-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`}>
                        {check.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="ds-divider" />

                {/* Timing Position checks */}
                <div className="ds-check-section">
                  <div className="ds-check-section-title">
                    <span>Timing Position</span>
                    <span style={{ color: 'var(--slip-text-soft)', fontSize: 10, fontWeight: 400 }}>Where are you in the curve?</span>
                  </div>
                  {result.timingPosition?.map((check) => (
                    <div className="ds-check-row" key={check.name} style={{ marginBottom: 10 }}>
                      <span className={`ds-dot ds-dot-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`} />
                      {check.name}
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--slip-text-soft)', marginLeft: 8 }}>
                        {check.detail}
                      </span>
                      <span className={`ds-check-badge ds-cb-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`}>
                        {check.badge}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Right: sidebar stats */}
            <div className="ds-verdict-sidebar">
              {result.marketMetrics.map(metric => (
                <div className="ds-stat-pill" key={metric.label}>
                  <span className="ds-stat-lbl">{metric.label}</span>
                  <span className="ds-stat-val" style={{ color: toneColor(metric.tone) }}>{metric.value}</span>
                  <span className="ds-stat-sub">{metric.sublabel ?? ''}</span>
                </div>
              ))}
              <div className="ds-divider" />
              <div className="ds-stat-pill" style={{ background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
                <span className="ds-stat-lbl" style={{ color: 'var(--slip-blue)' }}>Next Step</span>
                <span className="ds-stat-val" style={{ fontSize: 18 }}>Mirror Winners</span>
                <a href={`/mirror?mint=${result.hero.mint}`} className="ds-btn-ghost" style={{ marginTop: 8, justifyContent: 'center' }}>
                  See top wallets →
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--slip-success)';
  if (score >= 60) return 'var(--slip-warning)';
  if (score >= 40) return '#f97316';
  return 'var(--slip-red)';
}

function cleanAddress(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  return match ? match[0] : trimmed;
}

function badgeType(verdict: string): string {
  const v = verdict.toUpperCase();
  if (v === 'CLEAN') return 'clean';
  if (v === 'CAUTION') return 'caution';
  if (v === 'FLAGGED' || v === 'RISKY') return 'risky';
  return 'trap';
}

function toneColor(tone?: string) {
  if (tone === 'pass') return 'var(--slip-success)';
  if (tone === 'warning') return 'var(--slip-warning)';
  if (tone === 'critical') return 'var(--slip-red)';
  return 'var(--slip-text)';
}

/* SLIP v2 Official Release */
