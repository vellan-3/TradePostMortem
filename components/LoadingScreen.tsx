'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  { id: 1, text: 'Fetching swap history',       sub: 'Helius Enhanced API · last 100 txs' },
  { id: 2, text: 'Resolving token metadata',    sub: 'Birdeye · pump.fun API' },
  { id: 3, text: 'Pricing each trade',          sub: 'historical_price_unix · OHLCV' },
  { id: 4, text: 'Finding who won your tokens', sub: 'Birdeye top traders · gap analysis' },
  { id: 5, text: 'Scoring and diagnosing',      sub: 'SLIP engine + AI narration' },
];

const STEP_TIMING = [0, 1200, 2000, 3000, 3900]; // ms each step starts
const STEP_DURATION = [1200, 800, 1000, 900, 700];

interface Props {
  wallet: string;
}

export default function LoadingScreen({ wallet }: Props) {
  const [activeStep, setActiveStep] = useState(1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  const short = wallet
    ? wallet.slice(0, 6) + '...' + wallet.slice(-4)
    : '—';

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const total = 4600;

    STEPS.forEach((step, i) => {
      timers.push(
        setTimeout(() => setActiveStep(step.id), STEP_TIMING[i])
      );
      timers.push(
        setTimeout(() => {
          setDoneSteps(prev => [...prev, step.id]);
          setProgress(Math.round(((STEP_TIMING[i] + STEP_DURATION[i]) / total) * 100));
        }, STEP_TIMING[i] + STEP_DURATION[i])
      );
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'black', color: 'white', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '32px', fontWeight: 800, marginBottom: '8px' }}>Analyzing wallet</h2>
        <p style={{ fontFamily: '"Space Mono", monospace', fontSize: '14px', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>{short}</p>
      </div>

      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontFamily: '"Instrument Sans", sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)' }}>RUNNING AUTOPSY</span>
          <span style={{ fontSize: '14px', fontFamily: '"Space Mono", monospace', fontWeight: 700, color: '#3B82F6' }}>{progress}%</span>
        </div>

        <div style={{ padding: '8px 0' }}>
          {STEPS.map(step => {
            const isDone   = doneSteps.includes(step.id);
            const isActive = activeStep === step.id && !isDone;

            return (
              <div
                key={step.id}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  padding: '16px 24px', 
                  borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                  opacity: isActive ? 1 : isDone ? 0.5 : 0.2,
                  transition: 'opacity 0.3s ease, border-color 0.3s ease',
                  background: isActive ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                }}
              >
                <div style={{ 
                  width: '24px', height: '24px', 
                  borderRadius: '50%', 
                  border: isDone ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  background: isDone ? '#10b981' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700, color: isDone ? 'black' : 'white'
                }}>
                  {isDone ? '✓' : step.id}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: '"Instrument Sans", sans-serif' }}>{step.text}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{step.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '40px', width: '100%', maxWidth: '400px', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#3B82F6', width: `${progress}%`, transition: 'width 0.4s ease' }} />
      </div>
    </main>
  );
}


/* SLIP v2 Official Release */
