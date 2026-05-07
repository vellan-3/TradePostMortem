# SLIP — Full API & Technical Requirements Research
### What each feature actually needs, what APIs can deliver, and where AI fills the gaps

---

## THE CORE PROBLEM YOU'VE HIT

You have three distinct data gaps across all three features:

1. **Data that exists but needs the right API or parsing approach** (pump.fun swaps in Payslip, buy/sell ratio in Verdict)
2. **Data that is partially available but returned as estimates** (deployer history, smart money labels, entry market cap in Mirror)
3. **Data that no API provides** — this is where AI (Claude API) becomes the architecture, not a feature

The rule for SLIP: **APIs fetch raw onchain facts. AI interprets them into meaning.**

---

## FEATURE 1: VERDICT

### What you showed is "Unavailable" or "Estimated" and why

| Field | Problem | Fix |
|---|---|---|
| Top 10 holder concentration showing 129% | RugCheck counts LP pool accounts as holders. LP tokens inflate the percentage past 100% | Filter out known LP program accounts before summing |
| Deployer history — Unavailable | RugCheck's `/tokens/{mint}/report` returns `creator` field but their deployer win/loss endpoint is not publicly exposed | Use Helius `getTransactionsForAddress` on the creator wallet instead — count how many unique mints they've deployed and cross-ref with RugCheck token reports |
| Dev wallet activity — Estimated | RugCheck doesn't label exchange flows. It just returns the creator address | Use Helius `getBatchIdentity` to check if creator's recent transfer destinations are known exchange hot wallets (Binance, Coinbase, Kraken deposit addresses are labeled) |
| Buy/sell ratio — Estimated | You're estimating from OHLCV which doesn't give trade direction counts | Use Birdeye `/defi/txs/token` endpoint — it returns individual trades with `side: "buy"/"sell"` and a timestamp. Count buys vs sells in last 15m/1h/6h directly |
| Vol/Liquidity — Unavailable | You're missing one of these | Birdeye `/defi/v3/token/market-data` returns `liquidity` and `v24hUSD` (volume). Divide them |
| Smart money — Estimated | No free API tags wallets as "smart money" | This is an AI job. See Section 4 |
| Entry timing percentile | No direct API | Build from Birdeye OHLCV — find the candle containing the entry timestamp, compute where entry price sits between candle low and high |

### API Stack for Verdict (confirmed working)

```
RugCheck API — https://api.rugcheck.xyz/swagger/index.html
  GET /tokens/{mint}/report
  Returns: mintAuthority, freezeAuthority, lpLocked, transferHook,
           topHolders[], risks[], creator, symbol, score

Birdeye API
  GET /defi/v3/token/market-data?address={mint}
  Returns: liquidity, volume24h, priceChange24h, uniqueWallets24h

  GET /defi/txs/token?address={mint}&limit=200&tx_type=swap
  Returns: individual trades with side (buy/sell), amount, timestamp
  → Use this to compute real buy/sell ratio for 15m, 1h, 6h

  GET /defi/v3/ohlcv?address={mint}&type=15m&...
  Returns: OHLCV candles for timing position and entry percentile

Helius API
  POST /v0/addresses/{creator}/transactions
  Returns: all transactions from creator wallet
  → Parse to find unique token mints they've deployed

  POST /getBatchIdentity
  Body: { addresses: [array of destination addresses from creator txs] }
  Returns: known labels (exchange names, protocol names)
  → Use this to detect if dev is sending to Binance/Coinbase deposit wallets

Solana Web3.js (via Helius RPC)
  getAccountInfo(mint) → parsed mint data: mintAuthority, freezeAuthority, decimals
  → Always fetch this directly from chain, don't rely on RugCheck for these
```

### The LP Holder Concentration Fix

