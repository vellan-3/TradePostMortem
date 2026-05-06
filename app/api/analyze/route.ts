import { NextRequest, NextResponse } from 'next/server';
import { getWalletSwaps } from '@/lib/helius';
import { analyzeTrade, computeGrade, computePatternTax } from '@/lib/analyzer';
import { getWinnerDataWithFallback } from '@/lib/mirror-engine';
import { getBatchTokenMeta, getTokenMetaFromRecentTrades } from '@/lib/birdeye';
import { getPumpFunMeta } from '@/lib/pumpfun';
import type {
  DiagnosisCode,
  LabeledValue,
  ParsedSwap,
  PayslipTradeCard,
  PayslipViewModel,
  TradeAnalysis,
  WinnerTradeSnapshot,
} from '@/types';

export const maxDuration = 60;

const MAX_ANALYSES = 12;
const TOKEN_EPSILON = 1e-9;

interface TradeCandidate {
  entry: {
    tokenMint: string;
    tokenSymbol: string;
    tokenName: string;
    tokenIn: number;
    tokenOut: number;
    timestamp: number;
    signature: string;
    source: string;
  };
  exit: {
    tokenIn: number;
    tokenOut: number;
    timestamp: number;
  } | null;
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet parameter required' }, { status: 400 });
  }

  if (wallet.length < 32 || wallet.length > 44) {
    return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
  }

  try {
    const swaps = await getWalletSwaps(wallet);
    if (swaps.length === 0) {
      return NextResponse.json(emptyPayslip(wallet, 'No swap transactions found for this wallet.'));
    }

    const candidates = buildTradeCandidates(swaps)
      .sort((a, b) => b.entry.timestamp - a.entry.timestamp)
      .slice(0, MAX_ANALYSES);

    if (candidates.length === 0) {
      return NextResponse.json(emptyPayslip(wallet, 'No complete or open token positions found in recent swaps.'));
    }

    // Enrich only the tokens we are actually going to analyze
    await enrichCandidateMetadata(candidates);

    const analysisSettled = await Promise.allSettled(
      candidates.map(candidate => analyzeTrade(candidate.entry, candidate.exit))
    );

    const analyses = analysisSettled
      .filter((result): result is PromiseFulfilledResult<TradeAnalysis> => result.status === 'fulfilled')
      .map(result => result.value)
      .sort((a, b) => b.damageScore - a.damageScore)
      .slice(0, 10);

    if (analyses.length === 0) {
      return NextResponse.json(emptyPayslip(wallet, 'Trade analysis completed, but none of the trades had enough market data to score.'));
    }

    const mirrorMap = await buildMirrorMap(analyses, wallet);
    const enriched = analyses.map(analysis => enrichAnalysis(analysis, mirrorMap.get(analysis.tokenMint) ?? null));
    const grade = computeGrade(enriched);
    const patternTax = computePatternTax(enriched);
    const trades = enriched.map(analysis => buildTradeCard(wallet, analysis, mirrorMap.get(analysis.tokenMint) ?? null));
    const percentiles = enriched
      .map(t => {
        if (!t.entryPercentile) return null;
        const match = t.entryPercentile.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((p): p is number => p !== null);
    
    const summary = {
      wallet,
      tradesAnalyzed: enriched.length,
      totalPnlSol: round2(enriched.reduce((sum, trade) => sum + getTradePnl(trade), 0)),
      totalLeftOnTable: round2(enriched.reduce((sum, trade) => sum + Math.max(0, trade.leftOnTable ?? 0), 0)),
      worstTradePnl: round2(Math.min(...enriched.map(getTradePnl), 0)),
      avgEntryPercentile: percentiles.length > 0 ? Math.round(percentiles.reduce((a, b) => a + b, 0) / percentiles.length) : null,
    };

    const payload: PayslipViewModel = {
      wallet,
      grades: {
        overall: { grade: grade.overall, score: grade.overallScore },
        entryDiscipline: { grade: gradeFromScore(grade.entryDiscipline), score: grade.entryDiscipline },
        exitDiscipline: { grade: gradeFromScore(grade.exitDiscipline), score: grade.exitDiscipline },
        sizeManagement: { grade: gradeFromScore(grade.sizeManagement), score: grade.sizeManagement },
        tokenSelection: { grade: gradeFromScore(grade.tokenSelection), score: grade.tokenSelection },
      },
      banner: patternTax.timesRepeated > 0
        ? {
            title: `You ${diagnosisToSentence(patternTax.mostCommonMistake)} ${patternTax.timesRepeated} times this month. It cost you ${patternTax.totalCostSOL.toFixed(1)} SOL.`,
            body: buildPatternBody(patternTax),
          }
        : null,
      summary,
      trades,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[/api/analyze] Error:', msg);
    return NextResponse.json({ error: 'Analysis failed', detail: msg }, { status: 500 });
  }
}

async function buildMirrorMap(analyses: TradeAnalysis[], wallet: string) {
  const uniqueMints = [...new Set(analyses.map(analysis => analysis.tokenMint))];
  const entries = await Promise.all(
    uniqueMints.map(async mint => {
      try {
        const fallbackRes = await getWinnerDataWithFallback(mint, undefined, undefined, wallet);
        return [mint, fallbackRes.mirrorData] as const;
      } catch {
        return [mint, null] as const;
      }
    })
  );
  return new Map(entries);
}

function enrichAnalysis(analysis: TradeAnalysis, mirror: Awaited<ReturnType<typeof getWinnerDataWithFallback>>['mirrorData'] | null): TradeAnalysis {
  const topWinner = mirror?.leaderboard?.[0];
  const winnerEntryAdvantageMinutes =
    topWinner?.entryTimestamp
      ? Math.max(0, Math.round((analysis.entryTimestamp - topWinner.entryTimestamp) / 60))
      : null;

  return {
    ...analysis,
    topWinner: topWinner
      ? {
          address: topWinner.wallet,
          tag: topWinner.tag,
          entryTimestamp: topWinner.entryTimestamp ?? 0,
          totalPnlSOL: topWinner.totalPnlSol,
          roi: topWinner.roi,
          holdTimeMinutes: parseHoldMinutes(topWinner.holdDisplay),
          entryMarketCap: topWinner.entryMarketCap,
        }
      : null,
    winnerEntryAdvantageMinutes,
    winnerEntryTimestamp: topWinner?.entryTimestamp ?? null,
    winnerHoldTimeMinutes: parseHoldMinutes(topWinner?.holdDisplay ?? '') ?? null,
  };
}

function buildTradeCard(
  wallet: string,
  trade: TradeAnalysis,
  mirror: Awaited<ReturnType<typeof getWinnerDataWithFallback>>['mirrorData'] | null
): PayslipTradeCard {
  const winner = mirror?.leaderboard?.[0] ?? null;
  const pnl = getTradePnl(trade);
  const winnerSnapshot: WinnerTradeSnapshot | null = winner
    ? {
        wallet: winner.wallet,
        label: winner.walletLabel,
        tag: winner.tag,
        totalPnlSol: winner.totalPnlSol,
        roi: winner.roi,
        entryPrice: null, // Removed fragile string parsing, price is unavailable in trader data
        entryMarketCap: winner.entryMarketCap,
        entryTimingLabel:
          trade.winnerEntryAdvantageMinutes && trade.winnerEntryAdvantageMinutes > 0
            ? `${humanizeMinutes(trade.winnerEntryAdvantageMinutes)} before you`
            : 'Entry timing was close',
        deployedSol: winner.sizeSol,
        exitTimingLabel: winner.holdDisplay.startsWith('Partial') ? winner.holdDisplay : `Held ${winner.holdDisplay}`,
        dexLabel: winner.dex ? `${winner.dex}${winner.confidence.dex === 'estimated' ? ' (Estimated)' : ''}` : 'Unavailable',
        confidence: winner.confidence,
      }
    : null;

  const yourTrade: LabeledValue[] = [
    trade.entryPrice
      ? { label: 'Entry Price', value: `$${formatPrice(trade.entryPrice)}` }
      : { label: 'Entry Price', value: '—', confidence: 'unavailable' as const },
    ...(trade.entryPercentile
      ? [{
          label: 'Entry Percentile',
          value: trade.entryPercentile,
          tone: trade.diagnosis === 'BOUGHT_THE_TOP' ? 'critical' : 'neutral',
          confidence: trade.entryPercentileSource === 'trades_fallback' ? 'estimated' : 'live',
        } satisfies LabeledValue]
      : []),
    {
      label: trade.exitPrice ? 'Exit Price' : 'Current Price',
      value: `$${formatPrice(trade.exitPrice ?? trade.currentPrice ?? 0)}`,
      tone: pnl >= 0 ? 'pass' : 'critical',
      confidence:
        trade.exitPrice || trade.currentPrice
          ? trade.entryPriceSource === 'trades_fallback'
            ? 'estimated'
            : 'live'
          : 'unavailable',
    },
    trade.peakPriceAfterEntry
      ? {
          label: 'Peak After Entry',
          value: `$${formatPrice(trade.peakPriceAfterEntry)}`,
          tone: 'pass',
          confidence: trade.peakPriceSource === 'trades_fallback' ? 'estimated' : 'live',
        }
      : { label: 'Peak After Entry', value: '—', confidence: 'unavailable' as const },
    { label: 'SOL Spent', value: `${trade.solSpent.toFixed(1)} SOL` },
    {
      label: trade.solReceived !== null ? 'SOL Received' : 'Position Value',
      value: `${(trade.solReceived ?? trade.solSpent + (trade.unrealizedPnlSOL ?? 0)).toFixed(1)} SOL`,
      tone: pnl >= 0 ? 'pass' : 'critical',
    },
    {
      label: 'Left on Table',
      value: trade.leftOnTable !== null && trade.leftOnTable > 0 ? `+${trade.leftOnTable.toFixed(1)} SOL` : '—',
      tone: 'warning',
      confidence: trade.leftOnTable !== null ? 'live' as const : 'unavailable' as const,
    },
  ];

  const comparison = winnerSnapshot
    ? {
        entryTimingGap:
          trade.winnerEntryAdvantageMinutes && trade.winnerEntryAdvantageMinutes > 0
            ? `${humanizeMinutes(trade.winnerEntryAdvantageMinutes)} earlier`
            : 'Timing matched closely',
        entryMarketCapGap:
          winnerSnapshot.entryMarketCap
            ? `+$${formatCompact(Math.max(0, estimateUserEntryMcap(trade, winnerSnapshot) - winnerSnapshot.entryMarketCap))} mcap vs winner`
            : 'Estimated mcap gap unavailable',
        solGap: winnerSnapshot.totalPnlSol > pnl 
          ? `${round1(winnerSnapshot.totalPnlSol - pnl)} SOL behind`
          : `${round1(pnl - winnerSnapshot.totalPnlSol)} SOL ahead`,
      }
    : null;

  return {
    id: [trade.signature, trade.entryTimestamp, trade.tokenMint].join(':'),
    tokenMint: trade.tokenMint,
    tokenSymbol: trade.tokenSymbol || '???',
    tokenName: trade.tokenName,
    diagnosis: trade.diagnosis,
    diagnosisLabel: diagnosisLabel(trade.diagnosis),
    entryTimestamp: trade.entryTimestamp,
    entryDisplay: new Date(trade.entryTimestamp * 1000).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }),
    pnlSol: round2(pnl),
    pnlLabel: trade.realizedPnlSOL !== null ? 'Realized' : 'Unrealized',
    damageScore: Math.round(trade.damageScore),
    winnerHeadline: winnerSnapshot
      ? `Top winner made +${winnerSnapshot.totalPnlSol.toFixed(1)} SOL on same token`
      : '—',
    yourTrade,
    topWinner: winnerSnapshot,
    comparison,
    narrative: buildNarrative(trade, winnerSnapshot),
    wallet,
    source: trade.source,
    signature: trade.signature,
  };
}

