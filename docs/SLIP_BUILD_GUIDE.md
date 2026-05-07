# SLIP — Build Migration Guide
### From TradePostmortem → SLIP: Verdict · Mirror · Payslip

---

## 0. BEFORE YOU TOUCH ANYTHING

You have a working build on GitHub called `tradepostmortem`.  
Do not delete it. Do not overwrite it. It is your proof of work for Colosseum.  
The strategy: **preserve the original, branch into SLIP, rebuild clean.**

---

## 1. PRESERVE YOUR CURRENT BUILD

### Step 1 — Tag the current state as a release
This freezes your TradePostmortem v1 in git history permanently.

```bash
# Make sure everything is committed first
git add .
git commit -m "chore: freeze TradePostmortem v1 before SLIP migration"

# Tag this exact commit
git tag -a v1.0-tradepostmortem -m "TradePostmortem v1 — Colosseum Frontier submission snapshot"

# Push the tag to GitHub
git push origin v1.0-tradepostmortem
```

Now go to GitHub → your repo → Releases → Draft a new release  
Select tag `v1.0-tradepostmortem` → title it `TradePostmortem v1.0` → publish.  
This gives you a permanent, timestamped, downloadable snapshot. Judges can see this.

---

### Step 2 — Create a preservation branch
```bash
# You're currently on main. Create a snapshot branch.
git checkout -b archive/tradepostmortem-v1

# Push it
git push origin archive/tradepostmortem-v1
```

This branch never gets touched again. It is the museum.

---

### Step 3 — Create the SLIP development branch
```bash
# Go back to main
git checkout main

# Create the SLIP feature branch
git checkout -b feat/slip-rebrand

# Push it
git push origin feat/slip-rebrand
```

Your branch structure now looks like this:

```
main                          ← stable, always deployable
├── archive/tradepostmortem-v1  ← frozen v1, never touched
└── feat/slip-rebrand           ← where all SLIP work happens
```

---

## 2. RENAME THE PROJECT

### In your repo (on feat/slip-rebrand branch):

```bash
# Update package.json
# Change "name": "tradepostmortem" → "name": "slip-app"

# Update all page titles, meta tags, og:title
# Find and replace across the codebase:
grep -r "TradePostmortem" . --include="*.tsx" --include="*.ts" --include="*.html" -l
grep -r "tradepostmortem" . --include="*.tsx" --include="*.ts" --include="*.html" -l
```

Replace every instance of:
- `TradePostmortem` → `SLIP`
- `tradepostmortem` → `slip`
- `Trade Autopsy` → `Onchain Trade Intelligence`
- `PAYSLIP` stays as the feature name inside SLIP
- Update Vercel project name in dashboard: Settings → General → Project Name

---

## 3. NEW FILE STRUCTURE

This is the full folder structure for the SLIP rebuild.  
Files marked `[EXISTS]` you already have — refactor them.  
Files marked `[NEW]` you need to create from scratch.

