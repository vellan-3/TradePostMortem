# SLIP — Payslip Bug Fix Implementation
### 9 fixes, in order of impact. Do them sequentially.

---

## FIX 1 — Same token appearing 10 times
**File:** `lib/helius.ts`
**Root cause:** Pump.fun emits multiple inner instructions per swap. Your parser creates one record per instruction instead of one per transaction.

Find your `getWalletSwaps` function. At the end, before the return statement, add deduplication:

```typescript
// At the end of getWalletSwaps(), replace the return line with:

const seen = new Set<string>();
const deduped = swaps.filter(s => {
  // Deduplicate by signature — one swap per transaction
  const key = `${s.signature}_${s.tokenMint}_${s.isBuy}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

return deduped.sort((a, b) => b.timestamp - a.timestamp);
```

---

## FIX 2 — Token shows `$FfqMru` instead of real ticker
**Files:** `lib/birdeye.ts`, `lib/pumpfun.ts` (new file), `app/api/analyze/route.ts`

### Step 1 — Create `lib/pumpfun.ts`

This is your primary metadata source for pump.fun tokens. No API key required.

```typescript
// lib/pumpfun.ts

export interface PumpFunMeta {
  symbol: string;
  name: string;
  marketCap: number | null;
  usdMarketCap: number | null;
  createdAt: number | null;
  creator: string | null;
  description: string | null;
}

export async function getPumpFunMeta(mint: string): Promise<PumpFunMeta | null> {
  try {
    const res = await fetch(
      `https://frontend-api.pump.fun/coins/${mint}`,
      {
        headers: { 'User-Agent': 'SLIP-App/1.0' },
        next: { revalidate: 60 }, // Next.js cache — revalidate every 60s
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    return {
      symbol: data.symbol ?? null,
      name: data.name ?? null,
      marketCap: data.market_cap ?? null,
      usdMarketCap: data.usd_market_cap ?? null,
      createdAt: data.created_timestamp ?? null,
      creator: data.creator ?? null,
      description: data.description ?? null,
    };
  } catch {
    return null;
  }
}
```

### Step 2 — Add batch metadata to `lib/birdeye.ts`

```typescript
// Add to lib/birdeye.ts

export interface TokenMeta {
  symbol: string;
  name: string;
  decimals: number;
}

export async function getBatchTokenMeta(
  mints: string[]
): Promise<Record<string, TokenMeta>> {
  if (mints.length === 0) return {};

  const unique = [...new Set(mints)].slice(0, 50);

  try {
    const res = await fetch(
      `${BASE}/defi/v3/token/meta-data/multiple`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': BIRDEYE_KEY,
        },
        body: JSON.stringify({ list_address: unique.join(',') }),
      }
    );

    const data = await res.json();
    const result: Record<string, TokenMeta> = {};

    for (const [mint, meta] of Object.entries(data?.data ?? {})) {
      const m = meta as any;
      if (m?.symbol && m.symbol.length > 0) {
        result[mint] = {
          symbol: m.symbol,
          name: m.name ?? m.symbol,
          decimals: m.decimals ?? 6,
        };
      }
    }

    return result;
  } catch {
    return {};
  }
}
```

### Step 3 — Wire into `app/api/analyze/route.ts`

After fetching swaps and before running analysis, enrich all token metadata:

```typescript
// In /api/analyze/route.ts, after getWalletSwaps():

import { getBatchTokenMeta } from '@/lib/birdeye';
import { getPumpFunMeta } from '@/lib/pumpfun';

// 1. Collect all unique mints
const mints = [...new Set(swaps.map(s => s.tokenMint))];

// 2. Try Birdeye batch first
const birdeyeMeta = await getBatchTokenMeta(mints);

// 3. For any mint Birdeye didn't return, try pump.fun API
const missingMints = mints.filter(m => !birdeyeMeta[m]);

const pumpMeta: Record<string, { symbol: string; name: string }> = {};
await Promise.allSettled(
  missingMints.map(async mint => {
    const meta = await getPumpFunMeta(mint);
    if (meta?.symbol) {
      pumpMeta[mint] = { symbol: meta.symbol, name: meta.name ?? meta.symbol };
    }
  })
);