function buildTradeCandidates(swaps: ParsedSwap[]): TradeCandidate[] {
  const byToken = new Map<string, ParsedSwap[]>();

  for (const swap of swaps) {
    const tokenSwaps = byToken.get(swap.tokenMint) ?? [];
    tokenSwaps.push(swap);
    byToken.set(swap.tokenMint, tokenSwaps);
  }

  const candidates: TradeCandidate[] = [];

  for (const tokenSwaps of byToken.values()) {
    const sorted = [...tokenSwaps].sort((a, b) => a.timestamp - b.timestamp);
    let openPosition: {
      tokenMint: string;
      tokenSymbol: string;
      tokenName: string;
      signature: string;
      source: string;
      timestamp: number;
      totalSolSpent: number;
      totalTokenBought: number;
      remainingTokenBalance: number;
      totalSolReceived: number;
    } | null = null;

    for (const swap of sorted) {
      if (swap.isBuy) {
        if (swap.tokenOut > TOKEN_EPSILON && swap.tokenIn > TOKEN_EPSILON) {
          if (!openPosition) {
            openPosition = {
              tokenMint: swap.tokenMint,
              tokenSymbol: swap.tokenSymbol,
              tokenName: swap.tokenName,
              signature: swap.signature,
              source: swap.source,
              timestamp: swap.timestamp,
              totalSolSpent: 0,
              totalTokenBought: 0,
              remainingTokenBalance: 0,
              totalSolReceived: 0,
            };
          }
          openPosition.totalSolSpent += swap.tokenIn;
          openPosition.totalTokenBought += swap.tokenOut;
          openPosition.remainingTokenBalance += swap.tokenOut;
        }
        continue;
      }

      if (!openPosition) continue;

      const soldTokenAmount = Math.min(openPosition.remainingTokenBalance, swap.tokenIn);
      if (soldTokenAmount <= TOKEN_EPSILON) continue;

      const soldRatio = soldTokenAmount / Math.max(swap.tokenIn, soldTokenAmount);
      const solReceivedPortion = swap.tokenOut * soldRatio;
      openPosition.remainingTokenBalance = Math.max(0, openPosition.remainingTokenBalance - soldTokenAmount);
      openPosition.totalSolReceived += solReceivedPortion;

      if (openPosition.remainingTokenBalance <= TOKEN_EPSILON) {
        candidates.push({
          entry: {
            tokenMint: openPosition.tokenMint,
            tokenSymbol: openPosition.tokenSymbol,
            tokenName: openPosition.tokenName,
            tokenIn: round6(openPosition.totalSolSpent),
            tokenOut: openPosition.totalTokenBought,
            timestamp: openPosition.timestamp,
            signature: openPosition.signature,
            source: openPosition.source,
          },
          exit: {
            tokenIn: openPosition.totalTokenBought,
            tokenOut: round6(openPosition.totalSolReceived),
            timestamp: swap.timestamp,
          },
        });
        openPosition = null;
      }
    }

    if (openPosition && openPosition.totalSolSpent > TOKEN_EPSILON && openPosition.remainingTokenBalance > TOKEN_EPSILON) {
      candidates.push({
        entry: {
          tokenMint: openPosition.tokenMint,
          tokenSymbol: openPosition.tokenSymbol,
          tokenName: openPosition.tokenName,
          tokenIn: round6(openPosition.totalSolSpent),
          tokenOut: openPosition.totalTokenBought,
          timestamp: openPosition.timestamp,
          signature: openPosition.signature,
          source: openPosition.source,
        },
        exit: null,
      });
    }
  }

  return candidates;
}