```
slip/
├── app/
│   ├── page.tsx                          [EXISTS] → full redesign (landing)
│   ├── layout.tsx                        [EXISTS] → update meta, title, fonts
│   │
│   ├── payslip/
│   │   └── [wallet]/
│   │       └── page.tsx                  [EXISTS] → expanded results page
│   │
│   ├── mirror/                           [NEW]
│   │   └── [mint]/
│   │       └── page.tsx                  [NEW] winner leaderboard page
│   │
│   ├── verdict/                          [NEW]
│   │   └── [mint]/
│   │       └── page.tsx                  [NEW] token scan results page
│   │
│   └── api/
│       ├── trades/route.ts               [EXISTS] → keep
│       ├── analyze/route.ts              [EXISTS] → keep, extend
│       ├── price/route.ts                [EXISTS] → keep
│       │
│       ├── verdict/
│       │   └── route.ts                  [NEW] token safety + market scan
│       │
│       └── mirror/
│           └── route.ts                  [NEW] winner leaderboard logic
│
├── lib/
│   ├── helius.ts                         [EXISTS] → keep
│   ├── birdeye.ts                        [EXISTS] → keep, add OHLCV methods
│   ├── analyzer.ts                       [EXISTS] → keep, extend pattern detection
│   │
│   ├── rugcheck.ts                       [NEW] deployer history API wrapper
│   ├── verdict-engine.ts                 [NEW] scoring logic for VERDICT
│   └── mirror-engine.ts                  [NEW] winner leaderboard logic
│
├── components/
│   ├── Nav.tsx                           [EXISTS] → redesign with 3 feature tabs
│   ├── WalletInput.tsx                   [EXISTS] → keep
│   ├── TradeCard.tsx                     [EXISTS] → rename PayslipCard.tsx
│   ├── ShareCard.tsx                     [EXISTS] → keep, update branding to SLIP
│   │
│   ├── VerdictCard.tsx                   [NEW] token scan result display
│   ├── VerdictScore.tsx                  [NEW] the 0-100 score ring component
│   ├── MirrorLeaderboard.tsx             [NEW] winner board component
│   ├── MirrorGapCard.tsx                 [NEW] your position vs winner
│   ├── PatternReport.tsx                 [NEW] recurring mistake detection
│   └── GradeCard.tsx                     [NEW] overall trading grade breakdown
│
└── types/
    └── index.ts                          [EXISTS] → extend with new interfaces
```

---

## 4. NEW API KEYS NEEDED

| Service | What For | URL |
|---|---|---|
| Rugcheck.xyz | Deployer rug history | rugcheck.xyz/api |
| Helius (existing) | Token metadata, getAccountInfo | — |
| Birdeye (existing) | Winner wallet P&L, top traders | — |

Add to `.env.local`:
```bash
RUGCHECK_API_KEY=your_key_here
# Helius and Birdeye keys you already have
```

---

## 5. BUILD ORDER (Day by Day)

You have roughly 7 days left after the migration setup.  
Do not build all three features simultaneously. Ship in order of complexity.

```
Day 1   — Git migration (tag, branch, rename). Vercel redeploy as SLIP.
          Confirm existing TradePostmortem features still work on new branch.

Day 2   — VERDICT: build verdict-engine.ts + /api/verdict/route.ts
          Focus: mint auth check, freeze auth, LP lock, rugcheck deployer lookup
          Get a clean JSON response working for any token mint

Day 3   — VERDICT: build VerdictCard.tsx + VerdictScore.tsx
          The 0-100 score ring. The checklist UI. The market structure breakdown.
          Wire /verdict/[mint]/page.tsx to the API

Day 4   — MIRROR: build mirror-engine.ts + /api/mirror/route.ts
          Fetch top traders for a token from Birdeye top_traders endpoint
          Sort by absolute SOL gain. Pull their entry timestamps.
          Build the gap analysis logic (your position vs #1 winner)

Day 5   — MIRROR: build MirrorLeaderboard.tsx + MirrorGapCard.tsx
          Wire /mirror/[mint]/page.tsx
          Add the "what did top winners have in common" pattern section

Day 6   — PAYSLIP: extend analyzer.ts with PatternReport + GradeCard
          Add "who won most on this token" to each trade card
          Add recurring mistake detection across all trades
          Add the four-category trading grade (Entry / Exit / Size / Selection)

Day 7   — Full landing page redesign with all three features presented
          Update Nav.tsx with VERDICT · MIRROR · PAYSLIP tabs
          Update ShareCard branding to SLIP
          Redeploy, test all three flows on real wallets, record demo video
```

---

## 6. NEW CORE CODE