```typescript
// RugCheck returns ALL holders including LP pool accounts
// These are known Solana LP program addresses to filter out
const LP_PROGRAM_ADDRESSES = new Set([
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium AMM
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', // Raydium CLMM
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3sFjNo8',  // Orca Whirlpool
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',  // Meteora DLMM
  'pump.fun bonding curve program',
];

function getCleanHolderConcentration(holders: any[]): number {
  const filtered = holders.filter(h => !LP_PROGRAM_ADDRESSES.has(h.owner));
  const top10 = filtered.slice(0, 10);
  const totalPct = top10.reduce((sum, h) => sum + h.percentage, 0);
  return totalPct; // now will never exceed 100%
}
```

---

## FEATURE 2: MIRROR

### What you showed is "Estimated" and why

| Field | Problem | Fix |
|---|---|---|
| Entry market cap | Birdeye top_traders doesn't return the mcap at the time of entry | Fetch the historical price at `firstTradeTime` from Birdeye `historical_price_unix`, multiply by total supply from token metadata |
| ROI showing 0% | Birdeye top_traders `buyPrice` and `sellPrice` fields are sometimes null for short holds | Fall back: compute ROI from `realizedProfit / volume * 100` |
| "via Raydium / via Jupiter" labels | Birdeye top_traders doesn't return which DEX was used | Fetch the actual tx signature from Helius and check which program accounts are in the instruction. Raydium AMM vs Jupiter program IDs are known constants |
| Avg size deployed 16397 SOL | Birdeye returns `volume` in USD not SOL | Divide USD volume by SOL price at time of trade to get SOL equivalent |
| Your wallet comparison | You need the user's entry data to compare | Require the user to input their entry time and SOL amount. Cross-reference your own Payslip data if wallet is already analyzed |

### Real Birdeye top_traders response structure

```typescript
// Actual response from GET /defi/v2/tokens/top_traders?address={mint}&time_frame=24h
{
  address: "7xKX...",
  tags: [],               // often empty — no free smart money labels
  volume: 24500,          // USD volume, NOT SOL
  tradeCount: 12,
  buyCount: 4,
  sellCount: 8,
  buyVolume: 18000,       // USD
  sellVolume: 6500,       // USD
  realizedProfit: 11200,  // USD
  unrealizedProfit: 0,
  firstTradeTime: 1745832000,
  lastTradeTime: 1745843600,
  // NO: buyPrice, sellPrice, entryMarketCap, dexUsed
}

// What this means for you:
// - ROI must be computed from realizedProfit / buyVolume
// - Entry mcap requires a second call: historical_price * supply
// - DEX used requires fetching the actual tx from Helius
// - Smart money tags are EMPTY — you need AI for this
```

### The DEX Detection Fix

```typescript
const DEX_PROGRAMS: Record<string, string> = {
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM',
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'Raydium CLMM',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3sFjNo8': 'Orca',
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo': 'Meteora',
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P': 'Pump.fun',
  'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA': 'PumpSwap AMM',
};

async function getDexUsed(signature: string): Promise<string> {
  const tx = await helius.enhanced.getTransaction(signature);
  const accountKeys = tx?.accountData?.map(a => a.account) ?? [];
  for (const addr of accountKeys) {
    if (DEX_PROGRAMS[addr]) return DEX_PROGRAMS[addr];
  }
  return 'Unknown';
}
```

---

## FEATURE 3: PAYSLIP — THE PUMP.FUN PROBLEM

This is your most critical bug. Here is exactly why it fails and how to fix it.

### Why "No swap transactions found" for pump.fun wallets

Helius Enhanced Transactions API uses `type: 'SWAP'` filter to find swaps. Pump.fun bonding curve transactions are **NOT classified as type SWAP** — they come through as type `UNKNOWN` or `COMPRESSED_NFT_MINT` or simply unclassified. The `events.swap` field is also null for pump.fun trades.

This is a known issue. The solution is to **not filter by type** and instead parse the raw transaction log messages.

### The Fix: Pump.fun Transaction Parser