// 4. Enrich every swap with resolved symbol
swaps.forEach(s => {
  const meta = birdeyeMeta[s.tokenMint] ?? pumpMeta[s.tokenMint];
  if (meta?.symbol) {
    s.tokenSymbol = '$' + meta.symbol.toUpperCase();
  }
  // If still unknown after both sources, show truncated mint
  if (!s.tokenSymbol || s.tokenSymbol === '$') {
    s.tokenSymbol = s.tokenMint.slice(0, 6) + '...';
  }
});
```

---

## FIX 3 — Winner SOL Deployed showing 380,775 SOL
**File:** `lib/mirror-engine.ts`
**Root cause:** Birdeye returns `buyVolume` in USD. You're displaying raw USD as SOL.

Find where you build your `WinnerWallet` objects from the Birdeye top_traders response. Replace the `solDeployed` calculation:

```typescript
// Add SOL price fetch at the top of getMirrorData():
const solMint = 'So11111111111111111111111111111111111111112';
const solPrice = await getCurrentPrice(solMint) ?? 0;

// Then when mapping each trader to WinnerWallet, replace:
// solDeployed: t.volume ?? 0,
// With:
solDeployed: solPrice > 0 && t.buyVolume
  ? parseFloat((t.buyVolume / solPrice).toFixed(2))
  : null,

// And for total P&L, also convert from USD to SOL:
realizedPnlSOL: solPrice > 0 && t.realizedProfit
  ? parseFloat((t.realizedProfit / solPrice).toFixed(4))
  : null,

unrealizedPnlSOL: solPrice > 0 && t.unrealizedProfit
  ? parseFloat((t.unrealizedProfit / solPrice).toFixed(4))
  : null,

totalPnlSOL: solPrice > 0
  ? parseFloat((((t.realizedProfit ?? 0) + (t.unrealizedProfit ?? 0)) / solPrice).toFixed(4))
  : 0,
```

---

## FIX 4 — Entry Price, Current Price, Peak all `UNAVAILABLE`
**File:** `lib/birdeye.ts`
**Root cause:** `historical_price_unix` returns null for very new/small pump.fun tokens not yet indexed by Birdeye.

Replace your current `getHistoricalPrice` with a function that has a fallback chain:

```typescript
// lib/birdeye.ts — replace getHistoricalPrice with this

export async function getPriceAtTimestamp(
  mint: string,
  timestamp: number
): Promise<number | null> {
  // --- Attempt 1: Birdeye historical price (fastest, most accurate) ---
  try {
    const res = await fetch(
      `${BASE}/defi/historical_price_unix?address=${mint}&unixtime=${timestamp}`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': BIRDEYE_KEY,
        },
      }
    );
    const data = await res.json();
    const price = data?.data?.value;
    if (price && price > 0) return price;
  } catch { /* fall through */ }

  // --- Attempt 2: Find closest trade in Birdeye's trades endpoint ---
  try {
    const res = await fetch(
      `${BASE}/defi/txs/token?address=${mint}&limit=50&tx_type=swap`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': BIRDEYE_KEY,
        },
      }
    );
    const data = await res.json();
    const trades: any[] = data?.data?.items ?? [];

    if (trades.length === 0) return null;

    // Find the trade closest in time to the target timestamp
    const closest = trades.reduce((best, t) => {
      const diff = Math.abs((t.blockUnixTime ?? 0) - timestamp);
      const bestDiff = Math.abs((best?.blockUnixTime ?? 0) - timestamp);
      return diff < bestDiff ? t : best;
    });

    const price = closest?.price ?? null;
    return price && price > 0 ? price : null;
  } catch { return null; }
}

// Update all callers of getHistoricalPrice to use getPriceAtTimestamp instead
// In analyzer.ts, mirror-engine.ts — find/replace getHistoricalPrice → getPriceAtTimestamp
```

---

## FIX 5 — Entry Percentile `UNAVAILABLE`
**File:** `lib/analyzer.ts`
**Root cause:** Percentile needs OHLCV candle data which doesn't exist for new tokens.

Add a fallback that derives percentile from surrounding trades:

```typescript
// lib/birdeye.ts — add this function

