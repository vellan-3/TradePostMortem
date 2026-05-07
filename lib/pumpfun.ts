export interface PumpFunMeta {
  symbol: string | null;
  name: string | null;
  marketCap: number | null;
  usdMarketCap: number | null;
  createdAt: number | null;
  creator: string | null;
  description: string | null;
}

export async function getPumpFunMeta(mint: string): Promise<PumpFunMeta | null> {
  try {
    const res = await fetch(`https://frontend-api.pump.fun/coins/${mint}`, {
      headers: { 'User-Agent': 'SLIP-App/1.0' },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const data = await res.json();

    return {
      symbol: data?.symbol ?? null,
      name: data?.name ?? null,
      marketCap: data?.market_cap ?? null,
      usdMarketCap: data?.usd_market_cap ?? null,
      createdAt: data?.created_timestamp ?? null,
      creator: data?.creator ?? null,
      description: data?.description ?? null,
    };
  } catch {
    return null;
  }
}


/* SLIP v2 Official Release */
