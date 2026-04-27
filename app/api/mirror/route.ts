import { NextRequest, NextResponse } from 'next/server';
import { getMirrorData } from '@/lib/mirror-engine';
import { PublicKey } from '@solana/web3.js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get('mint');
  const entryTs = searchParams.get('entryTs');   // unix seconds
  const sol = searchParams.get('sol');            // SOL deployed
  const wallet = searchParams.get('wallet');      // your wallet address

  if (!mint) {
    return NextResponse.json({ error: 'mint param required' }, { status: 400 });
  }

  try {
    new PublicKey(mint);
  } catch {
    return NextResponse.json({ error: 'invalid mint address' }, { status: 400 });
  }

  try {
    const result = await getMirrorData(
      mint,
      entryTs ? Number(entryTs) : undefined,
      sol ? Number(sol) : undefined,
      wallet ?? undefined
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error('[mirror]', err);
    return NextResponse.json(
      { error: 'mirror fetch failed', detail: String(err) },
      { status: 500 }
    );
  }
}
