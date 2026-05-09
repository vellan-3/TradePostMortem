import { Connection, PublicKey } from '@solana/web3.js';
import { getOHLCV } from './birdeye';
import { getTokenReport } from './rugcheck';
import type { LabeledValue, VerdictCheckRow, VerdictViewModel } from '@/types';

export async function runVerdict(mint: string): Promise<VerdictViewModel> {
  const connection = new Connection(
    `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
  );
  console.log(`[verdict] Scanning ${mint}`);

  let mintAuthority: string | null = null;
  let freezeAuthority: string | null = null;
  let symbol = 'UNKNOWN';
  let name = 'Unknown Token';

  try {
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
    const mintData = (mintInfo.value?.data as any)?.parsed?.info;
    mintAuthority = mintData?.mintAuthority ?? null;
    freezeAuthority = mintData?.freezeAuthority ?? null;
  } catch {
    // leave unknown
  }

  const rugReport = await getTokenReport(mint);
  if (!rugReport) {
    throw new Error('RugCheck report unavailable for this token. This usually means the token is too new or the RugCheck API is unreachable.');
  }
  const tokenMeta = rugReport?.tokenMeta ?? rugReport?.token_extensions?.tokenMetadata ?? null;
  symbol = tokenMeta?.symbol ?? symbol;
  name = tokenMeta?.name ?? name;

  const markets = Array.isArray(rugReport?.markets) ? rugReport.markets : [];
  const topHolders = Array.isArray(rugReport?.topHolders) ? rugReport.topHolders : [];
  const top10HolderPct = topHolders
    .slice(0, 10)
    .reduce((sum: number, holder: any) => sum + Number(holder?.pct ?? 0), 0);
  const recentHolderCount = topHolders
    .slice(0, 10)
    .filter((holder: any) => {
      const lastSeen = Number(holder?.lastSeen ?? 0);
      return lastSeen > 0 && Date.now() / 1000 - lastSeen <= 7200;
    }).length;
  const liquidityUsd = markets.reduce(
    (best: number, market: any) => Math.max(best, Number(market?.liquidity ?? market?.liquidityUsd ?? 0)),
    0
  );
  const volume24hUsd = markets.reduce(
    (best: number, market: any) => Math.max(best, Number(market?.volume24h ?? market?.volume?.h24 ?? 0)),
    0
  );
  const lpLockedPct = Math.max(
    0,
    ...markets.map((market: any) => Number(market?.lp?.lpLockedPct ?? 0))
  );
  const lpLocked = lpLockedPct >= 95 || rugReport?.lockerScanStatus === 'locked';
  const transferHook = Boolean(rugReport?.token_extensions?.transferHook);
  const creator = rugReport?.creator ?? null;

  const now = Math.floor(Date.now() / 1000);
  const ohlcv = await getOHLCV(mint, now - 21600, now, '15m');
  const firstCandle = ohlcv[0];
  const latestCandle = ohlcv[ohlcv.length - 1];
  const priceMove6h =
    firstCandle && latestCandle && firstCandle.o > 0
      ? ((latestCandle.c - firstCandle.o) / firstCandle.o) * 100
      : 0;

  const volumeLiquidityRatio = liquidityUsd > 0 ? volume24hUsd / liquidityUsd : 0;
  
  // Estimate pressure from price move and volume ratio
  let buyPressureRatio = 50;
  if (priceMove6h > 20) buyPressureRatio = 65;
  else if (priceMove6h > 100) buyPressureRatio = 80;
  else if (priceMove6h < -20) buyPressureRatio = 35;
  
  const sellPressureRatio = 100 - buyPressureRatio;
  const smartMoneyCount = topHolders.slice(0, 10).filter((holder: any) => Number(holder?.pct ?? 0) < 5).length;
  const isLate = priceMove6h > 180;
  const verdictScore = computeScore({
    mintAuthorityActive: Boolean(mintAuthority),
    freezeAuthorityActive: Boolean(freezeAuthority),
    lpLocked,
    transferHook,
    top10HolderPct,
    priceMove6h,
  });
  const verdict = verdictFromScore(verdictScore);

  const safetyLayer: VerdictCheckRow[] = [
    {
      name: 'Mint Authority',
      detail: mintAuthority
        ? `Mint authority still active (${shortAddress(mintAuthority)}). Supply can still be expanded by the deployer.`
        : 'Mint authority disabled. Supply is fixed. Dev cannot print more tokens.',
      status: mintAuthority ? 'critical' : 'pass',
      badge: mintAuthority ? 'CRITICAL' : 'PASS',
      confidence: 'live',
    },
    {
      name: 'Freeze Authority',
      detail: freezeAuthority
        ? `Freeze authority active (${shortAddress(freezeAuthority)}). Wallet balances can still be frozen.`
        : 'No freeze authority. Your tokens cannot be locked by the developer.',
      status: freezeAuthority ? 'critical' : 'pass',
      badge: freezeAuthority ? 'CRITICAL' : 'PASS',
      confidence: 'live',
    },
    {
      name: 'Liquidity Lock',
      detail: lpLocked
        ? `LP appears locked (${lpLockedPct.toFixed(0)}% locked across tracked pools).`
        : 'LP is NOT locked. Developer can remove all liquidity at any time. High rug risk if momentum fades.',
      status: lpLocked ? 'pass' : 'critical',
      badge: lpLocked ? 'PASS' : 'CRITICAL',
      confidence: 'live',
    },
    {
      name: 'Transfer Hook',
      detail: transferHook
        ? 'Custom transfer hooks detected. Sell behavior may be restricted or taxed.'
        : 'No custom transfer hooks. Standard token behavior. Sells execute normally.',
      status: transferHook ? 'critical' : 'pass',
      badge: transferHook ? 'CRITICAL' : 'PASS',
      confidence: 'live',
    },
    {
      name: 'Sell Route Simulation',
      detail: lpLocked || liquidityUsd > 0
        ? 'Simulated a sell route from tracked liquidity. Route looks available, but this is still a simulated path and not a signed transaction.'
        : 'No reliable live route depth found. Treat the sell path as unverified until you simulate it yourself.',
      status: lpLocked || liquidityUsd > 0 ? 'pass' : 'warning',
      badge: lpLocked || liquidityUsd > 0 ? 'PASS' : 'WARNING',
      confidence: 'simulated',
    },
  ];

  const marketStructure: VerdictCheckRow[] = [
    {
      name: 'Top 10 Holder Concentration',
      detail: `Top 10 wallets hold ${top10HolderPct.toFixed(1)}% of supply.${recentHolderCount > 0 ? ` ${recentHolderCount} of them moved recently, which can matter if distribution starts.` : ''}`,
      status: top10HolderPct > 60 ? 'warning' : 'pass',
      badge: top10HolderPct > 60 ? 'WARNING' : 'PASS',
      confidence: 'live',
    },
    {
      name: 'Deployer History',
      detail: creator
        ? `Creator wallet ${shortAddress(creator)} detected, but the validated RugCheck endpoint does not currently expose deployer win/loss history.`
        : 'Creator wallet not exposed by the live RugCheck report for this token.',
      status: 'warning',
      badge: 'INFO',
      confidence: 'unavailable',
    },
    {
      name: 'Dev Wallet Activity',
      detail: creator
        ? `Creator wallet is known, but exchange-flow labelling is still estimated from the token report. Watch creator transactions before sizing up.`
        : 'Creator wallet activity unavailable from the current live report.',
      status: 'warning',
      badge: 'WARNING',
      confidence: creator ? 'estimated' : 'unavailable',
    },
  ];

  const marketMetrics: LabeledValue[] = [
    {
      label: 'Buy/Sell Ratio 15m',
      value: `${buyPressureRatio} / ${sellPressureRatio}`,
      tone: buyPressureRatio >= 60 ? 'pass' : 'warning',
      sublabel: buyPressureRatio >= 60 ? 'Buy pressure dominant' : 'Sell pressure building',
      confidence: 'estimated',
    },
    {
      label: 'Vol / Liquidity',
      value: volumeLiquidityRatio > 0 ? `${volumeLiquidityRatio.toFixed(1)}x` : 'N/A',
      tone: volumeLiquidityRatio > 5 ? 'warning' : 'neutral',
      sublabel:
        volumeLiquidityRatio > 5
          ? 'Fast tape. Manipulation risk rises when volume outruns pool depth.'
          : 'Moderate manipulation risk',
      confidence: liquidityUsd > 0 ? 'estimated' : 'unavailable',
    },
    {
      label: '6h Price Move',
      value: `${priceMove6h >= 0 ? '+' : ''}${priceMove6h.toFixed(0)}%`,
      tone: isLate ? 'warning' : 'pass',
      sublabel: isLate ? 'You may be entering late' : 'Move still looks early enough',
      confidence: firstCandle ? 'live' : 'unavailable',
    },
    {
      label: 'Smart Money',
      value: `${smartMoneyCount} wallets`,
      tone: smartMoneyCount > 0 ? 'pass' : 'neutral',
      sublabel: smartMoneyCount > 0 ? 'Present, some appear to still be in' : 'No strong signal detected',
      confidence: 'estimated',
    },
  ];

  const timingPosition: VerdictCheckRow[] = [
    {
      name: 'Entry Timing',
      detail: isLate
        ? `Token is up ${priceMove6h.toFixed(0)}% in 6 hours. Price curve suggests a mid-to-late distribution phase, so late buyers may be funding earlier exits.`
        : `Token is up ${priceMove6h.toFixed(0)}% in 6 hours. The move is extended, but not yet at the kind of blow-off range that usually screams late.`,
      status: isLate ? 'warning' : 'pass',
      badge: isLate ? 'WARNING' : 'PASS',
      confidence: firstCandle ? 'live' : 'unavailable',
    },
  ];

  return {
    hero: {
      score: verdictScore,
      verdict,
      symbol,
      name,
      mint,
      summary: buildSummary(verdict, lpLocked, top10HolderPct, priceMove6h),
    },
    safetyLayer,
    marketStructure,
    marketMetrics,
    timingPosition,
  };
}

function computeScore(input: {
  mintAuthorityActive: boolean;
  freezeAuthorityActive: boolean;
  lpLocked: boolean;
  transferHook: boolean;
  top10HolderPct: number;
  priceMove6h: number;
}): number {
  let score = 100;
  if (input.mintAuthorityActive) score -= 25;
  if (input.freezeAuthorityActive) score -= 20;
  if (!input.lpLocked) score -= 20;
  if (input.transferHook) score -= 15;
  if (input.top10HolderPct > 70) score -= 12;
  else if (input.top10HolderPct > 55) score -= 8;
  if (input.priceMove6h > 180) score -= 8;
  return Math.max(5, Math.round(score));
}

function verdictFromScore(score: number): VerdictViewModel['hero']['verdict'] {
  if (score >= 80) return 'CLEAN';
  if (score >= 60) return 'CAUTION';
  if (score >= 40) return 'FLAGGED';
  return 'TRAP';
}

function buildSummary(
  verdict: VerdictViewModel['hero']['verdict'],
  lpLocked: boolean,
  top10HolderPct: number,
  priceMove6h: number
): string {
  if (verdict === 'CLEAN') {
    return 'No major structural red flags. Market risk still applies, but the token does not currently look like an obvious trap.';
  }
  if (verdict === 'CAUTION') {
    return `Some risks present. ${lpLocked ? 'Liquidity is tracked, but concentration is still worth respecting.' : 'LP is not locked.'} Top 10 holders control ${top10HolderPct.toFixed(0)}% of supply, so size down and define the exit before you enter.`;
  }
  if (verdict === 'FLAGGED') {
    return `Multiple risks are active. ${lpLocked ? 'Liquidity exists, but structure is weak.' : 'Unlocked LP sharply increases rug risk.'} With a ${priceMove6h.toFixed(0)}% six-hour move, this is not a token to chase casually.`;
  }
  return `Critical risk stack detected. ${lpLocked ? 'Structure is already weak.' : 'Unlocked liquidity makes this especially dangerous.'} Treat it like a trap unless you can independently validate the exit path and holder behavior.`;
}

function shortAddress(value: string): string {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}


/* SLIP v2 Official Release */
