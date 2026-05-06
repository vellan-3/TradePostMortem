# SLIP v2 — Push & Implementation Guide
### Wallet Connect Entry · Payslip First · VERDICT + MIRROR as Side Panels

---

## BEFORE YOU TOUCH ANYTHING

Check your current branch and make sure everything is committed.

```bash
git status
git branch
```

If you have uncommitted changes, stash them first:

```bash
git stash
```

---

## STEP 1 — Create the v2 branch

```bash
# Make sure you're on your current working branch
# (either main or feat/slip-rebrand from the last guide)
git checkout feat/slip-rebrand   # or main if that's where your work is

# Pull latest to make sure you're up to date
git pull origin feat/slip-rebrand

# Create the new v2 branch from your current state
git checkout -b feat/slip-v2-wallet-entry

# Push it to GitHub immediately so it exists remotely
git push -u origin feat/slip-v2-wallet-entry
```

Your branch structure now:

```
main                              ← stable, always deployable
├── archive/tradepostmortem-v1    ← frozen, never touched
├── feat/slip-rebrand             ← your v1 SLIP work, preserved
└── feat/slip-v2-wallet-entry     ← where all v2 work happens
```

---

## STEP 2 — Understand what you're migrating

The v2 HTML file (`slip_v2.html`) introduces four structural changes to your existing app:

| What changed | Where it lives in your Next.js app |
|---|---|
| Connect screen replaces the landing | `app/page.tsx` |
| Loading screen auto-triggers analysis | `app/page.tsx` (state machine) |
| Payslip is now the first result screen | `app/payslip/[wallet]/page.tsx` |
| VERDICT and MIRROR are side panels, not pages | `components/VerdictPanel.tsx` + `components/MirrorPanel.tsx` (new) |

---

## STEP 3 — Restructure your pages

### 3a. Replace `app/page.tsx` (the landing)

Your current landing probably has a wallet input or feature cards. Replace the entire file with the connect + auto-analysis flow.

The new `app/page.tsx` handles three states as a client component:

```tsx
// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConnectScreen from '@/components/ConnectScreen';
import LoadingScreen from '@/components/LoadingScreen';

type AppState = 'connect' | 'loading';

export default function Home() {
  const [state, setState] = useState<AppState>('connect');
  const [wallet, setWallet] = useState('');
  const router = useRouter();

  async function beginAnalysis(walletAddress: string) {
    if (!walletAddress || walletAddress.length < 32) return;

    setWallet(walletAddress);
    setState('loading');

    // Loading is purely cosmetic — the real fetch happens on the payslip page
    // This gives the user a premium experience while navigating
    await new Promise(resolve => setTimeout(resolve, 4800));

    router.push(`/payslip/${walletAddress}`);
  }

  if (state === 'loading') {
    return <LoadingScreen wallet={wallet} />;
  }

  return <ConnectScreen onAnalyze={beginAnalysis} />;
}
```

### 3b. Create `components/ConnectScreen.tsx`

This is the wallet connect UI — the entry point. Pull the design directly from the v2 HTML `#s-connect` section.

