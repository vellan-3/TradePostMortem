import { NextRequest, NextResponse } from 'next/server';
import { runVerdict } from '@/lib/verdict-engine';
import { PublicKey } from '@solana/web3.js';
import { cleanSolanaAddress } from '@/lib/address';
import type { VerdictViewModel } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mint = cleanSolanaAddress(searchParams.get('mint'));

  if (!mint) {
    return NextResponse.json({ error: 'mint param required' }, { status: 400 });
  }

  // Validate it's a valid Solana public key
  try {
    new PublicKey(mint);
  } catch {
    return NextResponse.json({ error: 'invalid mint address' }, { status: 400 });
  }

  try {
    const result = await runVerdict(mint);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[verdict] Scan failed for:', mint, err);
    return NextResponse.json(buildFallbackVerdict(mint, err));
  }
}

function buildFallbackVerdict(mint: string, err: unknown): VerdictViewModel {
  const detail = err instanceof Error ? err.message : String(err);
  return {
    hero: {
      score: 50,
      verdict: 'CAUTION',
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      mint,
      summary: `Live scan providers did not return enough data. Treat this as unverified until you confirm liquidity, authorities, and holder behavior manually. Reason: ${detail}`,
    },
    safetyLayer: [
      unavailableCheck('Mint Authority', 'Mint authority could not be verified from the live RPC response.'),
      unavailableCheck('Freeze Authority', 'Freeze authority could not be verified from the live RPC response.'),
      unavailableCheck('Liquidity Lock', 'Liquidity lock status is unavailable from the current provider response.'),
      unavailableCheck('Transfer Hook', 'Transfer hook status could not be verified.'),
      unavailableCheck('Sell Route Simulation', 'Sell route simulation is unavailable. Do not assume exits are safe.'),
    ],
    marketStructure: [
      unavailableCheck('Top 10 Holder Concentration', 'Holder concentration is unavailable from the live token report.'),
      unavailableCheck('Deployer History', 'Deployer history is unavailable from the live token report.'),
      unavailableCheck('Dev Wallet Activity', 'Developer wallet activity could not be resolved.'),
    ],
    marketMetrics: [
      { label: 'Buy/Sell Ratio 15m', value: 'N/A', tone: 'neutral', sublabel: 'Provider data unavailable', confidence: 'unavailable' },
      { label: 'Vol / Liquidity', value: 'N/A', tone: 'neutral', sublabel: 'Provider data unavailable', confidence: 'unavailable' },
      { label: '6h Price Move', value: 'N/A', tone: 'neutral', sublabel: 'Provider data unavailable', confidence: 'unavailable' },
      { label: 'Smart Money', value: 'N/A', tone: 'neutral', sublabel: 'Provider data unavailable', confidence: 'unavailable' },
    ],
    timingPosition: [
      unavailableCheck('Entry Timing', 'Entry timing could not be evaluated without price history.'),
    ],
  };
}

function unavailableCheck(name: string, detail: string): VerdictViewModel['safetyLayer'][number] {
  return {
    name,
    detail,
    status: 'warning',
    badge: 'INFO',
    confidence: 'unavailable',
  };
}