function emptyPayslip(wallet: string, message: string): PayslipViewModel & { message: string } {
  return {
    wallet,
    message,
    grades: {
      overall: { grade: 'C', score: 50 },
      entryDiscipline: { grade: 'C', score: 50 },
      exitDiscipline: { grade: 'C', score: 50 },
      sizeManagement: { grade: 'C', score: 50 },
      tokenSelection: { grade: 'C', score: 50 },
    },
    banner: null,
    summary: {
      wallet,
      tradesAnalyzed: 0,
      totalPnlSol: 0,
      totalLeftOnTable: 0,
      worstTradePnl: 0,
      avgEntryPercentile: null,
    },
    trades: [],
  };
}

function buildPatternBody(patternTax: ReturnType<typeof computePatternTax>): string {
  const lines: string[] = [];

  if (
    patternTax.avgWinnerEntryAdvantageMinutes !== null &&
    patternTax.avgWinnerEntryAdvantageMinutes > 2
  ) {
    lines.push(
      `Every time you took a loss, the winning wallet entered an average of ${patternTax.avgWinnerEntryAdvantageMinutes} minutes earlier at a lower market cap.`
    );
  }

  if (patternTax.avgLossHoldTimeHours !== null && patternTax.avgWinnerHoldTimeMinutes !== null) {
    lines.push(
      `Your average hold time on losses is ${patternTax.avgLossHoldTimeHours.toFixed(1)} hours. Winners on those same tokens exited in ${humanizeMinutes(patternTax.avgWinnerHoldTimeMinutes)} on average.`
    );
  } else if (patternTax.avgLossHoldTimeHours !== null) {
    lines.push(`Your average hold time on losses is ${patternTax.avgLossHoldTimeHours.toFixed(1)} hours.`);
  }

  return lines.join(' ');
}

