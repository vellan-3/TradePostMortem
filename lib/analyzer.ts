import { getHistoricalPrice, getOHLCV, getCurrentPrice } from './birdeye';
import { TradeAnalysis, DiagnosisCode, PatternTax, TradingGrade } from '@/types';

interface EntrySwap {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  tokenIn: number; // SOL spent
  timestamp: number;
  signature: string;
  source: string;
}

interface ExitSwap {
  tokenOut: number; // SOL received
  timestamp: number;
}

export async function analyzeTrade(
  entrySwap: EntrySwap,
  exitSwap: ExitSwap | null
): Promise<TradeAnalysis> {
  const entryTs = entrySwap.timestamp;
  const exitTs = exitSwap?.timestamp ?? null;

  // Clamp window: entry to exit (or 24h if still holding)
  const windowEnd = exitTs ?? entryTs + 86400;

  // Fetch all prices concurrently
  const [entryPrice, exitPrice, currentPrice, ohlcv] = await Promise.all([
    getHistoricalPrice(entrySwap.tokenMint, entryTs),
    exitTs ? getHistoricalPrice(entrySwap.tokenMint, exitTs) : Promise.resolve(null),
    !exitTs ? getCurrentPrice(entrySwap.tokenMint) : Promise.resolve(null),
    getOHLCV(entrySwap.tokenMint, entryTs, windowEnd),
  ]);

  // Peak price analysis
  let peakPriceAfterEntry: number | null = null;
  let peakTimestampAfterEntry: number | null = null;

  if (ohlcv.length > 0) {
    const peak = ohlcv.reduce((best, candle) =>
      candle.h > (best.h ?? 0) ? candle : best
    );
    peakPriceAfterEntry = peak.h;
    peakTimestampAfterEntry = peak.unixTime;
  }

  // PnL in SOL
  const solSpent = entrySwap.tokenIn;
  let realizedPnlSOL: number | null = null;
  let unrealizedPnlSOL: number | null = null;
  let peakPnlSOL: number | null = null;
  let leftOnTable: number | null = null;

  if (exitSwap) {
    realizedPnlSOL = exitSwap.tokenOut - solSpent;
  }

  if (currentPrice && entryPrice && !exitSwap) {
    const ratio = currentPrice / entryPrice;
    unrealizedPnlSOL = solSpent * ratio - solSpent;
  }

  if (peakPriceAfterEntry && entryPrice) {
    const peakRatio = peakPriceAfterEntry / entryPrice;
    peakPnlSOL = solSpent * peakRatio - solSpent;
    if (realizedPnlSOL !== null) {
      leftOnTable = peakPnlSOL - realizedPnlSOL;
    }
  }

  // Diagnosis
  let diagnosis: DiagnosisCode = 'UNKNOWN';
  let diagnosisText = '';
  let damageScore = 0;

  if (exitSwap && realizedPnlSOL !== null) {
    if (realizedPnlSOL > 0) {
      if (leftOnTable && leftOnTable > realizedPnlSOL * 2) {
        diagnosis = 'PAPER_HANDS';
        diagnosisText = `You made ${realizedPnlSOL.toFixed(2)} SOL but left ${leftOnTable.toFixed(2)} SOL on the table by exiting early. Token continued to run after your sell.`;
        damageScore = Math.min(90, (leftOnTable / solSpent) * 50);
      } else {
        diagnosis = 'GOOD_TRADE';
        diagnosisText = `Solid exit. You captured most of the available move${peakPnlSOL ? ` — peak was +${peakPnlSOL.toFixed(2)} SOL and you took +${realizedPnlSOL.toFixed(2)} SOL` : ''}.`;
        damageScore = 0;
      }
    } else {
      if (entryPrice && peakPriceAfterEntry && entryPrice > peakPriceAfterEntry * 0.85) {
        diagnosis = 'BOUGHT_THE_TOP';
        diagnosisText = `You entered within 15% of the local peak. The token never recovered after your buy — it only went down from there.`;
        damageScore = Math.min(100, Math.abs(realizedPnlSOL / solSpent) * 100);
      } else if (peakPnlSOL && peakPnlSOL > 0 && realizedPnlSOL < 0) {
        diagnosis = 'DIAMOND_HANDS_REKT';
        diagnosisText = `Token peaked ${peakPnlSOL.toFixed(2)} SOL in profit after your entry. You held through the dump and exited at a ${Math.abs(realizedPnlSOL).toFixed(2)} SOL loss. Taking profit at the peak would have returned +${peakPnlSOL.toFixed(2)} SOL.`;
        damageScore = Math.min(100, Math.abs(realizedPnlSOL / solSpent) * 100);
      } else {
        const recoveredSOL = leftOnTable ?? Math.abs(realizedPnlSOL);
        diagnosis = 'SOLD_THE_BOTTOM';
        diagnosisText = `You sold near the local low. Token recovered significantly after your exit. Waiting even a few more hours would have recovered most of your position.`;
        damageScore = Math.min(100, (recoveredSOL / solSpent) * 80);
      }
    }
  } else if (!exitSwap && unrealizedPnlSOL !== null) {
    if (unrealizedPnlSOL < -solSpent * 0.5) {
      diagnosis = 'DIAMOND_HANDS_REKT';
      const pct = ((unrealizedPnlSOL / solSpent) * 100).toFixed(0);
      diagnosisText = `Still holding. Down ${Math.abs(unrealizedPnlSOL).toFixed(2)} SOL (${pct}%). ${peakPnlSOL && peakPnlSOL > 0 ? `You had a +${peakPnlSOL.toFixed(2)} SOL window to exit that you missed.` : ''}`;
      damageScore = Math.min(100, Math.abs(unrealizedPnlSOL / solSpent) * 100);
    } else if (unrealizedPnlSOL > 0) {
      diagnosis = 'GOOD_TRADE';
      diagnosisText = `Still holding at a profit (+${unrealizedPnlSOL.toFixed(2)} SOL unrealized). Watch the peak exit window.`;
      damageScore = 5;
    } else {
      diagnosis = 'UNKNOWN';
      diagnosisText = `Position is open. Down ${Math.abs(unrealizedPnlSOL).toFixed(2)} SOL but not yet critical.`;
      damageScore = Math.min(40, Math.abs(unrealizedPnlSOL / solSpent) * 50);
    }
  }

  // Entry percentile (how close to the candle HIGH was your entry?)
  let entryPercentile = '';
  if (ohlcv.length > 0 && entryPrice) {
    const entryCandle = ohlcv.find(c => Math.abs(c.unixTime - entryTs) < 900);
    if (entryCandle && entryCandle.h > entryCandle.l) {
      const pct = ((entryPrice - entryCandle.l) / (entryCandle.h - entryCandle.l)) * 100;
      entryPercentile = `You bought in the ${pct.toFixed(0)}th percentile of that candle`;
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
    entryPercentile,
    signature: entrySwap.signature,
    source: entrySwap.source,
  };
}

/**
 * Compute the overall wallet grade from a list of trade analyses.
 */
export function computeWalletGrade(
  analyses: TradeAnalysis[]
): 'F' | 'D' | 'C' | 'B' | 'A' {
  if (analyses.length === 0) return 'C';
  const avg = analyses.reduce((sum, a) => sum + a.damageScore, 0) / analyses.length;
  if (avg >= 75) return 'F';
  if (avg >= 55) return 'D';
  if (avg >= 35) return 'C';
  if (avg >= 15) return 'B';
  return 'A';
}

/**
 * Identify the most repeated mistake and what it cost.
 */
export function computePatternTax(analyses: TradeAnalysis[]): PatternTax {
  const mistakes = analyses.map(a => a.diagnosis);
  const counts: Record<string, number> = {};
  mistakes.forEach(m => { counts[m] = (counts[m] ?? 0) + 1; });

  const mostCommonEntry = Object.entries(counts)
    .filter(([k]) => k !== 'GOOD_TRADE' && k !== 'UNKNOWN')
    .sort((a, b) => b[1] - a[1])[0];

  const mostCommonMistake = (mostCommonEntry?.[0] as DiagnosisCode) ?? 'UNKNOWN';
  const timesRepeated = mostCommonEntry?.[1] ?? 0;

  const totalCostSOL = analyses
    .filter(a => a.diagnosis === mostCommonMistake)
    .reduce((sum, a) => sum + Math.abs(a.realizedPnlSOL ?? 0), 0);

  const losses = analyses.filter(a => (a.realizedPnlSOL ?? 0) < 0);
  const wins   = analyses.filter(a => (a.realizedPnlSOL ?? 0) > 0);

  const holdHours = (a: TradeAnalysis) =>
    a.exitTimestamp && a.entryTimestamp
      ? (a.exitTimestamp - a.entryTimestamp) / 3600
      : 0;

  const avgLossHoldTimeHours =
    losses.length > 0
      ? losses.reduce((s, a) => s + holdHours(a), 0) / losses.length
      : 0;

  const avgWinHoldTimeHours =
    wins.length > 0
      ? wins.reduce((s, a) => s + holdHours(a), 0) / wins.length
      : 0;

  return {
    mostCommonMistake,
    timesRepeated,
    totalCostSOL: Math.round(totalCostSOL * 100) / 100,
    avgLossHoldTimeHours: Math.round(avgLossHoldTimeHours * 10) / 10,
    avgWinHoldTimeHours:  Math.round(avgWinHoldTimeHours  * 10) / 10,
    avgWinnerEntryAdvantageMinutes: 11, // extend with per-token MIRROR data
  };
}

/**
 * 4-category trading grade: Entry · Exit · Size · Token Selection.
 */
export function computeGrade(analyses: TradeAnalysis[]): TradingGrade {
  // Entry discipline — lower percentile of candle = better
  const entryScores = analyses
    .filter(a => a.damageScore !== undefined)
    .map(a => (a.diagnosis === 'BOUGHT_THE_TOP' ? 100 - a.damageScore : 70));

  // Exit discipline
  const exitScores = analyses.map(a =>
    a.diagnosis === 'PAPER_HANDS'        ? 40 :
    a.diagnosis === 'SOLD_THE_BOTTOM'    ? 35 :
    a.diagnosis === 'DIAMOND_HANDS_REKT' ? 25 :
    a.diagnosis === 'GOOD_TRADE'         ? 90 :
    55
  );

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 50;

  const entry = Math.round(avg(entryScores));
  const exit  = Math.round(avg(exitScores));

  // Size management — penalise when solSpent > 2x average for losing trades
  const avgSize = analyses.length
    ? analyses.reduce((s, a) => s + a.solSpent, 0) / analyses.length
    : 1;
  const overSizedLosses = analyses.filter(
    a => (a.realizedPnlSOL ?? 0) < 0 && a.solSpent > avgSize * 1.5
  ).length;
  const size = Math.max(20, 80 - overSizedLosses * 10);

  // Token selection — ratio of GOOD_TRADE vs bad diagnoses
  const goodCount = analyses.filter(a => a.diagnosis === 'GOOD_TRADE').length;
  const selection = analyses.length
    ? Math.round((goodCount / analyses.length) * 100)
    : 50;

  const overall = Math.round((entry + exit + size + selection) / 4);

  return {
    overall:
      overall >= 80 ? 'A' :
      overall >= 65 ? 'B' :
      overall >= 50 ? 'C' :
      overall >= 35 ? 'D' : 'F',
    overallScore: overall,
    entryDiscipline: entry,
    exitDiscipline:  exit,
    sizeManagement:  size,
    tokenSelection:  selection,
  };
}