export async function getEntryPercentile(
  mint: string,
  entryTimestamp: number,
  entryPrice: number
): Promise<number | null> {
  // --- Attempt 1: OHLCV candle (most accurate) ---
  try {
    const ohlcv = await getOHLCV(mint, entryTimestamp - 900, entryTimestamp + 900, '15m');
    if (ohlcv.length > 0) {
      // Find the candle that contains the entry timestamp
      const candle = ohlcv.find(c =>
        c.unixTime <= entryTimestamp && c.unixTime + 900 >= entryTimestamp
      ) ?? ohlcv[0];

      const range = candle.h - candle.l;
      if (range > 0) {
        const pct = Math.round(((entryPrice - candle.l) / range) * 100);
        return Math.max(0, Math.min(100, pct));
      }
    }
  } catch { /* fall through */ }

  // --- Attempt 2: Derive from surrounding trades in a 30min window ---
  try {
    const windowStart = entryTimestamp - 900;
    const windowEnd   = entryTimestamp + 900;

    const res = await fetch(
      `${BASE}/defi/txs/token?address=${mint}&limit=100&tx_type=swap`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': BIRDEYE_KEY,
        },
      }
    );
    const data = await res.json();
    const prices: number[] = (data?.data?.items ?? [])
      .filter((t: any) => t.blockUnixTime >= windowStart && t.blockUnixTime <= windowEnd)
      .map((t: any) => t.price)
      .filter((p: any) => p && p > 0);

    if (prices.length < 3) return null;

    const low  = Math.min(...prices);
    const high = Math.max(...prices);
    if (high === low) return 50;

    const pct = Math.round(((entryPrice - low) / (high - low)) * 100);
    return Math.max(0, Math.min(100, pct));
  } catch { return null; }
}
```

Then in `lib/analyzer.ts`, where you compute `entryPercentile`:

```typescript
// Replace wherever you compute entryPercentile with:
const percentile = entryPrice
  ? await getEntryPercentile(entrySwap.tokenMint, entrySwap.timestamp, entryPrice)
  : null;

// In the returned TradeAnalysis object:
entryPercentile: percentile !== null
  ? `You bought in the ${percentile}th percentile of that window`
  : null,
```

In the UI, only show the percentile row if it's not null. If null, omit the row entirely rather than showing UNAVAILABLE.

---

## FIX 6 — Left on Table showing `+0.0 SOL`
**File:** `lib/analyzer.ts`
**Root cause:** Peak price is null (no OHLCV), so peakPnl calculates as 0.

Add a peak price fallback using the trades endpoint:

```typescript
// lib/birdeye.ts — add this function

export async function getPeakPriceAfterEntry(
  mint: string,
  entryTimestamp: number,
  exitTimestamp: number | null
): Promise<{ price: number; timestamp: number } | null> {
  // Don't look more than 24h ahead
  const windowEnd = exitTimestamp
    ? Math.min(exitTimestamp, entryTimestamp + 86400)
    : entryTimestamp + 86400;

  // --- Attempt 1: OHLCV ---
  try {
    const ohlcv = await getOHLCV(mint, entryTimestamp, windowEnd, '15m');
    if (ohlcv.length > 0) {
      const peak = ohlcv.reduce((best, c) => c.h > best.h ? c : best);
      return { price: peak.h, timestamp: peak.unixTime };
    }
  } catch { /* fall through */ }

  // --- Attempt 2: Scan individual trades in the window ---
  try {
    const res = await fetch(
      `${BASE}/defi/txs/token?address=${mint}&limit=200&tx_type=swap`,
      {
        headers: {
          'accept': 'application/json',
          'x-chain': 'solana',
          'X-API-KEY': BIRDEYE_KEY,
        },
      }
    );
    const data = await res.json();
    const trades: any[] = (data?.data?.items ?? [])
      .filter((t: any) =>
        t.blockUnixTime >= entryTimestamp &&
        t.blockUnixTime <= windowEnd &&
        t.price > 0
      );

    if (trades.length === 0) return null;

    const peak = trades.reduce((best, t) => t.price > best.price ? t : best);
    return { price: peak.price, timestamp: peak.blockUnixTime };
  } catch { return null; }
}
```

Then in `lib/analyzer.ts`, replace wherever you call `getOHLCV` for peak detection:

```typescript
// Replace the peak detection block with:
const peakData = await getPeakPriceAfterEntry(
  entrySwap.tokenMint,
  entrySwap.timestamp,
  exitSwap?.timestamp ?? null
);