```typescript
// lib/helius.ts — replace getWalletSwaps with this

const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const PUMPSWAP_PROGRAM = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

export async function getWalletSwaps(wallet: string): Promise<ParsedSwap[]> {
  // Step 1: Fetch ALL transactions — no type filter
  const txs = await helius.enhanced.getTransactionsByAddress({
    address: wallet,
    limit: 100,
    // Remove: type: 'SWAP'
  });

  const swaps: ParsedSwap[] = [];

  for (const tx of txs) {
    // Route A: Standard swap with events.swap (Jupiter, Raydium)
    if (tx.events?.swap) {
      const parsed = parseStandardSwap(tx);
      if (parsed) swaps.push(parsed);
      continue;
    }

    // Route B: Pump.fun bonding curve trade
    const isPump = tx.instructions?.some(ix =>
      ix.programId === PUMP_PROGRAM || ix.programId === PUMPSWAP_PROGRAM
    );

    if (isPump) {
      const parsed = parsePumpSwap(tx, wallet);
      if (parsed) swaps.push(parsed);
      continue;
    }
  }

  return swaps.sort((a, b) => b.timestamp - a.timestamp);
}

function parsePumpSwap(tx: any, wallet: string): ParsedSwap | null {
  try {
    // Pump.fun trades: parse from tokenTransfers and nativeTransfers
    const tokenTransfers = tx.tokenTransfers ?? [];
    const nativeTransfers = tx.nativeTransfers ?? [];

    // Find the token involved (not SOL, not wrapped SOL)
    const tokenTransfer = tokenTransfers.find((t: any) =>
      t.mint !== 'So11111111111111111111111111111111111111112'
    );

    if (!tokenTransfer) return null;

    // Find SOL flow for this wallet
    const solIn = nativeTransfers
      .filter((t: any) => t.toUserAccount === wallet)
      .reduce((sum: number, t: any) => sum + t.amount, 0) / 1e9;

    const solOut = nativeTransfers
      .filter((t: any) => t.fromUserAccount === wallet)
      .reduce((sum: number, t: any) => sum + t.amount, 0) / 1e9;

    // Determine buy vs sell
    const isBuy = solOut > solIn; // sent SOL, received token

    // Token amounts
    const tokenAmount = parseFloat(tokenTransfer.tokenAmount ?? '0');

    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      tokenMint: tokenTransfer.mint,
      tokenSymbol: tokenTransfer.symbol ?? tokenTransfer.mint.slice(0, 6),
      tokenIn: isBuy ? solOut : tokenAmount,
      tokenOut: isBuy ? tokenAmount : solIn,
      isBuy,
      source: tx.instructions?.some((ix: any) => ix.programId === PUMPSWAP_PROGRAM)
        ? 'PUMP_SWAP'
        : 'PUMP_FUN',
    };
  } catch {
    return null;
  }
}

function parseStandardSwap(tx: any): ParsedSwap | null {
  const swap = tx.events?.swap;
  if (!swap) return null;

  const nativeInput  = swap.nativeInput;
  const nativeOutput = swap.nativeOutput;
  const tokenInputs  = swap.tokenInputs  ?? [];
  const tokenOutputs = swap.tokenOutputs ?? [];

  // Buying a token: SOL in → token out
  if (nativeInput && tokenOutputs.length > 0) {
    const out = tokenOutputs[0];
    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      tokenMint: out.mint,
      tokenSymbol: out.symbol ?? out.mint.slice(0, 6),
      tokenIn: nativeInput.amount / 1e9,
      tokenOut: parseFloat(out.rawTokenAmount?.tokenAmount ?? '0'),
      isBuy: true,
      source: tx.source ?? 'UNKNOWN',
    };
  }

  // Selling a token: token in → SOL out
  if (nativeOutput && tokenInputs.length > 0) {
    const inp = tokenInputs[0];
    return {
      signature: tx.signature,
      timestamp: tx.timestamp,
      tokenMint: inp.mint,
      tokenSymbol: inp.symbol ?? inp.mint.slice(0, 6),
      tokenIn: parseFloat(inp.rawTokenAmount?.tokenAmount ?? '0'),
      tokenOut: nativeOutput.amount / 1e9,
      isBuy: false,
      source: tx.source ?? 'UNKNOWN',
    };
  }

  return null;
}
```

### Historical Price for Pump.fun Tokens

Many pump.fun tokens are not in Birdeye's historical price database because they were too short-lived or too small. When `historical_price_unix` returns null for a pump.fun token, fall back to this:

