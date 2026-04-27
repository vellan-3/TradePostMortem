import { NextRequest, NextResponse } from 'next/server';
import { getWalletSwaps } from '@/lib/helius';
import { analyzeTrade, computeWalletGrade, computePatternTax, computeGrade } from '@/lib/analyzer';
import { ParsedSwap, TradeAnalysis, WalletSummary, PatternTax, TradingGrade } from '@/types';

export const maxDuration = 60; // Vercel: allow up to 60s for analysis

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet parameter required' }, { status: 400 });
  }

  if (wallet.length < 32 || wallet.length > 44) {
    return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
  }

  try {
    // 1. Fetch swaps
    const swaps = await getWalletSwaps(wallet);
    if (swaps.length === 0) {
      return NextResponse.json({
        analyses: [],
        summary: buildEmptySummary(wallet),
        message: 'No swap transactions found for this wallet',
      });
    }

    // 2. Group buys and sells by token mint
    const byToken: Record<string, { buys: ParsedSwap[]; sells: ParsedSwap[] }> = {};
    for (const swap of swaps) {
      if (!byToken[swap.tokenMint]) byToken[swap.tokenMint] = { buys: [], sells: [] };
      if (swap.isBuy) byToken[swap.tokenMint].buys.push(swap);
      else byToken[swap.tokenMint].sells.push(swap);
    }

    // 3. Analyze trades (limit per token to avoid API overload)
    const analysisPromises: Promise<TradeAnalysis>[] = [];

    for (const [, { buys, sells }] of Object.entries(byToken)) {
      for (const buy of buys.slice(0, 2)) {
        // Find the closest sell AFTER this buy for same token
        const matchedSell =
          sells
            .filter(s => s.timestamp > buy.timestamp)
            .sort((a, b) => a.timestamp - b.timestamp)[0] ?? null;

        analysisPromises.push(
          analyzeTrade(
            {
              tokenMint: buy.tokenMint,
              tokenSymbol: buy.tokenSymbol,
              tokenName: buy.tokenName,
              tokenIn: buy.tokenIn,
              timestamp: buy.timestamp,
              signature: buy.signature,
              source: buy.source,
            },
            matchedSell
              ? { tokenOut: matchedSell.tokenOut, timestamp: matchedSell.timestamp }
              : null
          )
        );
      }
    }

    // Run in parallel (but cap at 12 to respect rate limits)
    const capped = analysisPromises.slice(0, 12);
    const settled = await Promise.allSettled(capped);

    const analyses: TradeAnalysis[] = settled
      .filter((r): r is PromiseFulfilledResult<TradeAnalysis> => r.status === 'fulfilled')
      .map(r => r.value);

    // 4. Sort worst first
    analyses.sort((a, b) => b.damageScore - a.damageScore);
    const top10 = analyses.slice(0, 10);

    // 5. Build summary stats
    const summary = buildSummary(wallet, top10);
    const patternTax: PatternTax = computePatternTax(top10);
    const grade: TradingGrade = computeGrade(top10);

    return NextResponse.json({ analyses: top10, summary, patternTax, grade });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[/api/analyze] Error:', msg);
    return NextResponse.json(
      { error: 'Analysis failed', detail: msg },
      { status: 500 }
    );
  }
}

function buildSummary(wallet: string, analyses: TradeAnalysis[]): WalletSummary {
  if (analyses.length === 0) return buildEmptySummary(wallet);

  const totalPnl = analyses.reduce((sum, a) => {
    const pnl = a.realizedPnlSOL ?? a.unrealizedPnlSOL ?? 0;
    return sum + pnl;
  }, 0);

  const totalLeft = analyses.reduce((sum, a) => sum + (a.leftOnTable ?? 0), 0);

  const worstPnl = analyses.reduce(
    (worst, a) => {
      const pnl = a.realizedPnlSOL ?? a.unrealizedPnlSOL ?? 0;
      return pnl < worst ? pnl : worst;
    },
    0
  );

  const avgDamage =
    analyses.reduce((sum, a) => sum + a.damageScore, 0) / analyses.length;

  // Avg entry percentile from those that have it
  const withPercentile = analyses.filter(a => a.entryPercentile !== '');
  let avgEntryPct: number | null = null;
  if (withPercentile.length > 0) {
    const nums = withPercentile.map(a => {
      const m = a.entryPercentile.match(/(\d+)th/);
      return m ? parseInt(m[1]) : 50;
    });
    avgEntryPct = nums.reduce((s, n) => s + n, 0) / nums.length;
  }

  return {
    wallet,
    tradesAnalyzed: analyses.length,
    totalPnlSOL: totalPnl,
    totalLeftOnTable: totalLeft,
    worstTradePnl: worstPnl,
    avgDamageScore: avgDamage,
    overallGrade: computeWalletGrade(analyses),
    avgEntryPercentile: avgEntryPct,
  };
}

function buildEmptySummary(wallet: string): WalletSummary {
  return {
    wallet,
    tradesAnalyzed: 0,
    totalPnlSOL: 0,
    totalLeftOnTable: 0,
    worstTradePnl: 0,
    avgDamageScore: 0,
    overallGrade: 'C',
    avgEntryPercentile: null,
  };
}