```tsx
// components/ConnectScreen.tsx
'use client';

import { useState } from 'react';

interface Props {
  onAnalyze: (wallet: string) => void;
}

const DEMO_WALLETS = [
  { label: 'Heavy Trader', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU' },
  { label: 'Paper Hands', address: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKH' },
  { label: 'Degen Max',   address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
];

export default function ConnectScreen({ onAnalyze }: Props) {
  const [input, setInput] = useState('');

  function handleSubmit() {
    onAnalyze(input.trim());
  }

  async function connectPhantom() {
    // Real Phantom wallet connection
    try {
      const { solana } = window as any;
      if (!solana?.isPhantom) {
        window.open('https://phantom.app/', '_blank');
        return;
      }
      const response = await solana.connect();
      onAnalyze(response.publicKey.toString());
    } catch {
      // User rejected or no wallet — fall through
    }
  }

  async function connectSolflare() {
    try {
      const { solflare } = window as any;
      if (!solflare) {
        window.open('https://solflare.com/', '_blank');
        return;
      }
      await solflare.connect();
      if (solflare.publicKey) {
        onAnalyze(solflare.publicKey.toString());
      }
    } catch { /* user rejected */ }
  }

  return (
    <main className="connect-screen">
      <p className="eyebrow">Onchain Trade Intelligence</p>

      <h1 className="hero-title">
        Your trades.<br />
        <span className="red">Unfiltered.</span>
      </h1>

      <p className="hero-sub">
        Connect your wallet. SLIP reads your last 100 trades, scores your
        performance, shows you who won your money and why.
      </p>

      <div className="connect-box">
        <label className="box-label">Enter wallet address</label>

        <div className="input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Paste Solana wallet address..."
            spellCheck={false}
            autoComplete="off"
            className="wallet-input"
          />
          <button onClick={handleSubmit} className="btn-analyze">
            Analyze →
          </button>
        </div>

        <div className="divider">OR CONNECT WALLET</div>

        <button onClick={connectPhantom} className="wallet-btn">
          <span className="wallet-icon phantom">👻</span>
          <span>Phantom</span>
          <span className="arrow">→</span>
        </button>

        <button onClick={connectSolflare} className="wallet-btn">
          <span className="wallet-icon solflare">☀</span>
          <span>Solflare</span>
          <span className="arrow">→</span>
        </button>
      </div>

      <div className="demo-row">
        <span className="demo-label">Try a demo →</span>
        {DEMO_WALLETS.map(w => (
          <button
            key={w.address}
            className="demo-chip"
            onClick={() => setInput(w.address)}
          >
            {w.label}
          </button>
        ))}
      </div>
    </main>
  );
}
```

### 3c. Create `components/LoadingScreen.tsx`

```tsx
// components/LoadingScreen.tsx
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
    <main className="loading-screen">
      <h2 className="loading-title">Analyzing wallet</h2>
      <p className="loading-addr">{short}</p>

      <div className="loading-panel">
        <div className="panel-header">
          <span>Running your Payslip</span>
          <span className="pct" style={{ color: 'var(--red)' }}>{progress}%</span>
        </div>

        {STEPS.map(step => {
          const isDone   = doneSteps.includes(step.id);
          const isActive = activeStep === step.id && !isDone;

          return (
            <div
              key={step.id}
              className={`loading-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
            >
              <div className={`step-icon ${isActive ? 'spinning' : ''} ${isDone ? 'done' : ''}`}>
                {isDone ? '✓' : step.id}
              </div>
              <div>
                <div className="step-text">{step.text}</div>
                <div className="step-sub">{step.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </main>
  );
}
```

### 3d. Update `app/payslip/[wallet]/page.tsx`

This page now needs to render VERDICT and MIRROR as side panels alongside the trade cards. The key additions are:

```tsx
// app/payslip/[wallet]/page.tsx
import VerdictPanel from '@/components/VerdictPanel';
import MirrorPanel  from '@/components/MirrorPanel';
import PayslipCard  from '@/components/PayslipCard';   // your existing TradeCard renamed

// In the page component, add panel state:
const [verdictMint, setVerdictMint] = useState<string | null>(null);
const [mirrorMint,  setMirrorMint]  = useState<string | null>(null);
const [panelSymbol, setPanelSymbol] = useState('');

// Pass these handlers down to each PayslipCard:
function openVerdict(symbol: string, mint: string) {
  setMirrorMint(null);
  setPanelSymbol(symbol);
  setVerdictMint(mint);
}

function openMirror(symbol: string, mint: string) {
  setVerdictMint(null);
  setPanelSymbol(symbol);
  setMirrorMint(mint);
}