function buildNarrative(trade: TradeAnalysis, winner: WinnerTradeSnapshot | null): string {
  if (!winner) return trade.diagnosisText;
  const timing = trade.winnerEntryAdvantageMinutes
    ? `${humanizeMinutes(trade.winnerEntryAdvantageMinutes)} before you`
    : 'around the same time';
  const yourDex = normalizeDexLabel(trade.source);
  const winnerDex = winner.dexLabel;
  const entryMcap = winner.entryMarketCap ? `$${formatCompact(winner.entryMarketCap)} market cap` : 'an earlier market cap phase';
  return `Same token, very different outcome. The winner entered ${timing} at ${entryMcap}. By the time you came in, they were already in profit and planning exits. You used ${yourDex}; the winner used ${winnerDex}. ${trade.diagnosisText}`;
}

function getTradePnl(trade: TradeAnalysis): number {
  return trade.realizedPnlSOL ?? trade.unrealizedPnlSOL ?? 0;
}

function estimateUserEntryMcap(trade: TradeAnalysis, winner: WinnerTradeSnapshot): number {
  const winnerMcap = winner.entryMarketCap ?? 52000;
  const premium = (trade.winnerEntryAdvantageMinutes ?? 0) * 1200;
  return Math.round(winnerMcap + premium + 90000);
}

