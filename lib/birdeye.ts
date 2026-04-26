const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY!;
const BASE = 'https://public-api.birdeye.so';

const HEADERS = {
  accept: 'application/json',
  'x-chain': 'solana',
  'X-API-KEY': BIRDEYE_KEY,
};

/**
 * Price of a token at a specific unix timestamp (seconds).
 * Returns null if unavailable (meme tokens, thin liquidity, etc.)
 */
export async function getHistoricalPrice(
  mint: string,
  unixTimestamp: number
): Promise<number | null> {
  try {
    const res = await fetch(
      `${BASE}/defi/historical_price_unix?address=${mint}&unixtime=${unixTimestamp}`,
      { headers: HEADERS, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Current price of a token.
 */
export async function getCurrentPrice(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/defi/price?address=${mint}`, {
      headers: HEADERS,
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * OHLCV bars for a token between two timestamps.
 * Used to find the peak price after entry.
 */
export async function getOHLCV(
  mint: string,
  timeFrom: number,
  timeTo: number,
  interval = '15m'
): Promise<OHLCVBar[]> {
  try {
    const res = await fetch(
      `${BASE}/defi/v3/ohlcv?address=${mint}&type=${interval}&time_from=${timeFrom}&time_to=${timeTo}`,
      { headers: HEADERS, next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.items ?? [];
  } catch {
    return [];
  }
}

export interface OHLCVBar {
  o: number;
  h: number;
  l: number;
  c: number;
  unixTime: number;
  v?: number;
}
