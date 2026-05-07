# SLIP — Onchain Trade Intelligence
> *"Don't get in wrong. Know who's winning while you're in. Know what it cost you after."*

SLIP is a Solana trade intelligence suite. Paste any wallet to get a full autopsy of your trading history, see who won on every token you traded, and scan any token before you enter.

## Features

### VERDICT — Before the trade
Full token safety and market structure scan. Mint authority, LP lock, transfer hooks, deployer history, holder concentration, timing position. One score. One verdict.

### MIRROR — During the trade
Every wallet winning on your token right now, ranked by SOL gained. Entry timing gap, size gap, DEX used. The exact pattern winners share.

### PAYSLIP — After the trade
Full trade autopsy. Entry percentile, peak missed, SOL left on table. Who won the most on each token. Recurring mistake quantified. Trading grade, broken down.

## Birdeye API Integration

| Endpoint | Used for |
|---|---|
| `/defi/historical_price_unix` | Entry and exit price for every trade |
| `/defi/v3/ohlcv` | Peak price after entry — "left on table" calculation |
| `/defi/v2/tokens/top_traders` | Winner leaderboard per token (MIRROR) |
| `/defi/v3/token/market-data` | Liquidity and volume for VERDICT |
| `/defi/txs/token` | Real buy/sell ratio for VERDICT |
| `/defi/v3/token/meta-data/multiple` | Token symbol resolution |

A single Payslip analysis makes ~12–15 Birdeye API calls.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Swap History | Helius Enhanced Transaction API |
| Price Data | Birdeye Historical Price + OHLCV + Top Traders |
| Token Safety | RugCheck API |
| Hosting | Vercel |
| Language | TypeScript |

## Running Locally

```bash
git clone https://github.com/vellan-3/slip.git
cd slip
npm install
cp .env.local.example .env.local
# Add HELIUS_API_KEY, BIRDEYE_API_KEY, ANTHROPIC_API_KEY
npm run dev
```

Live Demo
https://slip-official-v2.vercel.app

Built for Colosseum Frontier Hackathon · Birdeye BIP Competition Sprint 2 · May 2026


# SLIP v2 Official Release

// SLIP v2 Official Release
