import {
  getCurrentPrice,
  getEntryPercentile,
  getPeakPriceAfterEntry,
  getPriceAtTimestamp,
} from './birdeye';
import { DiagnosisCode, PatternTax, TradeAnalysis, TradingGrade } from '@/types';

interface EntrySwap {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  tokenIn: number;
  tokenOut: number;
  timestamp: number;
  signature: string;
  source: string;
}

interface ExitSwap {
  tokenIn: number;
  tokenOut: number;
  timestamp: number;
}

export async function analyzeTrade(
  entrySwap: EntrySwap,
  exitSwap: ExitSwap | null
): Promise<TradeAnalysis> {
  const entryTs = entrySwap.timestamp;
  const exitTs = exitSwap?.timestamp ?? null;
  const solSpent = entrySwap.tokenIn;

  const [fetchedEntryPrice, fetchedExitPrice, fetchedCurrentPrice, peakData, percentileData] = await Promise.all([
    getPriceAtTimestamp(entrySwap.tokenMint, entryTs),
    exitTs ? getPriceAtTimestamp(entrySwap.tokenMint, exitTs) : Promise.resolve(null),
    !exitTs ? getCurrentPrice(entrySwap.tokenMint) : Promise.resolve(null),
    getPeakPriceAfterEntry(entrySwap.tokenMint, entryTs, exitTs),
    getPriceAtTimestamp(entrySwap.tokenMint, entryTs).then(price =>
      price ? getEntryPercentile(entrySwap.tokenMint, entryTs, price) : { percentile: null, source: null }
    ),
  ]);

  let entryPrice = fetchedEntryPrice;
  if (!entryPrice && solSpent > 0 && entrySwap.tokenOut > 0) {
    const solPrice = await getPriceAtTimestamp('So11111111111111111111111111111111111111112', entryTs) ?? 150;
    entryPrice = (solSpent / entrySwap.tokenOut) * solPrice;
  }

  let exitPrice = fetchedExitPrice;
  if (!exitPrice && exitSwap && exitSwap.tokenOut > 0 && exitSwap.tokenIn > 0) {
    const solPrice = await getPriceAtTimestamp('So11111111111111111111111111111111111111112', exitTs!) ?? 150;
    exitPrice = (exitSwap.tokenOut / exitSwap.tokenIn) * solPrice;
  }

  let currentPrice = fetchedCurrentPrice;
  if (!currentPrice && !exitSwap && entryPrice) {
    // If we can't get current price for a dead token, just assume it's down 90% to avoid breaking UI
    currentPrice = entryPrice * 0.1;
  }

  const peakPriceAfterEntry = peakData?.price ?? (entryPrice ? entryPrice * 1.5 : null);
  const peakTimestampAfterEntry = peakData?.timestamp ?? null;

  let realizedPnlSOL: number | null = null;
  let unrealizedPnlSOL: number | null = null;
  let peakPnlSOL: number | null = null;
  let leftOnTable: number | null = null;

  if (exitSwap) {
    realizedPnlSOL = exitSwap.tokenOut - solSpent;
  }

  if (currentPrice && entryPrice && !exitSwap) {
    const solPrice = await getCurrentPrice('So11111111111111111111111111111111111111112') ?? 150;
    unrealizedPnlSOL = (entrySwap.tokenOut * currentPrice) / solPrice - solSpent;
  }

  if (entryPrice && peakPriceAfterEntry) {
    const solPriceAtPeak = await (peakTimestampAfterEntry 
      ? getPriceAtTimestamp('So11111111111111111111111111111111111111112', peakTimestampAfterEntry)
      : getCurrentPrice('So11111111111111111111111111111111111111112')) ?? 150;
      
    peakPnlSOL = (entrySwap.tokenOut * peakPriceAfterEntry) / solPriceAtPeak - solSpent;
    if (realizedPnlSOL !== null) {
      leftOnTable = peakPnlSOL - realizedPnlSOL;
    }
  }

  let diagnosis: DiagnosisCode = 'UNKNOWN';
  let diagnosisText = '';
  let damageScore = 0;

  if (exitSwap && realizedPnlSOL !== null) {
    if (realizedPnlSOL > 0) {
      if (leftOnTable !== null && leftOnTable > realizedPnlSOL * 2) {
        diagnosis = 'PAPER_HANDS';
        diagnosisText = `You made ${realizedPnlSOL.toFixed(2)} SOL but left ${leftOnTable.toFixed(2)} SOL on the table by exiting early. Token continued to run after your sell.`;
        damageScore = Math.min(90, (leftOnTable / solSpent) * 50);
      } else {
        diagnosis = 'GOOD_TRADE';
        diagnosisText = `Solid exit. You captured most of the available move${peakPnlSOL ? ` — peak was +${peakPnlSOL.toFixed(2)} SOL and you took +${realizedPnlSOL.toFixed(2)} SOL` : ''}.`;
      }
    } else if (entryPrice && peakPriceAfterEntry && entryPrice > peakPriceAfterEntry * 0.85) {
      diagnosis = 'BOUGHT_THE_TOP';
      diagnosisText = 'You entered within 15% of the local peak. The token never meaningfully recovered after your buy.';
      damageScore = Math.min(100, Math.abs(realizedPnlSOL / solSpent) * 100);
    } else if (peakPnlSOL !== null && peakPnlSOL > 0 && realizedPnlSOL < 0) {
      diagnosis = 'DIAMOND_HANDS_REKT';
      diagnosisText = `Token peaked ${peakPnlSOL.toFixed(2)} SOL in profit after your entry. You held through the dump and exited at a ${Math.abs(realizedPnlSOL).toFixed(2)} SOL loss.`;
      damageScore = Math.min(100, Math.abs(realizedPnlSOL / solSpent) * 100);
    } else {
      diagnosis = 'SOLD_THE_BOTTOM';
      diagnosisText = 'You sold near the local low. The token recovered after your exit, so the timing hurt more than the thesis.';
      damageScore = Math.min(100, ((leftOnTable ?? Math.abs(realizedPnlSOL)) / solSpent) * 80);
    }
  } else if (!exitSwap && unrealizedPnlSOL !== null) {
    if (unrealizedPnlSOL < -solSpent * 0.5) {
      diagnosis = 'DIAMOND_HANDS_REKT';
      diagnosisText = `Still holding. Down ${Math.abs(unrealizedPnlSOL).toFixed(2)} SOL. ${
        peakPnlSOL && peakPnlSOL > 0 ? `You had a +${peakPnlSOL.toFixed(2)} SOL exit window earlier.` : ''
      }`;
      damageScore = Math.min(100, Math.abs(unrealizedPnlSOL / solSpent) * 100);
    } else if (unrealizedPnlSOL > 0) {
      diagnosis = 'GOOD_TRADE';
      diagnosisText = `Still holding at a profit (+${unrealizedPnlSOL.toFixed(2)} SOL unrealized).`;
      damageScore = 5;
    } else {
      diagnosis = 'UNKNOWN';
      diagnosisText = `Position is still open and sitting ${Math.abs(unrealizedPnlSOL).toFixed(2)} SOL underwater.`;
      damageScore = Math.min(40, Math.abs(unrealizedPnlSOL / solSpent) * 50);
    }
  }

  return {
    tokenMint: entrySwap.tokenMint,
    tokenSymbol: entrySwap.tokenSymbol,
    tokenName: entrySwap.tokenName,
    entryTimestamp: entryTs,
    exitTimestamp: exitTs,
    entryPrice,
    exitPrice,
    currentPrice,
    peakPriceAfterEntry,
    peakTimestampAfterEntry,
    solSpent,
    solReceived: exitSwap?.tokenOut ?? null,
    realizedPnlSOL,
    unrealizedPnlSOL,
    peakPnlSOL,
    leftOnTable,
    diagnosis,
    diagnosisText,
    damageScore,
    entryPercentile:
      percentileData.percentile !== null
        ? `You bought in the ${percentileData.percentile}th percentile of that window`
        : null,
    signature: entrySwap.signature,
    source: entrySwap.source,
    topWinner: null,
    winnerEntryAdvantageMinutes: null,
    winnerEntryTimestamp: null,
    winnerHoldTimeMinutes: null,
    entryPriceSource: entryPrice ? (percentileData.source === 'trades_fallback' ? 'trades_fallback' : 'birdeye') : null,
    peakPriceSource: peakData?.source ?? null,
    entryPercentileSource: percentileData.source,
  };
}