```typescript
// Fallback: use Birdeye's /defi/txs/token to find the closest trade
// to the target timestamp and use that trade's price as the price point

async function getHistoricalPriceFallback(
  mint: string,
  targetTimestamp: number
): Promise<number | null> {
  try {
    const res = await fetch(
      `${BASE}/defi/txs/token?address=${mint}&limit=50&tx_type=swap`,
      { headers: { 'X-API-KEY': BIRDEYE_KEY, 'x-chain': 'solana' } }
    );
    const data = await res.json();
    const trades = data?.data?.items ?? [];

    // Find the trade closest in time to targetTimestamp
    const closest = trades.reduce((best: any, trade: any) => {
      const diff = Math.abs(trade.blockUnixTime - targetTimestamp);
      const bestDiff = Math.abs((best?.blockUnixTime ?? Infinity) - targetTimestamp);
      return diff < bestDiff ? trade : best;
    }, null);

    if (!closest) return null;

    // Price = quote amount / base amount
    return closest.price ?? null;
  } catch {
    return null;
  }
}
```

---

## WHERE AI (CLAUDE API) REPLACES MISSING DATA

These are the things no API provides. This is where integrating the Claude API into your backend turns SLIP from a data dashboard into an intelligent product.

### What AI covers that APIs cannot:

| Gap | API Limitation | What Claude generates |
|---|---|---|
| Smart money wallet classification | Birdeye tags are empty. No free API labels wallets as "smart money" | Given wallet's trade history, profit rate, hold patterns → classify as Smart Money / Bot / Retail / KOL |
| Diagnosis text | APIs give you numbers, not interpretation | "You entered in the 91st percentile of the candle. The winner entered 2h 32m before you..." |
| Pattern tax narrative | APIs give counts, not the story | "You're not picking bad tokens. You're entering them after the money has already been made." |
| Winner gap explanation | APIs give raw diff, not causality | "Same token, same size, completely different outcome. Here's why." |
| Verdict summary text | Risk flags are boolean, not readable | The plain-English summary that tells a non-technical degen what to do |
| Trading grade commentary | Grade is a number without context | "Your entry discipline is your biggest leak. Fix this before worrying about which tokens to buy." |

### How to integrate Claude API into SLIP

This is a server-side call — **never expose your Anthropic API key client-side.**

```typescript
// lib/ai-narrator.ts

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY!;

interface NarratorInput {
  type: 'diagnosis' | 'verdict_summary' | 'winner_gap' | 'pattern_tax' | 'wallet_classification';
  data: Record<string, any>;
}

export async function generateNarration(input: NarratorInput): Promise<string> {
  const prompts: Record<string, string> = {

    diagnosis: `You are SLIP, a blunt onchain trade analysis tool with dark humor. 
A trader made this trade on Solana:
- Token: ${input.data.symbol}
- Entry price: ${input.data.entryPrice}
- Entry percentile of candle: ${input.data.entryPct}th (higher = worse)
- Peak price after entry: ${input.data.peakPrice}
- Exit price: ${input.data.exitPrice}
- P&L: ${input.data.pnl} SOL
- Diagnosis type: ${input.data.diagnosis}
- Left on table vs optimal exit: ${input.data.leftOnTable} SOL

Write 2 sentences max. Be direct, a little brutal, CT-native. No emojis. No em dashes.
Tell them exactly what went wrong and what it cost. Do not be encouraging.`,

    verdict_summary: `You are SLIP's VERDICT system. Write a 1-sentence plain-English summary 
for a trader deciding whether to buy this token right now.
Risk score: ${input.data.score}/100
Verdict: ${input.data.verdict}
Critical issues: ${input.data.criticalIssues.join(', ') || 'none'}
Warnings: ${input.data.warnings.join(', ') || 'none'}
Keep it under 25 words. Direct. No hedging. Tell them what to do with their money.`,

    winner_gap: `You are SLIP. Write 3 sentences explaining why the winning wallet beat this trader.
