import { Connection, PublicKey } from '@solana/web3.js';
import { getOHLCV } from './birdeye';
import { getTokenReport } from './rugcheck';
import type { LabeledValue, VerdictCheckRow, VerdictViewModel } from '@/types';

export async function runVerdict(mint: string): Promise<VerdictViewModel> {
  const rpcUrl = process.env.HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
    : 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl);
  console.log(`[verdict] Scanning ${mint}`);

  let mintAuthority: string | null = null;
  let freezeAuthority: string | null = null;
  let symbol = 'UNKNOWN';
  let name = 'Unknown Token';

  try {
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(mint));
    if (mintInfo.value) {
      const mintData = (mintInfo.value?.data as any)?.parsed?.info;
      mintAuthority = mintData?.mintAuthority ?? null;
      freezeAuthority = mintData?.freezeAuthority ?? null;
      // If we got real data, we might be able to find symbol/name if rugcheck fails later
      symbol = (mintData as any)?.symbol ?? symbol;
    } else {
      console.warn('[verdict] Token mint account not found in first RPC lookup, proceeding...');
    }
  } catch (error) {
    console.warn('[verdict] Solana RPC lookup failed, proceeding with partial data:', error);
  }

  let rugReport = null;
  try {
    rugReport = await getTokenReport(mint);
  } catch (e) {
    console.warn('[verdict] RugCheck failed, continuing with partial data:', e);
  }
  
  const tokenMeta = rugReport?.tokenMeta ?? rugReport?.token_extensions?.tokenMetadata ?? null;
  symbol = tokenMeta?.symbol ?? symbol;
  name = tokenMeta?.name ?? name;

  const hasRugReport = Boolean(rugReport);
  const markets = Array.isArray(rugReport?.markets) ? rugReport.markets : [];
  const hasMarkets = markets.length > 0;
  const topHolders = Array.isArray(rugReport?.topHolders) ? rugReport.topHolders : [];
  const hasTopHolders = topHolders.length > 0;
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
  const lpLocked = hasMarkets ? lpLockedPct >= 95 || rugReport?.lockerScanStatus === 'locked' : null;
  const transferHook = hasRugReport ? Boolean(rugReport?.token_extensions?.transferHook) : null;
  const creator = rugReport?.creator ?? null;

  const now = Math.floor(Date.now() / 1000);
  const ohlcv = await getOHLCV(mint, now - 21600, now, '15m');
  const firstCandle = ohlcv[0];
  const latestCandle = ohlcv[ohlcv.length - 1];
  const hasPriceHistory = Boolean(firstCandle && latestCandle && firstCandle.o > 0);
  const priceMove6h =
    hasPriceHistory
      ? ((latestCandle.c - firstCandle.o) / firstCandle.o) * 100
      : 0;

  const volumeLiquidityRatio = liquidityUsd > 0 ? volume24hUsd / liquidityUsd : 0;
  
  // Estimate pressure from price move and volume ratio
  let buyPressureRatio: number | null = null;
  if (hasPriceHistory) {
    if (priceMove6h > 100) buyPressureRatio = 80;
    else if (priceMove6h > 20) buyPressureRatio = 65;
    else if (priceMove6h < -20) buyPressureRatio = 35;
    else buyPressureRatio = 50;
  }
  
  const sellPressureRatio = buyPressureRatio === null ? null : 100 - buyPressureRatio;
  const smartMoneyCount = topHolders.slice(0, 10).filter((holder: any) => Number(holder?.pct ?? 0) < 5).length;
  const isLate = priceMove6h > 180;
  const verdictScore = computeScore({
    mintAuthorityActive: Boolean(mintAuthority),
    freezeAuthorityActive: Boolean(freezeAuthority),
    lpLocked,
    transferHook,
    top10HolderPct: hasTopHolders ? top10HolderPct : null,
    priceMove6h: hasPriceHistory ? priceMove6h : null,
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
      detail: lpLocked === null
        ? 'Liquidity lock status is unavailable because the token market report did not return pool data.'
        : lpLocked
        ? `LP appears locked (${lpLockedPct.toFixed(0)}% locked across tracked pools).`
        : 'LP is NOT locked. Developer can remove all liquidity at any time. High rug risk if momentum fades.',
      status: lpLocked === null ? 'warning' : lpLocked ? 'pass' : 'critical',
      badge: lpLocked === null ? 'INFO' : lpLocked ? 'PASS' : 'CRITICAL',
      confidence: lpLocked === null ? 'unavailable' : 'live',
    },
    {
      name: 'Transfer Hook',
      detail: transferHook === null
        ? 'Transfer hook status is unavailable because the token report did not return extension data.'
        : transferHook
        ? 'Custom transfer hooks detected. Sell behavior may be restricted or taxed.'
        : 'No custom transfer hooks. Standard token behavior. Sells execute normally.',
      status: transferHook === null ? 'warning' : transferHook ? 'critical' : 'pass',
      badge: transferHook === null ? 'INFO' : transferHook ? 'CRITICAL' : 'PASS',
      confidence: transferHook === null ? 'unavailable' : 'live',
    },
    {
      name: 'Sell Route Simulation',
      detail: hasMarkets && (lpLocked || liquidityUsd > 0)
        ? 'Simulated a sell route from tracked liquidity. Route looks available, but this is still a simulated path and not a signed transaction.'
        : hasMarkets
        ? 'No reliable live route depth found. Treat the sell path as unverified until you simulate it yourself.'
        : 'Sell route data is unavailable because the token market report did not return pool data.',
      status: hasMarkets && (lpLocked || liquidityUsd > 0) ? 'pass' : 'warning',
      badge: hasMarkets && (lpLocked || liquidityUsd > 0) ? 'PASS' : hasMarkets ? 'WARNING' : 'INFO',
      confidence: hasMarkets ? 'simulated' : 'unavailable',
    },
  ];

  const marketStructure: VerdictCheckRow[] = [
    {
      name: 'Top 10 Holder Concentration',
      detail: hasTopHolders
        ? `Top 10 wallets hold ${top10HolderPct.toFixed(1)}% of supply.${recentHolderCount > 0 ? ` ${recentHolderCount} of them moved recently, which can matter if distribution starts.` : ''}`
        : 'Top holder concentration is unavailable because the token report did not return holder data.',
      status: hasTopHolders ? (top10HolderPct > 60 ? 'warning' : 'pass') : 'warning',
      badge: hasTopHolders ? (top10HolderPct > 60 ? 'WARNING' : 'PASS') : 'INFO',
      confidence: hasTopHolders ? 'live' : 'unavailable',
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
      value: buyPressureRatio === null ? 'N/A' : `${buyPressureRatio} / ${sellPressureRatio}`,
      tone: buyPressureRatio !== null && buyPressureRatio >= 60 ? 'pass' : 'warning',
      sublabel: buyPressureRatio === null
        ? 'Birdeye did not return price history for pressure estimation'
        : buyPressureRatio >= 60
        ? 'Buy pressure dominant'
        : 'Sell pressure building',
      confidence: buyPressureRatio === null ? 'unavailable' : 'estimated',
    },
    {
      label: 'Vol / Liquidity',
      value: hasMarkets && volumeLiquidityRatio > 0 ? `${volumeLiquidityRatio.toFixed(1)}x` : 'N/A',
      tone: volumeLiquidityRatio > 5 ? 'warning' : 'neutral',
      sublabel:
        !hasMarkets
          ? 'Market report did not return liquidity data'
          : volumeLiquidityRatio > 5
          ? 'Fast tape. Manipulation risk rises when volume outruns pool depth.'
          : 'Moderate manipulation risk',
      confidence: hasMarkets && liquidityUsd > 0 ? 'estimated' : 'unavailable',
    },
    {
      label: '6h Price Move',
      value: hasPriceHistory ? formatSignedPercent(priceMove6h) : 'N/A',
      tone: hasPriceHistory && isLate ? 'warning' : hasPriceHistory ? 'pass' : 'neutral',
      sublabel: hasPriceHistory ? (isLate ? 'You may be entering late' : 'Move still looks early enough') : 'Birdeye did not return 6h price history',
      confidence: hasPriceHistory ? 'live' : 'unavailable',
    },
    {
      label: 'Smart Money',
      value: hasTopHolders ? `${smartMoneyCount} wallets` : 'N/A',
      tone: smartMoneyCount > 0 ? 'pass' : 'neutral',
      sublabel: hasTopHolders ? (smartMoneyCount > 0 ? 'Present, some appear to still be in' : 'No strong signal detected') : 'Holder data unavailable',
      confidence: hasTopHolders ? 'estimated' : 'unavailable',
    },
  ];

  const timingPosition: VerdictCheckRow[] = [
    {
      name: 'Entry Timing',
      detail: !hasPriceHistory
        ? 'Entry timing could not be evaluated because Birdeye did not return 6h price history.'
        : isLate
        ? `Token moved ${formatSignedPercent(priceMove6h)} in 6 hours. Price curve suggests a mid-to-late distribution phase, so late buyers may be funding earlier exits.`
        : `Token moved ${formatSignedPercent(priceMove6h)} in 6 hours. The move is not yet at the kind of blow-off range that usually screams late.`,
      status: hasPriceHistory && isLate ? 'warning' : hasPriceHistory ? 'pass' : 'warning',
      badge: hasPriceHistory ? (isLate ? 'WARNING' : 'PASS') : 'INFO',
      confidence: hasPriceHistory ? 'live' : 'unavailable',
    },
  ];

  return {
    hero: {
      score: verdictScore,
      verdict,
      symbol,
      name,
      mint,
      summary: buildSummary(verdict, lpLocked, hasTopHolders ? top10HolderPct : null, hasPriceHistory ? priceMove6h : null),
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
  lpLocked: boolean | null;
  transferHook: boolean | null;
  top10HolderPct: number | null;
  priceMove6h: number | null;
}): number {
  let score = 100;
  if (input.mintAuthorityActive) score -= 25;
  if (input.freezeAuthorityActive) score -= 20;
  if (input.lpLocked === false) score -= 20;
  else if (input.lpLocked === null) score -= 20;
  if (input.transferHook) score -= 15;
  if (input.top10HolderPct !== null && input.top10HolderPct > 70) score -= 12;
  else if (input.top10HolderPct !== null && input.top10HolderPct > 55) score -= 8;
  else if (input.top10HolderPct === null) score -= 8;
  if (input.priceMove6h !== null && input.priceMove6h > 180) score -= 8;
  else if (input.priceMove6h === null) score -= 5;
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
  lpLocked: boolean | null,
  top10HolderPct: number | null,
  priceMove6h: number | null
): string {
  const holderText = top10HolderPct !== null
    ? `Top 10 holders control ${top10HolderPct.toFixed(0)}% of supply`
    : 'Holder concentration is unavailable';
  const moveText = priceMove6h !== null
    ? `a ${formatSignedPercent(priceMove6h)} six-hour move`
    : 'unavailable six-hour price history';

  if (verdict === 'CLEAN') {
    return 'No major structural red flags. Market risk still applies, but the token does not currently look like an obvious trap.';
  }
  if (verdict === 'CAUTION') {
    return `Some risks present. ${lpLocked === true ? 'Liquidity is tracked, but concentration is still worth respecting.' : lpLocked === false ? 'LP is not locked.' : 'LP lock status is unavailable.'} ${holderText}, so size down and define the exit before you enter.`;
  }
  if (verdict === 'FLAGGED') {
    return `Multiple risks are active. ${lpLocked === true ? 'Liquidity exists, but structure is weak.' : lpLocked === false ? 'Unlocked LP sharply increases rug risk.' : 'LP lock status is unavailable.'} With ${moveText}, this is not a token to chase casually.`;
  }
  return `Critical risk stack detected. ${lpLocked === true ? 'Structure is already weak.' : lpLocked === false ? 'Unlocked liquidity makes this especially dangerous.' : 'Liquidity status could not be verified.'} Treat it like a trap unless you can independently validate the exit path and holder behavior.`;
}

function shortAddress(value: string): string {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`;
}


/* SLIP v2 Official Release */
