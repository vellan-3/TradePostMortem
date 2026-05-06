'use client';

import { useEffect, useState } from 'react';

interface Props {
  mint: string | null;
  symbol: string;
  onClose: () => void;
}

export default function VerdictPanel({ mint, symbol, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mint) { setData(null); return; }

    setLoading(true);
    setData(null);

    fetch(`/api/verdict?mint=${mint}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mint]);

  const isOpen = !!mint;

  return (
    <div className={`side-panel ${isOpen ? 'open' : ''}`} id="panel-verdict">
      <div className="panel-header">
        <div className="panel-header-left">
          <div className="panel-type-label" style={{ color: 'var(--slip-red)' }}>⚖ VERDICT</div>
          <div className="panel-title" id="verdict-panel-title">Token Safety Scan</div>
        </div>
        <div className="panel-close" onClick={onClose}>✕</div>
      </div>

      <div className="panel-body">
        {loading && (
          <div className="panel-loading">Scanning ${symbol}...</div>
        )}

        {data && data.error && !loading && (
          <div className="panel-error" style={{ padding: 24, color: 'var(--slip-red)' }}>
            Error: {data.error}
          </div>
        )}

        {data && !data.error && data.hero && !loading && (
          <>
            <div className="verdict-hero">
              <div className="vscore-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--slip-border2)" strokeWidth="5"/>
                  <circle cx="40" cy="40" r="34" fill="none" stroke={getScoreColor(data.hero.score)} strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="213.6"
                    strokeDashoffset={213.6 * (1 - data.hero.score / 100)} />
                </svg>
                <div className="vscore-num">
                  <span style={{ color: getScoreColor(data.hero.score) }}>{data.hero.score}</span>
                  <span className="vscore-sublabel">/100</span>
                </div>
              </div>

              <div className="verdict-info">
                <div className={`verdict-badge vb-${data.hero.verdict.toLowerCase()}`}>{data.hero.verdict.toUpperCase()}</div>
                <div className="verdict-token" id="verdict-token-label">${symbol}</div>
                <div className="verdict-summary">{data.hero.summary}</div>
              </div>
            </div>

            <div className="check-section">
              <div className="check-section-header">
                <span>Security Checks</span>
              </div>
              {data.safetyLayer?.map((check: any) => (
              <div key={check.name} className="check-row">
                <div className={`check-icon ci-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'fail' : 'warn'}`}>
                  {check.status === 'pass' ? '✓' : check.status === 'critical' ? '✕' : '!'}
                </div>
                <div className="check-content">
                  <div className="check-name">{check.name}</div>
                  <div className="check-detail">{check.detail}</div>
                </div>
                <span className={`check-sev sev-${check.status === 'pass' ? 'pass' : check.status === 'critical' ? 'critical' : 'warning'}`}>
                  {check.badge}
                </span>
              </div>
            ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--green)';
  if (score >= 60) return 'var(--amber)';
  if (score >= 40) return '#f97316';
  return 'var(--red)';
}
