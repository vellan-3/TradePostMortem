import { NextRequest, NextResponse } from 'next/server';
import { getWalletSwaps } from '@/lib/helius';

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'wallet parameter required' }, { status: 400 });
  }

  // Basic Solana address validation (base58, 32–44 chars)
  if (wallet.length < 32 || wallet.length > 44) {
    return NextResponse.json({ error: 'Invalid Solana wallet address' }, { status: 400 });
  }

  try {
    const swaps = await getWalletSwaps(wallet);
    return NextResponse.json({ swaps, count: swaps.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[/api/trades] Error:', msg);
    return NextResponse.json({ error: 'Failed to fetch trades', detail: msg }, { status: 500 });
  }
}
