import { NextRequest, NextResponse } from 'next/server';
import { runVerdict } from '@/lib/verdict-engine';
import { PublicKey } from '@solana/web3.js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mint = searchParams.get('mint');

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
    console.error('[verdict]', err);
    return NextResponse.json(
      { error: 'verdict scan failed', detail: String(err) },
      { status: 500 }
    );
  }
}