Same token: ${input.data.symbol}
Winner entry: $${input.data.winnerEntryMcap}k mcap, ${input.data.winnerEntryMinsEarlier} mins before the trader
Winner P&L: +${input.data.winnerPnl} SOL
Trader entry: $${input.data.traderEntryMcap}k mcap
Trader P&L: ${input.data.traderPnl} SOL
Winner used: ${input.data.winnerDex}
Trader used: ${input.data.traderDex}
Be specific. CT-native tone. No em dashes. No emojis.`,

    pattern_tax: `You are SLIP. The trader's most repeated mistake is: ${input.data.mistake}
They've done it ${input.data.times} times this month. Total cost: ${input.data.costSOL} SOL.
Write 2-3 sentences diagnosing the behavioral pattern behind the mistake. 
Don't just describe what happened. Explain WHY they keep doing it and what it actually costs their edge.
Dark humor allowed. Direct. CT-native. No em dashes.`,

    wallet_classification: `You are classifying a Solana trading wallet for SLIP's MIRROR feature.
Wallet stats over last 30 days:
- Total trades: ${input.data.totalTrades}
- Win rate: ${input.data.winRate}%
- Avg hold time: ${input.data.avgHoldMins} minutes
- Avg entry mcap: $${input.data.avgEntryMcap}k
- Took partials: ${input.data.tookPartials}% of wins
- Trade frequency: ${input.data.tradesPerDay} per day
- Total P&L: ${input.data.totalPnl} SOL

Classify this wallet as ONE of: Smart Money / Sniper Bot / Experienced Degen / Retail / KOL Follower
Then write one sentence explaining why. Format: "CLASSIFICATION: [type]. [reason]"`,
  };

  const prompt = prompts[input.type];
  if (!prompt) return '';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  return data.content?.[0]?.text?.trim() ?? '';
}
```

### When to call the AI narrator (server-side only)

```typescript
// In /api/analyze/route.ts — after you have all raw data:

// 1. After computing TradeAnalysis for each trade:
trade.diagnosisText = await generateNarration({
  type: 'diagnosis',
  data: { symbol, entryPrice, entryPct, peakPrice, exitPrice, pnl, diagnosis, leftOnTable }
});

// 2. After computing VerdictResult:
verdict.summary = await generateNarration({
  type: 'verdict_summary',
  data: { score, verdict, criticalIssues, warnings }
});

// 3. After building MirrorResult for each winner:
winner.classification = await generateNarration({
  type: 'wallet_classification',
  data: { totalTrades, winRate, avgHoldMins, avgEntryMcap, tookPartials, tradesPerDay, totalPnl }
});

// 4. In the payslip winner gap section:
gapCard.explanation = await generateNarration({
  type: 'winner_gap',
  data: { symbol, winnerEntryMcap, winnerEntryMinsEarlier, winnerPnl, traderEntryMcap, traderPnl, winnerDex, traderDex }
});

// 5. After computing PatternTax:
patternTax.narrative = await generateNarration({
  type: 'pattern_tax',
  data: { mistake, times, costSOL }
});
```

### Caching AI responses (important for cost)

The AI responses cost money per call. Cache aggressively:

```typescript
// Simple in-memory cache — for production use Redis or Upstash
const narratorCache = new Map<string, string>();

export async function generateNarrationCached(
  input: NarratorInput,
  cacheKey: string
): Promise<string> {
  if (narratorCache.has(cacheKey)) return narratorCache.get(cacheKey)!;
  const result = await generateNarration(input);
  narratorCache.set(cacheKey, result);
  return result;
}

// Cache key pattern:
// For trade: `diagnosis_${signature}` — unique per tx, never changes
// For verdict: `verdict_${mint}_${Math.floor(Date.now() / (1000 * 60 * 15))}` — refreshes every 15min
// For winner gap: `gap_${signature}_${winnerAddress}` — stable per pair
```

---

## FULL API + ENV SETUP

### New environment variables needed