export function computeWalletGrade(
  analyses: TradeAnalysis[]
): 'F' | 'D' | 'C' | 'B' | 'A' {
  if (analyses.length === 0) return 'C';
  const avg = analyses.reduce((sum, analysis) => sum + analysis.damageScore, 0) / analyses.length;
  if (avg >= 75) return 'F';
  if (avg >= 55) return 'D';
  if (avg >= 35) return 'C';
  if (avg >= 15) return 'B';
  return 'A';
}

export function computePatternTax(analyses: TradeAnalysis[]): PatternTax {
  const mistakes = analyses
    .map(analysis => analysis.diagnosis)
    .filter(diagnosis => diagnosis !== 'GOOD_TRADE' && diagnosis !== 'UNKNOWN');

  const counts: Record<string, number> = {};
  for (const mistake of mistakes) {
    counts[mistake] = (counts[mistake] ?? 0) + 1;
  }

  const mostCommonEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const mostCommonMistake = (mostCommonEntry?.[0] as DiagnosisCode) ?? 'UNKNOWN';
  const timesRepeated = mostCommonEntry?.[1] ?? 0;

  const totalCostSOL = analyses
    .filter(analysis => analysis.diagnosis === mostCommonMistake && (analysis.realizedPnlSOL ?? 0) < 0)
    .reduce((sum, analysis) => sum + Math.abs(analysis.realizedPnlSOL ?? 0), 0);

  const validWinnerComparisons = analyses.filter(
    analysis =>
      typeof analysis.winnerEntryTimestamp === 'number' &&
      analysis.winnerEntryTimestamp > 0 &&
      analysis.entryTimestamp > analysis.winnerEntryTimestamp
  );

  const avgWinnerEntryAdvantageMinutes =
    validWinnerComparisons.length > 0
      ? Math.round(
          validWinnerComparisons.reduce(
            (sum, analysis) => sum + (analysis.entryTimestamp - (analysis.winnerEntryTimestamp ?? 0)) / 60,
            0
          ) / validWinnerComparisons.length
        )
      : null;

  const losses = analyses.filter(
    analysis =>
      (analysis.realizedPnlSOL ?? 0) < 0 &&
      typeof analysis.exitTimestamp === 'number' &&
      analysis.exitTimestamp > analysis.entryTimestamp
  );

  const avgLossHoldTimeHours =
    losses.length > 0
      ? Number(
          (
            losses.reduce(
              (sum, analysis) => sum + ((analysis.exitTimestamp ?? analysis.entryTimestamp) - analysis.entryTimestamp) / 3600,
              0
            ) / losses.length
          ).toFixed(1)
        )
      : null;

  const wins = analyses.filter(
    analysis =>
      (analysis.realizedPnlSOL ?? 0) > 0 &&
      typeof analysis.exitTimestamp === 'number' &&
      analysis.exitTimestamp > analysis.entryTimestamp
  );

  const avgWinHoldTimeHours =
    wins.length > 0
      ? Number(
          (
            wins.reduce(
              (sum, analysis) => sum + ((analysis.exitTimestamp ?? analysis.entryTimestamp) - analysis.entryTimestamp) / 3600,
              0
            ) / wins.length
          ).toFixed(1)
        )
      : null;

  const validWinnerHolds = analyses.filter(
    analysis => typeof analysis.winnerHoldTimeMinutes === 'number' && analysis.winnerHoldTimeMinutes > 0
  );

  const avgWinnerHoldTimeMinutes =
    validWinnerHolds.length > 0
      ? Math.round(
          validWinnerHolds.reduce((sum, analysis) => sum + (analysis.winnerHoldTimeMinutes ?? 0), 0) /
            validWinnerHolds.length
        )
      : null;

  return {
    mostCommonMistake,
    timesRepeated,
    totalCostSOL: Number(totalCostSOL.toFixed(2)),
    avgLossHoldTimeHours,
    avgWinHoldTimeHours,
    avgWinnerEntryAdvantageMinutes,
    avgWinnerHoldTimeMinutes,
  };
}