### `lib/rugcheck.ts`
```typescript
const RUGCHECK_BASE = 'https://api.rugcheck.xyz/v1';

export interface DeployerHistory {
  address: string;
  totalTokensDeployed: number;
  ruggedTokens: number;
  rugRate: number; // 0-1
  lastActivity: number; // unix timestamp
  knownScammer: boolean;
}

export async function getDeployerHistory(
  deployerAddress: string
): Promise<DeployerHistory | null> {
  try {
    const res = await fetch(
      `${RUGCHECK_BASE}/deployer/${deployerAddress}/report`,
      { headers: { 'Authorization': `Bearer ${process.env.RUGCHECK_API_KEY}` } }
    );
    const data = await res.json();
    return {
      address: deployerAddress,
      totalTokensDeployed: data.totalTokens ?? 0,
      ruggedTokens: data.ruggedTokens ?? 0,
      rugRate: data.rugRate ?? 0,
      lastActivity: data.lastActivityTimestamp ?? 0,
      knownScammer: data.flagged ?? false,
    };
  } catch {
    return null;
  }
}

export async function getTokenReport(mint: string) {
  try {
    const res = await fetch(`${RUGCHECK_BASE}/tokens/${mint}/report`);
    return await res.json();
  } catch {
    return null;
  }
}
```

---

### `lib/verdict-engine.ts`
```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { getDeployerHistory, getTokenReport } from './rugcheck';
import { getCurrentPrice, getOHLCV } from './birdeye';

const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
);

export interface VerdictCheck {
  name: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
  score: number; // points deducted if failed
}

export interface VerdictResult {
  mint: string;
  symbol: string;
  overallScore: number; // 0-100
  verdict: 'CLEAN' | 'CAUTION' | 'FLAGGED' | 'TRAP';
  checks: VerdictCheck[];
  topHolderConcentration: number; // % held by top 10
  buyPressure: { '15m': number; '1h': number; '6h': number };
  deployerHistory: Awaited<ReturnType<typeof getDeployerHistory>>;
  smartMoneyPresent: boolean;
  isLate: boolean; // are you entering too late in the curve
  summary: string;
}

export async function runVerdict(mint: string): Promise<VerdictResult> {
  const checks: VerdictCheck[] = [];
  let score = 100;

  // ── 1. Mint authority check ──
  const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
  const mintData = (mintInfo.value?.data as any)?.parsed?.info;

  const mintAuthority = mintData?.mintAuthority;
  const freezeAuthority = mintData?.freezeAuthority;

  checks.push({
    name: 'Mint Authority',
    passed: !mintAuthority,
    severity: 'critical',
    detail: mintAuthority
      ? `Active mint authority: ${mintAuthority.slice(0, 8)}... — dev can print unlimited supply`
      : 'Mint authority disabled. Supply is fixed.',
    score: 25,
  });
  if (mintAuthority) score -= 25;

  checks.push({
    name: 'Freeze Authority',
    passed: !freezeAuthority,
    severity: 'critical',
    detail: freezeAuthority
      ? `Freeze authority active — your tokens can be locked`
      : 'No freeze authority. Your tokens cannot be locked.',
    score: 20,
  });
  if (freezeAuthority) score -= 20;

  // ── 2. Rugcheck report ──
  const rugReport = await getTokenReport(mint);
  const lpLocked = rugReport?.lpLocked ?? false;
  const transferHook = rugReport?.transferHook ?? false;
  const topHolderPct = rugReport?.topHoldersConcentration ?? 0;
  const deployerAddress = rugReport?.deployer ?? null;

  checks.push({
    name: 'Liquidity Lock',
    passed: lpLocked,
    severity: 'critical',
    detail: lpLocked
      ? 'LP is locked or burned. Dev cannot pull liquidity.'
      : 'LP is NOT locked. Dev can remove liquidity at any time.',
    score: 20,
  });
  if (!lpLocked) score -= 20;

  checks.push({
    name: 'Transfer Hook',
    passed: !transferHook,
    severity: 'critical',
    detail: transferHook
      ? 'Custom transfer hook detected — sells may be taxed or blocked'
      : 'No transfer hooks. Standard token behavior.',
    score: 20,
  });
  if (transferHook) score -= 20;

  checks.push({
    name: 'Top 10 Holder Concentration',
    passed: topHolderPct < 50,
    severity: topHolderPct > 70 ? 'critical' : 'warning',
    detail: `Top 10 wallets hold ${topHolderPct.toFixed(1)}% of supply. ${
      topHolderPct > 70 ? 'Extreme dump risk.' : topHolderPct > 50 ? 'High concentration.' : 'Acceptable distribution.'
    }`,
    score: topHolderPct > 70 ? 15 : 8,
  });
  if (topHolderPct > 70) score -= 15;
  else if (topHolderPct > 50) score -= 8;

  // ── 3. Deployer history ──
  let deployerHistory = null;
  if (deployerAddress) {
    deployerHistory = await getDeployerHistory(deployerAddress);
    if (deployerHistory) {
      checks.push({
        name: 'Deployer History',
        passed: deployerHistory.rugRate < 0.3 && !deployerHistory.knownScammer,
        severity: deployerHistory.knownScammer ? 'critical' : 'warning',
        detail: deployerHistory.knownScammer
          ? `Known scammer wallet. Deployed ${deployerHistory.totalTokensDeployed} tokens, rugged ${deployerHistory.ruggedTokens}.`
          : `Deployer has ${(deployerHistory.rugRate * 100).toFixed(0)}% rug rate across ${deployerHistory.totalTokensDeployed} tokens.`,
        score: deployerHistory.knownScammer ? 15 : deployerHistory.rugRate > 0.5 ? 10 : 0,
      });
      if (deployerHistory.knownScammer) score -= 15;
      else if (deployerHistory.rugRate > 0.5) score -= 10;
    }
  }

  // ── 4. Timing / curve position ──
  const now = Math.floor(Date.now() / 1000);
  const ohlcv = await getOHLCV(mint, now - 3600 * 6, now, '15m');
  let isLate = false;

  if (ohlcv.length > 2) {
    const firstCandle = ohlcv[0];
    const latestCandle = ohlcv[ohlcv.length - 1];
    const runUp = ((latestCandle.c - firstCandle.o) / firstCandle.o) * 100;
    isLate = runUp > 300;

    checks.push({
      name: 'Entry Timing',
      passed: !isLate,
      severity: 'warning',
      detail: isLate
        ? `Token is up ${runUp.toFixed(0)}% in 6h. You may be entering late in the distribution phase.`
        : `Token has moved ${runUp.toFixed(0)}% in 6h. Entry timing looks reasonable.`,
      score: isLate ? 5 : 0,
    });
    if (isLate) score -= 5;
  }

  // ── Verdict label ──
  const verdict =
    score >= 80 ? 'CLEAN' :
    score >= 60 ? 'CAUTION' :
    score >= 40 ? 'FLAGGED' : 'TRAP';

  const summary =
    verdict === 'CLEAN' ? 'No major red flags detected. Standard risk applies.' :
    verdict === 'CAUTION' ? 'Some risks present. Enter with reduced size and a clear exit plan.' :
    verdict === 'FLAGGED' ? 'Multiple red flags detected. High probability of loss.' :
    'Critical risks detected. This token has trap characteristics. Do not enter.';

  return {
    mint,
    symbol: rugReport?.symbol ?? 'UNKNOWN',
    overallScore: Math.max(0, score),
    verdict,
    checks,
    topHolderConcentration: topHolderPct,
    buyPressure: { '15m': 0, '1h': 0, '6h': 0 }, // extend with Birdeye volume data
    deployerHistory,
    smartMoneyPresent: false, // extend with Birdeye top_traders check
    isLate,
    summary,
  };
}
```