const peakPriceAfterEntry = peakData?.price ?? null;
const peakTimestampAfterEntry = peakData?.timestamp ?? null;

// peakPnlSOL calculation only runs if both entryPrice and peakPriceAfterEntry exist:
const peakPnlSOL = entryPrice && peakPriceAfterEntry
  ? ((peakPriceAfterEntry / entryPrice) - 1) * solSpent
  : null;

const leftOnTable = peakPnlSOL !== null && realizedPnlSOL !== null
  ? peakPnlSOL - realizedPnlSOL
  : null;
```

---

## FIX 7 — Broken Solscan link
**File:** wherever you build the Solscan URL (UI component or API response)

```typescript
// lib/utils.ts — add this helper

export function buildSolscanTxLink(signature: string | null | undefined): string | null {
  if (!signature) return null;
  // Valid base58 Solana signature is 87-88 characters
  if (signature.length < 80 || signature.length > 90) return null;
  // Must only contain base58 characters
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(signature)) return null;
  return `https://solscan.io/tx/${signature}`;
}
```

In your trade card component (wherever you render the Solscan link):

```tsx
// Replace the hardcoded link with:
const solscanUrl = buildSolscanTxLink(trade.signature);

// In JSX:
{solscanUrl ? (
  <a href={solscanUrl} target="_blank" rel="noopener noreferrer">
    View on Solscan ↗
  </a>
) : (
  <span style={{ color: 'var(--muted)', cursor: 'not-allowed' }}>
    Solscan unavailable
  </span>
)}
```

Also verify your swap parser is pulling `tx.signature` at the top level, not from inside any event or instruction field:

```typescript
// In parsePumpSwap() and parseStandardSwap():
// signature must come from the root transaction object
signature: tx.signature,   // ✓ correct
// NOT from:
// tx.events?.swap?.signature  ✗
// tx.instructions[0].signature  ✗
```

---

## FIX 8 — Pattern Tax showing "0 minutes earlier" and "0.2 hours"
**File:** `lib/analyzer.ts`

Find your `computePatternTax` function. Guard every average calculation against null/missing winner data:

```typescript
export function computePatternTax(analyses: TradeAnalysis[]): PatternTax {
  // Only count the most common non-good diagnosis
  const mistakes = analyses
    .map(a => a.diagnosis)
    .filter(d => d !== 'GOOD_TRADE' && d !== 'UNKNOWN');

  const counts: Record<string, number> = {};
  mistakes.forEach(m => { counts[m] = (counts[m] ?? 0) + 1; });

  const mostCommonEntry = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0];

  const mostCommonMistake = mostCommonEntry?.[0] ?? 'UNKNOWN';
  const timesRepeated     = mostCommonEntry?.[1] ?? 0;

  const totalCostSOL = analyses
    .filter(a => a.diagnosis === mostCommonMistake && (a.realizedPnlSOL ?? 0) < 0)
    .reduce((sum, a) => sum + Math.abs(a.realizedPnlSOL ?? 0), 0);

  // --- Winner entry advantage: only compute if winner timestamp is valid ---
  const validWinnerComparisons = analyses.filter(a =>
    a.winnerEntryTimestamp &&
    a.winnerEntryTimestamp > 0 &&
    a.entryTimestamp > 0 &&
    a.entryTimestamp > a.winnerEntryTimestamp // winner was actually earlier
  );

  const avgWinnerEntryAdvantageMinutes = validWinnerComparisons.length > 0
    ? Math.round(
        validWinnerComparisons.reduce((sum, a) =>
          sum + (a.entryTimestamp - a.winnerEntryTimestamp!) / 60, 0
        ) / validWinnerComparisons.length
      )
    : null; // null = don't render this line

  // --- Hold times: only from trades where we have both timestamps ---
  const losses = analyses.filter(a =>
    (a.realizedPnlSOL ?? 0) < 0 &&
    a.exitTimestamp &&
    a.entryTimestamp &&
    a.exitTimestamp > a.entryTimestamp
  );

  const avgLossHoldTimeHours = losses.length > 0
    ? parseFloat(
        (losses.reduce((sum, a) =>
          sum + (a.exitTimestamp! - a.entryTimestamp) / 3600, 0
        ) / losses.length).toFixed(1)
      )
    : null;

  // --- Winner hold time: from winner data ---
  const validWinnerHolds = analyses.filter(a =>
    a.winnerHoldTimeMinutes && a.winnerHoldTimeMinutes > 0
  );

  const avgWinnerHoldTimeHours = validWinnerHolds.length > 0
    ? parseFloat(
        (validWinnerHolds.reduce((sum, a) =>
          sum + (a.winnerHoldTimeMinutes! / 60), 0
        ) / validWinnerHolds.length).toFixed(1)
      )
    : null;

  return {
    mostCommonMistake,
    timesRepeated,
    totalCostSOL: parseFloat(totalCostSOL.toFixed(2)),
    avgWinnerEntryAdvantageMinutes,  // null if no valid data
    avgLossHoldTimeHours,            // null if no valid data
    avgWinnerHoldTimeHours,          // null if no valid data
  };
}
```

Then update the pattern tax UI template to only render each sentence if its data is non-null:

```typescript
// Wherever you build the pattern tax string:

