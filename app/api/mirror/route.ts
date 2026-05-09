import { NextRequest, NextResponse } from 'next/server';
import { getWinnerDataWithFallback } from '@/lib/mirror-engine';
import { cleanSolanaAddress } from '@/lib/address';
import { PublicKey } from '@solana/web3.js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mint = cleanSolanaAddress(searchParams.get('mint'));
  const entryTs = searchParams.get('entryTs');   // unix seconds
  const sol = searchParams.get('sol');            // SOL deployed
  const wallet = cleanSolanaAddress(searchParams.get('wallet'));      // your wallet address

  if (!mint) {
    return NextResponse.json({ error: 'mint param required' }, { status: 400 });
  }

  try {
    new PublicKey(mint);
  } catch {
    return NextResponse.json({ error: 'invalid mint address' }, { status: 400 });
  }

  try {
    const result = await getWinnerDataWithFallback(
      mint,
      entryTs ? Number(entryTs) : undefined,
      sol ? Number(sol) : undefined,
      wallet || undefined
    );
    return NextResponse.json(result.mirrorData);
  } catch (err) {
    console.error('[mirror]', err);
    return NextResponse.json(
      { error: 'mirror fetch failed', detail: String(err) },
      { status: 500 }
    );
  }
}