---

### `lib/mirror-engine.ts`
```typescript
import { getHistoricalPrice, getCurrentPrice } from './birdeye';

const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY!;
const BASE = 'https://public-api.birdeye.so';

export interface WinnerWallet {
  address: string;
  tag: string | null;         // "Known KOL", "Smart Money", "Bot", null
  entryTimestamp: number;
  entryPrice: number;
  exitTimestamp: number | null;
  exitPrice: number | null;
  currentPrice: number | null;
  solDeployed: number;
  realizedPnlSOL: number | null;
  unrealizedPnlSOL: number | null;
  totalPnlSOL: number;
  roi: number;                // percentage
  holdTimeMinutes: number | null;
  tookPartialProfits: boolean;
  entryMarketCap: number | null;
}

export interface MirrorResult {
  mint: string;
  symbol: string;
  winners: WinnerWallet[];
  topWinner: WinnerWallet;
  patternInsights: {
    avgEntryMarketCap: number | null;
    avgHoldTimeMinutes: number;
    mostUsedDex: string;
    mostTookPartials: boolean;
    avgEntryMinutesBeforePeak: number;
  };
  yourPosition: {
    entryTimestamp: number;
    entryPrice: number;
    solDeployed: number;
    currentPnlSOL: number;
    vsTopWinnerGapSOL: number;
    entryTimingDiffMinutes: number; // negative = you were later
  } | null;
}

export async function getMirrorData(
  mint: string,
  userEntryTimestamp?: number,
  userSolDeployed?: number
): Promise<MirrorResult> {
  // Fetch top traders from Birdeye
  const res = await fetch(
    `${BASE}/defi/v3/token/top-traders?address=${mint}&time_frame=24h&sort_by=realized_profit&sort_type=desc&limit=20`,
    {
      headers: {
        'accept': 'application/json',
        'x-chain': 'solana',
        'X-API-KEY': BIRDEYE_KEY,
      },
    }
  );

  const data = await res.json();
  const traders = data?.data?.items ?? [];

  const winners: WinnerWallet[] = traders
    .filter((t: any) => (t.realizedProfit ?? 0) > 0 || (t.unrealizedProfit ?? 0) > 0)
    .map((t: any) => {
      const realizedSOL = t.realizedProfit ?? 0;
      const unrealizedSOL = t.unrealizedProfit ?? 0;
      return {
        address: t.address,
        tag: t.tag ?? null,
        entryTimestamp: t.firstTradeTime ?? 0,
        entryPrice: t.buyPrice ?? 0,
        exitTimestamp: t.lastSellTime ?? null,
        exitPrice: t.sellPrice ?? null,
        currentPrice: null,
        solDeployed: t.volume ?? 0,
        realizedPnlSOL: realizedSOL,
        unrealizedPnlSOL: unrealizedSOL,
        totalPnlSOL: realizedSOL + unrealizedSOL,
        roi: t.buyPrice > 0
          ? (((t.sellPrice ?? t.buyPrice) - t.buyPrice) / t.buyPrice) * 100
          : 0,
        holdTimeMinutes: t.firstTradeTime && t.lastSellTime
          ? Math.round((t.lastSellTime - t.firstTradeTime) / 60)
          : null,
        tookPartialProfits: t.tradeCount > 2,
        entryMarketCap: t.entryMarketCap ?? null,
      };
    })
    .sort((a: WinnerWallet, b: WinnerWallet) => b.totalPnlSOL - a.totalPnlSOL);

  const topWinner = winners[0];

  // Pattern analysis across top 10
  const top10 = winners.slice(0, 10);
  const avgHoldTime = top10
    .filter(w => w.holdTimeMinutes !== null)
    .reduce((sum, w) => sum + (w.holdTimeMinutes ?? 0), 0) / (top10.filter(w => w.holdTimeMinutes !== null).length || 1);

  const avgEntryMcap = top10
    .filter(w => w.entryMarketCap !== null)
    .reduce((sum, w) => sum + (w.entryMarketCap ?? 0), 0) / (top10.filter(w => w.entryMarketCap !== null).length || 1);

  const patternInsights = {
    avgEntryMarketCap: avgEntryMcap || null,
    avgHoldTimeMinutes: Math.round(avgHoldTime),
    mostUsedDex: 'Raydium', // extend with per-trade dex data
    mostTookPartials: top10.filter(w => w.tookPartialProfits).length > 5,
    avgEntryMinutesBeforePeak: 0, // extend with OHLCV peak detection
  };

  // Your position gap analysis
  let yourPosition = null;
  if (userEntryTimestamp && topWinner) {
    const currentPrice = await getCurrentPrice(mint);
    const entryPrice = await getHistoricalPrice(mint, userEntryTimestamp);
    const currentPnl = entryPrice && currentPrice && userSolDeployed
      ? (currentPrice / entryPrice - 1) * userSolDeployed
      : 0;

    yourPosition = {
      entryTimestamp: userEntryTimestamp,
      entryPrice: entryPrice ?? 0,
      solDeployed: userSolDeployed ?? 0,
      currentPnlSOL: currentPnl,
      vsTopWinnerGapSOL: topWinner.totalPnlSOL - currentPnl,
      entryTimingDiffMinutes: Math.round(
        (userEntryTimestamp - topWinner.entryTimestamp) / 60
      ),
    };
  }

  return {
    mint,
    symbol: data?.data?.symbol ?? 'UNKNOWN',
    winners,
    topWinner,
    patternInsights,
    yourPosition,
  };
}
```