function buildPatternTaxText(tax: PatternTax): string {
  const lines: string[] = [];

  if (tax.timesRepeated > 0 && tax.totalCostSOL > 0) {
    lines.push(
      `You ${formatDiagnosis(tax.mostCommonMistake).toLowerCase()} ` +
      `${tax.timesRepeated} times this month. It cost you ${tax.totalCostSOL.toFixed(1)} SOL.`
    );
  }

  if (tax.avgWinnerEntryAdvantageMinutes !== null && tax.avgWinnerEntryAdvantageMinutes > 2) {
    lines.push(
      `Every time you took a loss, the winning wallet entered an average of ` +
      `${tax.avgWinnerEntryAdvantageMinutes} minutes earlier at a lower market cap.`
    );
  }

  if (tax.avgLossHoldTimeHours !== null && tax.avgWinnerHoldTimeHours !== null) {
    lines.push(
      `Your average hold time on losses is ${tax.avgLossHoldTimeHours}h. ` +
      `Winners on those same tokens exited in ${tax.avgWinnerHoldTimeHours}h on average.`
    );
  }

  return lines.join(' ');
}

function formatDiagnosis(d: string): string {
  const map: Record<string, string> = {
    BOUGHT_THE_TOP: 'bought the top',
    SOLD_THE_BOTTOM: 'sold the bottom',
    PAPER_HANDS: 'exited early',
    DIAMOND_HANDS_REKT: 'held through the dump',
  };
  return map[d] ?? d.toLowerCase().replace(/_/g, ' ');
}
```

---

## FIX 9 — "Top winner data unavailable" for low-volume tokens
**File:** `lib/mirror-engine.ts`

When Birdeye returns no top traders, fall back to Helius largest token accounts:

```typescript
// lib/mirror-engine.ts — update getMirrorData()

import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
);

export async function getWinnerDataWithFallback(
  mint: string,
  entryTimestamp?: number,
  userSolDeployed?: number
) {
  // --- Primary: Birdeye top traders ---
  const mirrorData = await getMirrorData(mint, entryTimestamp, userSolDeployed);

  if (mirrorData.winners.length > 0) {
    return { ...mirrorData, dataSource: 'traders' as const };
  }

  // --- Fallback: Helius largest token accounts (current holders) ---
  try {
    const mintPubkey = new PublicKey(mint);
    const largest = await connection.getTokenLargestAccounts(mintPubkey);

    const topHolders = largest.value.slice(0, 5).map((acc, i) => ({
      rank: i + 1,
      address: acc.address.toBase58(),
      amount: acc.uiAmount ?? 0,
      tag: null,
    }));

    return {
      ...mirrorData,
      winners: [],
      topHolders,
      dataSource: 'holders' as const,
      // Used by UI to show different message
    };
  } catch {
    return { ...mirrorData, dataSource: 'unavailable' as const };
  }
}
```

In the Payslip trade card UI, check `dataSource` and render accordingly:

```tsx
// In the "Top Winner" section of your trade card:

{trade.winnerData?.dataSource === 'traders' && (
  // Show full winner comparison as normal
  <WinnerComparison winner={trade.topWinner} />
)}

{trade.winnerData?.dataSource === 'holders' && (
  <div className="winner-fallback">
    <p>Trade history unavailable for this token.</p>
    <p>Showing top current holders instead.</p>
    <button onClick={() => goToMirror(trade.tokenMint)}>
      Run MIRROR for deeper analysis →
    </button>
  </div>
)}

{trade.winnerData?.dataSource === 'unavailable' && (
  <div className="winner-unavailable">
    <p>No winner data available for this token.</p>
    <button onClick={() => goToMirror(trade.tokenMint)}>
      Run MIRROR →
    </button>
  </div>
)}
```

---

## Types to update
**File:** `types/index.ts`

Add the missing fields that these fixes reference:

```typescript
// types/index.ts — add to TradeAnalysis interface:

export interface TradeAnalysis {
  // ... existing fields ...

  // Winner comparison fields
  winnerEntryTimestamp: number | null;    // FIX 8
  winnerHoldTimeMinutes: number | null;   // FIX 8

  // Data availability flags
  entryPriceSource: 'birdeye' | 'trades_fallback' | null;    // FIX 4
  peakPriceSource: 'ohlcv' | 'trades_fallback' | null;       // FIX 6
  entryPercentileSource: 'ohlcv' | 'trades_fallback' | null; // FIX 5
}

// Update PatternTax interface:
export interface PatternTax {
  mostCommonMistake: string;
  timesRepeated: number;
  totalCostSOL: number;
  avgWinnerEntryAdvantageMinutes: number | null;  // null = no valid data
  avgLossHoldTimeHours: number | null;            // null = no valid data
  avgWinnerHoldTimeHours: number | null;          // null = no valid data
}
```

---

## UI display rules for null data

Apply these rules globally in the Payslip UI to handle null gracefully:

```typescript
// lib/format.ts — add these display helpers

export function displayPrice(price: number | null): string {
  if (price === null) return '—';
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  return `$${price.toFixed(4)}`;
}

export function displaySOL(amount: number | null, suffix = ' SOL'): string {
  if (amount === null) return '—';
  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount.toFixed(2)}${suffix}`;
}

export function displayPercentile(pct: number | null): string {
  if (pct === null) return '—';
  return `${pct}th percentile`;
}

export function displayPeak(
  price: number | null,
  source: 'ohlcv' | 'trades_fallback' | null
): string {
  if (price === null) return '—';
  const label = displayPrice(price);
  // Optionally flag fallback data with a subtle indicator
  return source === 'trades_fallback' ? `${label} ~` : label;
}
```

In your trade card component, replace every `?? 'UNAVAILABLE'` with the appropriate helper. Never render the word UNAVAILABLE — if data is missing, show `—` (an em dash) which is the standard financial data convention for missing values.

---

## Fix execution order

```
1. Fix 1  — deduplication (stops 10x repeat)           → lib/helius.ts
2. Fix 3  — USD→SOL conversion                          → lib/mirror-engine.ts
3. Fix 7  — Solscan link validator                      → lib/utils.ts + UI
4. Fix 2  — token symbol resolution                     → lib/pumpfun.ts (new) + lib/birdeye.ts + api/analyze
5. Fix 4  — price fallback chain                        → lib/birdeye.ts
6. Fix 6  — peak price fallback                         → lib/birdeye.ts
7. Fix 5  — entry percentile fallback                   → lib/birdeye.ts
8. Fix 8  — pattern tax null guards                     → lib/analyzer.ts
9. Fix 9  — winner data fallback                        → lib/mirror-engine.ts
10. Types — update interfaces                           → types/index.ts
11. UI    — replace UNAVAILABLE with — using helpers    → components/PayslipCard.tsx
```

Test after Fix 1 and Fix 2 before proceeding. Those two are responsible for the most visible bugs.

---

*SLIP Payslip Fix Guide — 9 bugs, complete implementation*


# SLIP v2 Official Release