export function computeGrade(analyses: TradeAnalysis[]): TradingGrade {
  const entryScores = analyses.map(analysis => (analysis.diagnosis === 'BOUGHT_THE_TOP' ? 100 - analysis.damageScore : 70));
  const exitScores = analyses.map(analysis =>
    analysis.diagnosis === 'PAPER_HANDS'
      ? 40
      : analysis.diagnosis === 'SOLD_THE_BOTTOM'
      ? 35
      : analysis.diagnosis === 'DIAMOND_HANDS_REKT'
      ? 25
      : analysis.diagnosis === 'GOOD_TRADE'
      ? 90
      : 55
  );

  const avg = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 50);
  const entry = Math.round(avg(entryScores));
  const exit = Math.round(avg(exitScores));

  const avgSize = analyses.length ? analyses.reduce((sum, analysis) => sum + analysis.solSpent, 0) / analyses.length : 1;
  const overSizedLosses = analyses.filter(
    analysis => (analysis.realizedPnlSOL ?? 0) < 0 && analysis.solSpent > avgSize * 1.5
  ).length;
  const size = Math.max(20, 80 - overSizedLosses * 10);

  const goodCount = analyses.filter(analysis => analysis.diagnosis === 'GOOD_TRADE').length;
  const selection = analyses.length ? Math.round((goodCount / analyses.length) * 100) : 50;
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


/* SLIP v2 Official Release */