---

## 7. EXTENDED PAYSLIP — Pattern Tax + Grade

Add these to `lib/analyzer.ts`:

```typescript
export interface PatternTax {
  mostCommonMistake: string;
  timesRepeated: number;
  totalCostSOL: number;
  avgWinnerEntryAdvantageMinutes: number; // winners entered X mins earlier than you
  avgLossHoldTimeHours: number;
  avgWinHoldTimeHours: number;
}

export interface TradingGrade {
  overall: string;           // A / B / C / D / F
  overallScore: number;      // 0-100
  entryDiscipline: number;   // 0-100 (are you buying top of candles?)
  exitDiscipline: number;    // 0-100 (are you selling bottoms or early?)
  sizeManagement: number;    // 0-100 (are you oversizing losers?)
  tokenSelection: number;    // 0-100 (are you picking high-verdict tokens?)
}

export function computePatternTax(analyses: TradeAnalysis[]): PatternTax {
  const mistakes = analyses.map(a => a.diagnosis);
  const counts: Record<string, number> = {};
  mistakes.forEach(m => { counts[m] = (counts[m] ?? 0) + 1; });

  const mostCommon = Object.entries(counts)
    .filter(([k]) => k !== 'GOOD_TRADE' && k !== 'UNKNOWN')
    .sort((a, b) => b[1] - a[1])[0];

  const losses = analyses.filter(a => (a.realizedPnlSOL ?? 0) < 0);
  const wins = analyses.filter(a => (a.realizedPnlSOL ?? 0) > 0);

  const totalLostToMistake = analyses
    .filter(a => a.diagnosis === (mostCommon?.[0] ?? ''))
    .reduce((sum, a) => sum + Math.abs(a.realizedPnlSOL ?? 0), 0);

  return {
    mostCommonMistake: mostCommon?.[0] ?? 'UNKNOWN',
    timesRepeated: mostCommon?.[1] ?? 0,
    totalCostSOL: totalLostToMistake,
    avgWinnerEntryAdvantageMinutes: 11, // pull from MIRROR data per token
    avgLossHoldTimeHours: losses.length
      ? losses.reduce((sum, a) => {
          const hold = a.exitTimestamp && a.entryTimestamp
            ? (a.exitTimestamp - a.entryTimestamp) / 3600 : 0;
          return sum + hold;
        }, 0) / losses.length
      : 0,
    avgWinHoldTimeHours: wins.length
      ? wins.reduce((sum, a) => {
          const hold = a.exitTimestamp && a.entryTimestamp
            ? (a.exitTimestamp - a.entryTimestamp) / 3600 : 0;
          return sum + hold;
        }, 0) / wins.length
      : 0,
  };
}

export function computeGrade(analyses: TradeAnalysis[]): TradingGrade {
  const entryScores = analyses
    .filter(a => a.damageScore !== undefined)
    .map(a => 100 - (a.diagnosis === 'BOUGHT_THE_TOP' ? a.damageScore : 0));

  const exitScores = analyses
    .map(a => a.diagnosis === 'PAPER_HANDS' ? 40 :
               a.diagnosis === 'SOLD_THE_BOTTOM' ? 35 :
               a.diagnosis === 'DIAMOND_HANDS_REKT' ? 25 :
               a.diagnosis === 'GOOD_TRADE' ? 90 : 60);

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 50;

  const entry = Math.round(avg(entryScores));
  const exit = Math.round(avg(exitScores));
  const size = 60;    // extend with position sizing analysis
  const selection = 55; // extend with VERDICT score of tokens traded

  const overall = Math.round((entry + exit + size + selection) / 4);

  return {
    overall: overall >= 80 ? 'A' : overall >= 65 ? 'B' : overall >= 50 ? 'C' : overall >= 35 ? 'D' : 'F',
    overallScore: overall,
    entryDiscipline: entry,
    exitDiscipline: exit,
    sizeManagement: size,
    tokenSelection: selection,
  };
}
```