```bash
# .env.local — complete list

# Existing
HELIUS_API_KEY=your_helius_key
BIRDEYE_API_KEY=your_birdeye_key

# Add these
RUGCHECK_API_KEY=your_rugcheck_key    # get at rugcheck.xyz dashboard
ANTHROPIC_API_KEY=your_claude_key     # get at console.anthropic.com
```

### API tiers you actually need

| API | Endpoint needed | Minimum tier |
|---|---|---|
| Helius | Enhanced tx history, getAccountInfo, getBatchIdentity | Free (100k credits/mo) |
| Birdeye | Token market data, top traders, txs/token, historical price, OHLCV | **Starter ($0-$99/mo)** — top traders requires Starter+ |
| RugCheck | Token report (mint auth, LP lock, holders, risks) | **Free** — no auth needed for basic report |
| Anthropic | claude-sonnet-4-6 for narration | Pay-per-use (~$0.003 per call) |

### Birdeye endpoints you need (confirmed available)

```
GET /defi/v3/token/market-data          → liquidity, volume, priceChange
GET /defi/txs/token                     → individual trades with side (buy/sell)
GET /defi/historical_price_unix         → price at specific timestamp
GET /defi/v3/ohlcv                      → candle data for timing analysis
GET /defi/v2/tokens/top_traders         → winner leaderboard (Starter tier)
GET /defi/v3/token/holder               → holder list (for concentration calc)
```

### RugCheck endpoints you need (no key required for basic)

```
GET https://api.rugcheck.xyz/tokens/{mint}/report
Returns: score, risks[], topHolders[], markets[], creator, mintAuthority,
         freezeAuthority, token (symbol, name, decimals)
```

---

## SUMMARY: WHAT EACH FEATURE NOW USES

### VERDICT
- **RugCheck** → mint auth, freeze auth, LP lock, transfer hook, top holders raw, creator address, risk flags
- **Birdeye** `/defi/txs/token` → real buy/sell ratio (not estimated)
- **Birdeye** `/defi/v3/token/market-data` → vol/liquidity ratio (not unavailable)
- **Birdeye** `/defi/v3/ohlcv` → entry timing position, 6h price move
- **Helius** `getTransactionsForAddress(creator)` → deployer history from chain directly
- **Helius** `getBatchIdentity` → detect exchange wallet destinations (dev selling to exchange?)
- **Claude API** → plain-English verdict summary (replaces hardcoded template strings)

### MIRROR
- **Birdeye** `/defi/v2/tokens/top_traders` → winner list with P&L, trade counts, timestamps
- **Birdeye** `historical_price_unix` → entry price reconstruction → entry mcap
- **Helius** `getTransaction(signature)` → detect which DEX each winner used
- **Claude API** → wallet classification (Smart Money / Bot / Retail / KOL)

### PAYSLIP
- **Helius** `getTransactionsByAddress` (NO type filter) → all transactions including pump.fun
- Custom pump.fun parser (see Section 3) → classify buy/sell from tokenTransfers + nativeTransfers
- **Birdeye** `historical_price_unix` → entry/exit price for each trade
- **Birdeye** `/defi/txs/token` → fallback price for very small tokens not in Birdeye index
- **Birdeye** `/defi/v2/tokens/top_traders` → who won the most on each token you traded
- **Claude API** → diagnosis text, pattern tax narrative, winner gap explanation, trading grade commentary

---

## COST ESTIMATE (PER USER ANALYSIS)

For one full SLIP analysis (all three features):

| API call | Approx cost |
|---|---|
| Helius (100 txs fetch + 5 identity lookups) | ~106 credits (~$0.001) |
| Birdeye (market data + top traders + price history + txs) | ~12 calls → Starter plan flat fee |
| RugCheck (token report) | Free |
| Claude API (5-8 narration calls × ~150 tokens each) | ~0.003 × 7 = ~$0.021 |

**Total per full analysis: ~$0.02–$0.04**
At 1,000 analyses/month: ~$20-40 in AI costs. Helius and Birdeye are flat-fee at the tiers you need.

---

*Research complete — SLIP technical requirements v2*
*APIs confirmed: Helius · Birdeye · RugCheck · Anthropic Claude*


# SLIP v2 Official Release
