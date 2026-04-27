import { Connection, PublicKey } from '@solana/web3.js';
import { getDeployerHistory, getTokenReport } from './rugcheck';
import { getOHLCV } from './birdeye';

const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
);

export interface VerdictCheck {
  name: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
  score: number; // points deducted if failed
}

export interface VerdictResult {
  mint: string;
  symbol: string;
  name: string;
  overallScore: number; // 0-100
  verdict: 'CLEAN' | 'CAUTION' | 'FLAGGED' | 'TRAP';
  checks: VerdictCheck[];
  topHolderConcentration: number; // % held by top 10
  buyPressure: { '15m': number; '1h': number; '6h': number };
  deployerHistory: Awaited<ReturnType<typeof getDeployerHistory>>;
  smartMoneyPresent: boolean;
  isLate: boolean; // entering too late in the curve
  priceMove6h: number; // % price change in 6h
  summary: string;
}

export async function runVerdict(mint: string): Promise<VerdictResult> {
  const checks: VerdictCheck[] = [];
  let score = 100;

  // ── 1. Mint authority check ──
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
    // invalid mint or RPC error — treat as unknown
  }

  checks.push({
    name: 'Mint Authority',
    passed: !mintAuthority,
    severity: 'critical',
    detail: mintAuthority
      ? `Active mint authority: ${mintAuthority.slice(0, 8)}... — dev can print unlimited supply`
      : 'Mint authority disabled. Supply is fixed. Dev cannot inflate supply.',
    score: 25,
  });
  if (mintAuthority) score -= 25;

  checks.push({
    name: 'Freeze Authority',
    passed: !freezeAuthority,
    severity: 'critical',
    detail: freezeAuthority
      ? `Freeze authority active — your tokens can be locked by the deployer`
      : 'No freeze authority. Your tokens cannot be locked.',
    score: 20,
  });
  if (freezeAuthority) score -= 20;

  // ── 2. Rugcheck token report ──
  const rugReport = await getTokenReport(mint);
  const lpLocked: boolean = rugReport?.lpLocked ?? false;
  const transferHook: boolean = rugReport?.transferHook ?? false;
  const topHolderPct: number = rugReport?.topHoldersConcentration ?? 0;
  const deployerAddress: string | null = rugReport?.deployer ?? null;

  if (rugReport?.symbol) symbol = rugReport.symbol;
  if (rugReport?.name) name = rugReport.name;

  checks.push({
    name: 'Liquidity Lock',
    passed: lpLocked,
    severity: 'critical',
    detail: lpLocked
      ? 'LP is locked or burned. Dev cannot pull liquidity.'
      : 'LP is NOT locked. Dev can remove all liquidity at any time.',
    score: 20,
  });
  if (!lpLocked) score -= 20;

  checks.push({
    name: 'Transfer Hook',
    passed: !transferHook,
    severity: 'critical',
    detail: transferHook
      ? 'Custom transfer hook detected — sells may be taxed or blocked'
      : 'No transfer hooks. Standard token behavior. Sells execute normally.',
    score: 20,
  });
  if (transferHook) score -= 20;

  const holderSeverity: 'critical' | 'warning' | 'info' =
    topHolderPct > 70 ? 'critical' : topHolderPct > 50 ? 'warning' : 'info';

  checks.push({
    name: 'Top 10 Holder Concentration',
    passed: topHolderPct < 50,
    severity: holderSeverity,
    detail: `Top 10 wallets hold ${topHolderPct.toFixed(1)}% of supply. ${
      topHolderPct > 70
        ? 'Extreme dump risk.'
        : topHolderPct > 50
        ? 'High concentration.'
        : 'Acceptable distribution.'
    }`,
    score: topHolderPct > 70 ? 15 : 8,
  });
  if (topHolderPct > 70) score -= 15;
  else if (topHolderPct > 50) score -= 8;

  // ── 3. Deployer history ──
  let deployerHistory: Awaited<ReturnType<typeof getDeployerHistory>> = null;
  if (deployerAddress) {
    deployerHistory = await getDeployerHistory(deployerAddress);
    if (deployerHistory) {
      const deployerPassed =
        deployerHistory.rugRate < 0.3 && !deployerHistory.knownScammer;
      const deployerSev: 'critical' | 'warning' =
        deployerHistory.knownScammer ? 'critical' : 'warning';
      checks.push({
        name: 'Deployer History',
        passed: deployerPassed,
        severity: deployerPassed ? 'info' : deployerSev,
        detail: deployerHistory.knownScammer
          ? `Known scammer wallet. Deployed ${deployerHistory.totalTokensDeployed} tokens, rugged ${deployerHistory.ruggedTokens}.`
          : `Deployer has ${(deployerHistory.rugRate * 100).toFixed(0)}% rug rate across ${deployerHistory.totalTokensDeployed} tokens.`,
        score: deployerHistory.knownScammer
          ? 15
          : deployerHistory.rugRate > 0.5
          ? 10
          : 0,
      });
      if (deployerHistory.knownScammer) score -= 15;
      else if (deployerHistory.rugRate > 0.5) score -= 10;
    }
  }

  // ── 4. Timing / curve position via OHLCV ──
  const now = Math.floor(Date.now() / 1000);
  let isLate = false;
  let priceMove6h = 0;

  try {
    const ohlcv = await getOHLCV(mint, now - 3600 * 6, now, '15m');
    if (ohlcv.length > 2) {
      const firstCandle = ohlcv[0];
      const latestCandle = ohlcv[ohlcv.length - 1];
      priceMove6h =
        ((latestCandle.c - firstCandle.o) / firstCandle.o) * 100;
      isLate = priceMove6h > 300;

      checks.push({
        name: 'Entry Timing',
        passed: !isLate,
        severity: 'warning',
        detail: isLate
          ? `Token is up ${priceMove6h.toFixed(0)}% in 6h. You may be entering late in the distribution phase. Latecomers fill exits for early holders.`
          : `Token has moved ${priceMove6h.toFixed(0)}% in 6h. Entry timing looks reasonable.`,
        score: isLate ? 5 : 0,
      });
      if (isLate) score -= 5;
    }
  } catch {
    // OHLCV unavailable for this token
  }

  // ── Verdict label ──
  const verdict =
    score >= 80
      ? 'CLEAN'
      : score >= 60
      ? 'CAUTION'
      : score >= 40
      ? 'FLAGGED'
      : 'TRAP';

  const summary =
    verdict === 'CLEAN'
      ? 'No major red flags detected. Standard market risk applies.'
      : verdict === 'CAUTION'
      ? 'Some risks present. Enter with reduced size and a clear exit plan before you buy.'
      : verdict === 'FLAGGED'
      ? 'Multiple red flags detected. High probability of loss. Proceed with extreme caution.'
      : 'Critical risks detected. This token has trap characteristics. Do not enter.';

  return {
    mint,
    symbol,
    name,
    overallScore: Math.max(0, score),
    verdict,
    checks,
    topHolderConcentration: topHolderPct,
    buyPressure: { '15m': 0, '1h': 0, '6h': 0 },
    deployerHistory,
    smartMoneyPresent: false,
    isLate,
    priceMove6h,
    summary,
  };
}