---

## 8. GIT COMMIT RHYTHM

Commit at the end of every feature, not every file. Keep history clean for judges.

```bash
# After VERDICT backend
git add . && git commit -m "feat(verdict): token safety + market structure scan engine"

# After VERDICT frontend
git add . && git commit -m "feat(verdict): VerdictCard and VerdictScore UI components"

# After MIRROR backend
git add . && git commit -m "feat(mirror): winner leaderboard and gap analysis engine"

# After MIRROR frontend
git add . && git commit -m "feat(mirror): MirrorLeaderboard and MirrorGapCard UI"

# After PAYSLIP extensions
git add . && git commit -m "feat(payslip): pattern tax, trading grade, winner report"

# After full redesign
git add . && git commit -m "feat(ui): full SLIP redesign — landing, nav, all three feature flows"

# When ready to merge to main
git checkout main
git merge feat/slip-rebrand
git push origin main
git tag -a v2.0-slip -m "SLIP v2.0 — Verdict · Mirror · Payslip"
git push origin v2.0-slip
```

---

## 9. VERCEL DEPLOYMENT

```bash
# Install Vercel CLI if you don't have it
npm i -g vercel

# Link your project
vercel link

# Deploy the feat/slip-rebrand branch to a preview URL
vercel --prod=false

# Once merged to main, production deploys automatically
# Or force it:
vercel --prod
```

