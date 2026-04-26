'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  wallet: string;
}

const STEPS = [
  { id: 1, text: 'Fetching swap history', sub: 'via Helius Enhanced API' },
  { id: 2, text: 'Pricing each trade', sub: 'Birdeye historical_price_unix' },
  { id: 3, text: 'Finding peak exits', sub: 'OHLCV reconstruction' },
  { id: 4, text: 'Running diagnostics', sub: 'Scoring & ranking damage' },
];

type StepState = 'pending' | 'active' | 'done';

export default function LoadingScreen({ wallet }: LoadingScreenProps) {
  const [stepStates, setStepStates] = useState<StepState[]>(['active', 'pending', 'pending', 'pending']);
  const [barPct, setBarPct] = useState(5);

  const short = wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '...';

  useEffect(() => {
    const timings = [
      { stepIdx: 0, doneDelta: 1400, nextDelta: 1400 },
      { stepIdx: 1, doneDelta: 2600, nextDelta: 2600 },
      { stepIdx: 2, doneDelta: 3500, nextDelta: 3500 },
      { stepIdx: 3, doneDelta: 4200, nextDelta: 4200 },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Activate next steps
    timers.push(setTimeout(() => setStepStates(['done', 'active', 'pending', 'pending']), 1400));
    timers.push(setTimeout(() => setStepStates(['done', 'done', 'active', 'pending']), 2600));
    timers.push(setTimeout(() => setStepStates(['done', 'done', 'done', 'active']), 3500));
    timers.push(setTimeout(() => setStepStates(['done', 'done', 'done', 'done']), 4200));

    // Progress bar
    timers.push(setTimeout(() => setBarPct(25), 100));
    timers.push(setTimeout(() => setBarPct(50), 1400));
    timers.push(setTimeout(() => setBarPct(72), 2600));
    timers.push(setTimeout(() => setBarPct(88), 3500));
    timers.push(setTimeout(() => setBarPct(100), 4200));

    void timings; // suppress unused warning

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        paddingTop: 56,
      }}
    >
      <p className="loading-wallet">
        Analyzing <span>{short}</span>
      </p>

      <div className="loader-block">
        {STEPS.map((step, i) => {
          const state = stepStates[i];
          return (
            <div key={step.id} className={`loader-step ${state}`}>
              <div className="loader-icon" id={`icon-${step.id}`}>
                {state === 'done' ? (
                  <span style={{ fontSize: 10 }}>✓</span>
                ) : state === 'active' ? (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
                ) : (
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{step.id}</span>
                )}
              </div>
              <div>
                <div className="loader-text">{step.text}</div>
                <div className="loader-sub">{step.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="loading-bar-wrap">
        <div className="loading-bar" style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}