// In the JSX, add the panels at the bottom of the return:
return (
  <>
    {/* ... your existing payslip content ... */}

    {/* VERDICT side panel */}
    <VerdictPanel
      mint={verdictMint}
      symbol={panelSymbol}
      onClose={() => setVerdictMint(null)}
    />

    {/* MIRROR side panel */}
    <MirrorPanel
      mint={mirrorMint}
      symbol={panelSymbol}
      onClose={() => setMirrorMint(null)}
    />

    {/* Backdrop */}
    {(verdictMint || mirrorMint) && (
      <div
        className="panel-backdrop"
        onClick={() => { setVerdictMint(null); setMirrorMint(null); }}
      />
    )}
  </>
);
```

### 3e. Create `components/VerdictPanel.tsx`

```tsx
// components/VerdictPanel.tsx
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
    <>
      <div className={`side-panel ${isOpen ? 'open' : ''}`} id="panel-verdict">
        <div className="panel-header">
          <div>
            <div className="panel-type verdict-type">⚖ VERDICT</div>
            <div className="panel-title">${symbol} Safety Scan</div>
          </div>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          {loading && (
            <div className="panel-loading">Scanning ${symbol}...</div>
          )}

          {data && !loading && (
            <>
              {/* Score hero */}
              <div className="verdict-hero">
                <div className="score-ring">
                  {/* Render the score ring with data.overallScore */}
                  <span className="score-num" style={{ color: getScoreColor(data.overallScore) }}>
                    {data.overallScore}
                  </span>
                </div>
                <div>
                  <div className={`verdict-badge vb-${data.verdict.toLowerCase()}`}>
                    {data.verdict}
                  </div>
                  <div className="verdict-summary">{data.summary}</div>
                </div>
              </div>

              {/* Check rows */}
              {data.checks?.map((check: any) => (
                <div key={check.name} className="check-row">
                  <div className={`check-icon ci-${check.passed ? 'pass' : check.severity === 'critical' ? 'fail' : 'warn'}`}>
                    {check.passed ? '✓' : check.severity === 'critical' ? '✕' : '!'}
                  </div>
                  <div className="check-content">
                    <div className="check-name">{check.name}</div>
                    <div className="check-detail">{check.detail}</div>
                  </div>
                  <span className={`check-sev sev-${check.passed ? 'pass' : check.severity}`}>
                    {check.passed ? 'PASS' : check.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--green)';
  if (score >= 60) return 'var(--amber)';
  if (score >= 40) return '#f97316';
  return 'var(--red)';
}
```

### 3f. Create `components/MirrorPanel.tsx`

```tsx
// components/MirrorPanel.tsx
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
        <div>
          <div className="panel-type mirror-type">🪞 MIRROR</div>
          <div className="panel-title">${symbol} Winners</div>
        </div>
        <button className="panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="panel-body">
        {loading && (
          <div className="panel-loading">Fetching winners for ${symbol}...</div>
        )}

        {data && !loading && (
          <>
            <div className="mirror-context">
              Showing all wallets that won on <strong>${symbol}</strong> — ranked by SOL gained
            </div>

            {/* Winner leaderboard */}
            <div className="lb-table">
              {data.winners?.map((winner: any, i: number) => (
                <div key={winner.address} className={`lb-row ${i === 0 ? 'top-row' : ''}`}>
                  <div className={`lb-rank rk${i + 1}`}>{i + 1}</div>
                  <div>
                    <div className="lb-addr">
                      {winner.address.slice(0, 4)}...{winner.address.slice(-4)}
                      {winner.tag && (
                        <span className={`wallet-tag wt-${winner.tag.toLowerCase().replace(' ', '-')}`}>
                          {winner.tag}
                        </span>
                      )}
                    </div>
                    <div className="lb-sub">
                      {winner.entryMarketCap ? `$${(winner.entryMarketCap / 1000).toFixed(0)}k mcap` : '—'} ·{' '}
                      {winner.holdTimeMinutes ? `${winner.holdTimeMinutes}m hold` : 'Still in'}
                    </div>
                  </div>
                  <div className={`lb-pnl ${winner.totalPnlSOL < 0 ? 'neg' : ''}`}>
                    {winner.totalPnlSOL > 0 ? '+' : ''}{winner.totalPnlSOL.toFixed(1)} SOL
                  </div>
                </div>
              ))}
            </div>

            {/* Pattern insights */}
            {data.patternInsights && (
              <div className="pattern-insights">
                <div className="pi-title">◈ What Winners Had in Common</div>
                {data.patternInsights.avgEntryMarketCap && (
                  <div className="pi-row">
                    <span>Avg entry market cap</span>
                    <span>${(data.patternInsights.avgEntryMarketCap / 1000).toFixed(0)}k</span>
                  </div>
                )}
                {data.patternInsights.avgHoldTimeMinutes > 0 && (
                  <div className="pi-row">
                    <span>Avg hold before exit</span>
                    <span>{data.patternInsights.avgHoldTimeMinutes} min</span>
                  </div>
                )}
                <div className="pi-row">
                  <span>Most used DEX</span>
                  <span>{data.patternInsights.mostUsedDex}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

---

## STEP 4 — Update your PayslipCard component

Your existing `TradeCard.tsx` (or whatever you've named it) needs two new action buttons at the bottom of each expanded card. Find the actions section and add:

```tsx
// Inside your trade card expanded section, in the actions row:

<button
  className="action-btn verdict-action"
  onClick={() => onVerdictClick(trade.tokenSymbol, trade.tokenMint)}
>
  ⚖ Run Verdict on {trade.tokenSymbol}
</button>

<button
  className="action-btn mirror-action"
  onClick={() => onMirrorClick(trade.tokenSymbol, trade.tokenMint)}
>
  🪞 Full Mirror →
</button>
```

The component needs to accept these as props:

```tsx
interface PayslipCardProps {
  trade: TradeAnalysis;
  rank: number;
  onVerdictClick: (symbol: string, mint: string) => void;  // new
  onMirrorClick:  (symbol: string, mint: string) => void;  // new
}
```

---

## STEP 5 — Add the CSS for side panels

The side panel behavior requires these CSS rules. Add them to your global stylesheet (`app/globals.css`):

```css
/* ─── SIDE PANEL ─── */
.side-panel {
  position: fixed;
  inset: 0 0 0 auto;
  width: min(520px, 100vw);
  background: var(--surface2);
  border-left: 1px solid var(--border2);
  z-index: 300;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
  top: 52px; /* clear the nav */
}

.side-panel.open {
  transform: translateX(0);
}

/* ─── PANEL BACKDROP ─── */
.panel-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 299;
  backdrop-filter: blur(4px);
  cursor: pointer;
}

/* ─── VERDICT action button ─── */
.verdict-action {
  border-color: rgba(255, 45, 45, 0.2);
  color: var(--red);
}

.verdict-action:hover {
  background: rgba(255, 45, 45, 0.08);
  border-color: var(--red);
}

/* ─── MIRROR action button ─── */
.mirror-action {
  border-color: rgba(59, 130, 246, 0.2);
  color: var(--blue);
}

.mirror-action:hover {
  background: rgba(59, 130, 246, 0.08);
  border-color: var(--blue);
}
```

---

## STEP 6 — Update your nav

The nav needs to show the connected wallet address after analysis. Add this to your `Nav.tsx` or layout:

```tsx
// In your nav component, accept a walletAddress prop:
// When the user is on /payslip/[wallet], extract the wallet from the URL

import { useParams } from 'next/navigation';

export default function Nav() {
  const params = useParams();
  const wallet = params?.wallet as string | undefined;
  const short = wallet
    ? wallet.slice(0, 6) + '...' + wallet.slice(-4)
    : null;

  return (
    <nav>
      <div className="nav-logo" onClick={() => router.push('/')}>
        <div className="nav-logo-mark" />
        SLIP
      </div>

      {short && (
        <div className="nav-wallet">
          <div className="wallet-dot" />
          {short}
        </div>
      )}

      <div className="nav-right">
        <span className="nav-badge">SOLANA</span>
      </div>
    </nav>
  );
}
```

---

## STEP 7 — Remove the old tab navigation

If you have a nav with VERDICT · MIRROR · PAYSLIP tabs, remove them. Those tabs no longer exist. VERDICT and MIRROR are not top-level pages anymore — they are contextual panels that open from within Payslip.

If you built `/verdict` and `/mirror` as separate pages, you can keep them for now (they won't break anything) but remove the nav links to them. In a later cleanup you can redirect those routes to the homepage.

---

## STEP 8 — Commit and push

Commit after each major piece so you have clean rollback points:

```bash
# After Step 3a + 3b (connect screen)
git add app/page.tsx components/ConnectScreen.tsx components/LoadingScreen.tsx
git commit -m "feat(v2): wallet connect entry screen + loading flow"

# After Step 3d + 3e + 3f (panels)
git add app/payslip components/VerdictPanel.tsx components/MirrorPanel.tsx
git commit -m "feat(v2): verdict and mirror as contextual side panels"

# After Step 4 (payslip card actions)
git add components/PayslipCard.tsx
git commit -m "feat(v2): add verdict and mirror action buttons to trade cards"

# After Step 5 + 6 (CSS + nav)
git add app/globals.css components/Nav.tsx
git commit -m "feat(v2): side panel CSS + connected wallet nav state"

# Final push
git push origin feat/slip-v2-wallet-entry
```

---

## STEP 9 — Deploy preview to Vercel

```bash
# Deploy the v2 branch as a preview URL (not production)
vercel --prod=false

# Vercel will give you a URL like:
# https://slip-git-feat-slip-v2-wallet-entry-yourname.vercel.app
#
# Use this URL to test the full flow before merging to main
```

Test this checklist on the preview URL before merging:

```
[ ] Connect screen loads with no tabs, no feature grid
[ ] Pasting a wallet address and hitting Enter starts the loading screen
[ ] Demo chips fill the input correctly
[ ] Loading steps animate in sequence
[ ] Payslip results load after loading completes
[ ] Connected wallet address shows in nav
[ ] Expanding a trade card shows YOUR TRADE and TOP WINNER columns
[ ] "Run Verdict on $TOKEN" button opens the verdict side panel
[ ] "Full Mirror →" button opens the mirror side panel
[ ] Clicking the backdrop closes either panel
[ ] ESC key closes open panels
[ ] "← Analyze another wallet" returns to connect screen
[ ] Share card modal opens and shows correct token + P&L
```

---

## STEP 10 — Merge to main when ready

```bash
# Switch to main
git checkout main

# Merge v2 branch
git merge feat/slip-v2-wallet-entry

# Push main (this auto-deploys to production on Vercel)
git push origin main

# Tag this as v2
git tag -a v2.0-slip-wallet-entry -m "SLIP v2 — wallet connect entry, payslip first, contextual panels"
git push origin v2.0-slip-wallet-entry
```

---

## Summary of what this PR changes

| Before | After |
|---|---|
| Landing with feature tabs | Wallet connect screen, one action |
| User picks a feature to use | SLIP automatically runs Payslip on connect |
| VERDICT and MIRROR are separate pages | VERDICT and MIRROR slide in as panels from trade cards |
| Nav has 3 feature tabs | Nav shows connected wallet address |
| Generic tool feel | Personalized product feel |

---

*SLIP v2 — Branch: `feat/slip-v2-wallet-entry`*
*Merge target: `main` · Tag on merge: `v2.0-slip-wallet-entry`*