Set environment variables in Vercel dashboard → Settings → Environment Variables:
```
HELIUS_API_KEY
BIRDEYE_API_KEY
RUGCHECK_API_KEY
```

---

## 10. COLOSSEUM SUBMISSION UPDATE

When you submit, the judges see your GitHub. Make sure the README covers all three features now.

Update your README.md with this structure:

```markdown
# SLIP — Onchain Trade Intelligence

> Don't get in wrong. Know who's winning while you're in. Know what it cost you after.

## Features

### VERDICT — Pre-Trade Scanner
Paste any Solana token contract. Get a 0-100 safety + market structure score
covering mint authority, LP lock, transfer hooks, deployer history, holder
concentration, and entry timing. Know if you can exit before you enter.

### MIRROR — Live Winner Board
While you're in a position, see every wallet that entered the same token
and is currently winning — ranked by absolute SOL gain. Understand the gap
between your execution and the top performers. Extract the pattern of what
winners did differently.

### PAYSLIP — Trade Autopsy
Your full trade history analyzed. Every entry percentile, peak you missed,
and SOL left on table. Plus: who won the most on each token you traded and
why. Your recurring mistakes quantified. Your trading grade broken down
across Entry, Exit, Size, and Token Selection.

## Stack
Next.js 14 · TypeScript · Helius SDK · Birdeye API · Rugcheck API · Vercel

## Live Demo
[slip.xyz](https://your-vercel-url.vercel.app)
```

---

## 11. FINAL CHECKLIST BEFORE SUBMISSION

```
[ ] archive/tradepostmortem-v1 branch exists and is untouched
[ ] v1.0-tradepostmortem tag visible on GitHub releases page
[ ] feat/slip-rebrand merged to main
[ ] v2.0-slip tag pushed
[ ] All three features working on at least 5 real wallets / 5 real token mints
[ ] VERDICT tested on a known rug (use a dead token mint)
[ ] MIRROR tested on a high-volume token with many traders
[ ] PAYSLIP pattern report and grade showing for wallets with 10+ trades
[ ] Demo video recorded: 3 min, show all three features on real data
[ ] Vercel production URL live and in README
[ ] README updated with full feature descriptions
[ ] Colosseum submission form updated with new project name and description
```

---

*SLIP — Built for Colosseum Frontier Hackathon · Deadline May 11, 2026*
*Branch: feat/slip-rebrand · Archive: archive/tradepostmortem-v1*


# SLIP v2 Official Release