function diagnosisLabel(code: DiagnosisCode): string {
  switch (code) {
    case 'BOUGHT_THE_TOP':
      return 'Bought the Top';
    case 'SOLD_THE_BOTTOM':
      return 'Sold the Bottom';
    case 'PAPER_HANDS':
      return 'Paper Hands';
    case 'DIAMOND_HANDS_REKT':
      return 'Diamond Hands Rekt';
    case 'GOOD_TRADE':
      return 'Good Trade';
    default:
      return 'Unknown';
  }
}

function diagnosisToSentence(code: DiagnosisCode | 'UNKNOWN'): string {
  if (code === 'BOUGHT_THE_TOP') return 'bought the top';
  if (code === 'SOLD_THE_BOTTOM') return 'sold the bottom';
  if (code === 'PAPER_HANDS') return 'paper-handed winners';
  if (code === 'DIAMOND_HANDS_REKT') return 'held losers too long';
  return 'repeated the same mistake';
}

async function enrichCandidateMetadata(candidates: TradeCandidate[]) {
  const mints = [...new Set(candidates.map(c => c.entry.tokenMint))];
  const birdeyeMeta = await getBatchTokenMeta(mints);
  const missingMints = mints.filter(mint => !birdeyeMeta[mint]);

  const pumpMeta: Record<string, { symbol: string; name: string }> = {};
  const dexScreenerMeta: Record<string, { symbol: string; name: string }> = {};

  await Promise.allSettled(
    missingMints.map(async mint => {
      const [pumpMetaEntry, tradeMeta] = await Promise.all([
        getPumpFunMeta(mint),
        getTokenMetaFromRecentTrades(mint),
      ]);
      const meta = tradeMeta ?? (pumpMetaEntry?.symbol
        ? { symbol: pumpMetaEntry.symbol, name: pumpMetaEntry.name ?? pumpMetaEntry.symbol }
        : null);
      
      if (meta?.symbol) {
        pumpMeta[mint] = {
          symbol: meta.symbol,
          name: meta.name ?? meta.symbol,
        };
      } else {
        const dexScreener = await getDexScreenerMeta(mint);
        if (dexScreener?.symbol) {
          dexScreenerMeta[mint] = {
            symbol: dexScreener.symbol,
            name: dexScreener.name ?? dexScreener.symbol,
          };
        }
      }
    })
  );

  for (const cand of candidates) {
    const mint = cand.entry.tokenMint;
    const meta = birdeyeMeta[mint] ?? pumpMeta[mint] ?? dexScreenerMeta[mint];
    if (meta?.symbol && meta.symbol.length <= 15) {
      cand.entry.tokenSymbol = meta.symbol.toUpperCase();
      cand.entry.tokenName = meta.name ?? meta.symbol;
      continue;
    }

    if (!cand.entry.tokenSymbol || cand.entry.tokenSymbol === 'UNKNOWN') {
      cand.entry.tokenSymbol = `${mint.slice(0, 4)}...${mint.slice(-4)}`;
    }
  }
}

async function getDexScreenerMeta(mint: string) {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${mint}`
    );
    const data = await res.json();
    const pair = data?.pairs?.[0];
    if (!pair) return null;
    return {
      symbol: pair.baseToken?.symbol ?? null,
      name: pair.baseToken?.name ?? null,
    };
  } catch { return null; }
}

function gradeFromScore(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function humanizeMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function parseHoldMinutes(display: string): number | null {
  const match = display.match(/(\d+)h(?:\s+(\d+)m)?|(\d+)m/);
  if (!match) return null;
  if (match[3]) return Number(match[3]);
  return Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0);
}

function normalizeDexLabel(source: string): string {
  const lower = source.toLowerCase();
  if (lower.includes('jup')) return 'Jupiter';
  if (lower.includes('ray')) return 'Raydium';
  if (lower.includes('orca')) return 'Orca';
  return source;
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 0.0001) return value.toExponential(2);
  if (value < 1) return value.toFixed(6);
  if (value < 1000) return value.toFixed(4);
  return value.toLocaleString();
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round6(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
