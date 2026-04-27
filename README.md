# TradePostmortem

> *"You lost the trade. We show you exactly why, when, and how much it cost you."*

**TradePostmortem** is a Solana wallet trade analyzer

Paste any Solana wallet — we pull swap history via Helius, price each entry/exit with Birdeye, and output a ranked breakdown of your worst trades with specific, actionable diagnoses.

---

## Problem

Every Solana trader has stared at a trade they blew. Dexscreener shows the chart. Solscan shows the tx. **Nothing shows you the full autopsy** — the entry percentile, the peak you missed, and exactly how much SOL you left on the table. TradePostmortem does that in 10 seconds, on any wallet, no connection required.

---

## Data Flow

```
User enters wallet
      ↓
GET /api/analyze?wallet=ADDRESS
      ↓
Helius: last 100 SWAP transactions (parsed)
      ↓
Group by token mint: buys vs sells
      ↓
For each buy: Birdeye historical_price_unix (entry & exit timestamps)
      ↓  
getOHLCV: find peak after entry
      ↓
Analyzer: damage score, diagnosis, left-on-table calculation
      ↓
Results: sorted by damage score, shareable as PNG cards
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Swap History | Helius Parse Transaction History API |
| Price Data | Birdeye Historical Price + OHLCV |
| Hosting | Vercel |
| Share Cards | html-to-image (PNG export) |
| Language | TypeScript |

---

## Running Locally

```bash
git clone https://github.com/vellan-3/TradePostMortem.git
cd TradePostMortem
npm install

# Add your API keys
cp .env.local.example .env.local
# Edit .env.local with your HELIUS_API_KEY and BIRDEYE_API_KEY

npm run dev
# Open http://localhost:3000
```

---

## Diagnosis Types

| Code | Meaning |
|---|---|
| `BOUGHT_THE_TOP` | Entered within 15% of the local peak |
| `SOLD_THE_BOTTOM` | Sold near the local low; token recovered after |
| `PAPER_HANDS` | Sold a profitable trade before the real move |
| `DIAMOND_HANDS_REKT` | Held through peak, exited at a loss |
| `GOOD_TRADE` | Captured most of the available move |

---

## Live Demo

[tradepostmortem.vercel.app](https://tradepostmortem.vercel.app)

---

*Built for Colosseum Frontier Hackathon | Deadline May 11, 2026*
