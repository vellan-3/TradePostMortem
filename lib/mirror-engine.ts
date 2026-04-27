import { getHistoricalPrice, getCurrentPrice } from './birdeye';

const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY!;
const BASE = 'https://public-api.birdeye.so';

const HEADERS = {
  accept: 'application/json',
  'x-chain': 'solana',
  'X-API-KEY': BIRDEYE_KEY,
};

export interface WinnerWallet {
  address: string;
  tag: string | null;       // "Known KOL", "Smart Money", "Bot", null
  entryTimestamp: number;
  entryPrice: number;
  exitTimestamp: number | null;
  exitPrice: number | null;
  currentPrice: number | null;
  solDeployed: number;
  realizedPnlSOL: number | null;
  unrealizedPnlSOL: number | null;
  totalPnlSOL: number;
  roi: number;              // percentage
  holdTimeMinutes: number | null;
  tookPartialProfits: boolean;
  entryMarketCap: number | null;
}

export interface MirrorPatternInsights {
  avgEntryMarketCap: number | null;
  avgHoldTimeMinutes: number;
  mostUsedDex: string;
  mostTookPartials: boolean;
  avgEntryMinutesBeforePeak: number;
  avgSolDeployed: number;
}

export interface MirrorYourPosition {
  entryTimestamp: number;
  entryPrice: number;
  solDeployed: number;
  currentPnlSOL: number;
  currentPnlPct: number;
  vsTopWinnerGapSOL: number;
  entryTimingDiffMinutes: number; // negative = you were later
}

export interface MirrorResult {
  mint: string;
  symbol: string;
  winners: WinnerWallet[];
  topWinner: WinnerWallet | null;
  patternInsights: MirrorPatternInsights;
  yourPosition: MirrorYourPosition | null;
  totalWinners: number;
  totalLosers: number;
}

export async function getMirrorData(
  mint: string,
  userEntryTimestamp?: number,
  userSolDeployed?: number,
  userWalletAddress?: string
): Promise<MirrorResult> {
  // Fetch top traders from Birdeye
  const res = await fetch(
    `${BASE}/defi/v3/token/top-traders?address=${mint}&time_frame=24h&sort_by=realized_profit&sort_type=desc&limit=20`,
    { headers: HEADERS }
  );

  if (!res.ok) {
    throw new Error(`Birdeye top-traders API error: ${res.status}`);
  }

  const data = await res.json();
  const traders: any[] = data?.data?.items ?? [];

  const allWinners: WinnerWallet[] = traders
    .map((t: any) => {
      const realizedSOL = t.realizedProfit ?? 0;
      const unrealizedSOL = t.unrealizedProfit ?? 0;
      const totalPnl = realizedSOL + unrealizedSOL;
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
        totalPnlSOL: totalPnl,
        roi:
          t.buyPrice > 0
            ? (((t.sellPrice ?? t.buyPrice) - t.buyPrice) / t.buyPrice) * 100
            : 0,
        holdTimeMinutes:
          t.firstTradeTime && t.lastSellTime
            ? Math.round((t.lastSellTime - t.firstTradeTime) / 60)
            : null,
        tookPartialProfits: (t.tradeCount ?? 0) > 2,
        entryMarketCap: t.entryMarketCap ?? null,
      };
    });

  const winners = allWinners
    .filter(w => w.totalPnlSOL > 0)
    .sort((a, b) => b.totalPnlSOL - a.totalPnlSOL);

  const losers = allWinners.filter(w => w.totalPnlSOL <= 0);

  const topWinner = winners[0] ?? null;

  // ── Pattern analysis across top 10 ──
  const top10 = winners.slice(0, 10);

  const withHoldTime = top10.filter(w => w.holdTimeMinutes !== null);
  const avgHoldTime =
    withHoldTime.length > 0
      ? withHoldTime.reduce((s, w) => s + (w.holdTimeMinutes ?? 0), 0) / withHoldTime.length
      : 0;

  const withMcap = top10.filter(w => w.entryMarketCap !== null);
  const avgEntryMcap =
    withMcap.length > 0
      ? withMcap.reduce((s, w) => s + (w.entryMarketCap ?? 0), 0) / withMcap.length
      : null;

  const avgSolDeployed =
    top10.length > 0
      ? top10.reduce((s, w) => s + w.solDeployed, 0) / top10.length
      : 0;

  const partialCount = top10.filter(w => w.tookPartialProfits).length;

  const patternInsights: MirrorPatternInsights = {
    avgEntryMarketCap: avgEntryMcap,
    avgHoldTimeMinutes: Math.round(avgHoldTime),
    mostUsedDex: 'Raydium', // extend with per-trade dex data from Birdeye
    mostTookPartials: partialCount > top10.length / 2,
    avgEntryMinutesBeforePeak: 0, // extend with OHLCV peak detection
    avgSolDeployed: Math.round(avgSolDeployed * 10) / 10,
  };

  // ── Your position gap analysis ──
  let yourPosition: MirrorYourPosition | null = null;

  if (userEntryTimestamp && userSolDeployed && userSolDeployed > 0) {
    const [currentPrice, entryPrice] = await Promise.all([
      getCurrentPrice(mint),
      getHistoricalPrice(mint, userEntryTimestamp),
    ]);

    const currentPnlSOL =
      entryPrice && currentPrice && userSolDeployed
        ? (currentPrice / entryPrice - 1) * userSolDeployed
        : 0;

    const currentPnlPct =
      entryPrice && currentPrice
        ? ((currentPrice - entryPrice) / entryPrice) * 100
        : 0;

    yourPosition = {
      entryTimestamp: userEntryTimestamp,
      entryPrice: entryPrice ?? 0,
      solDeployed: userSolDeployed,
      currentPnlSOL: Math.round(currentPnlSOL * 100) / 100,
      currentPnlPct: Math.round(currentPnlPct * 10) / 10,
      vsTopWinnerGapSOL: topWinner
        ? Math.round((topWinner.totalPnlSOL - currentPnlSOL) * 100) / 100
        : 0,
      entryTimingDiffMinutes: topWinner
        ? Math.round((userEntryTimestamp - topWinner.entryTimestamp) / 60)
        : 0,
    };
  }

  return {
    mint,
    symbol: data?.data?.symbol ?? 'UNKNOWN',
    winners: winners.slice(0, 20),
    topWinner,
    patternInsights,
    yourPosition,
    totalWinners: winners.length,
    totalLosers: losers.length,
  };
}
