const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY!;
const BASE = 'https://public-api.birdeye.so';

const HEADERS = {
  accept: 'application/json',
  'x-chain': 'solana',
  'X-API-KEY': BIRDEYE_KEY,
};

export interface OHLCVBar {
  o: number;
  h: number;
  l: number;
  c: number;
  unixTime: number;
  v?: number;
}

export interface TokenMeta {
  symbol: string;
  name: string;
  decimals: number;
}

interface BirdeyeTrade {
  blockUnixTime?: number;
  price?: number;
}

export async function getBatchTokenMeta(
  mints: string[]
): Promise<Record<string, TokenMeta>> {
  if (mints.length === 0) return {};

  const unique = [...new Set(mints)].slice(0, 50);

  try {
    const res = await fetch(`${BASE}/defi/v3/token/meta-data/multiple`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ list_address: unique.join(',') }),
      cache: 'no-store',
    });

    if (!res.ok) return {};
    const data = await res.json();
    const result: Record<string, TokenMeta> = {};

    for (const [mint, meta] of Object.entries(data?.data ?? {})) {
      const tokenMeta = meta as any;
      if (tokenMeta?.symbol) {
        result[mint] = {
          symbol: tokenMeta.symbol,
          name: tokenMeta.name ?? tokenMeta.symbol,
          decimals: tokenMeta.decimals ?? 6,
        };
      }
    }

    return result;
  } catch {
    return {};
  }
}

export async function getTokenMetaFromRecentTrades(
  mint: string
): Promise<TokenMeta | null> {
  const trades = await getRecentTokenTrades(mint, 10);
  for (const trade of trades) {
    const quote = (trade as any)?.quote;
    const from = (trade as any)?.from;
    const to = (trade as any)?.to;
    const candidates = [quote, from, to];
    for (const candidate of candidates) {
      if (candidate?.address === mint && candidate?.symbol) {
        return {
          symbol: String(candidate.symbol),
          name: String(candidate.symbol),
          decimals: Number(candidate.decimals ?? 6),
        };
      }
    }
  }
  return null;
}

export async function getPriceAtTimestamp(
  mint: string,
  timestamp: number
): Promise<number | null> {
  try {
    const res = await fetch(
      `${BASE}/defi/historical_price_unix?address=${mint}&unixtime=${timestamp}`,
      { headers: HEADERS, cache: 'no-store' }
    );
    if (res.ok) {
      const data = await res.json();
      const price = data?.data?.value ?? null;
      if (price && price > 0) return price;
    }
  } catch {
    // fall through
  }

  const trades = await getRecentTokenTrades(mint, 50);
  if (trades.length === 0) return null;

  const closest = trades.reduce<BirdeyeTrade | null>((best, trade) => {
    if (!trade.blockUnixTime || !trade.price) return best;
    if (!best?.blockUnixTime) return trade;
    const diff = Math.abs(trade.blockUnixTime - timestamp);
    const bestDiff = Math.abs(best.blockUnixTime - timestamp);
    return diff < bestDiff ? trade : best;
  }, null);

  return closest?.price && closest.price > 0 ? closest.price : null;
}

export async function getHistoricalPrice(
  mint: string,
  unixTimestamp: number
): Promise<number | null> {
  return getPriceAtTimestamp(mint, unixTimestamp);
}

export async function getCurrentPrice(mint: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/defi/price?address=${mint}`, {
      headers: HEADERS,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.value ?? null;
  } catch {
    return null;
  }
}

export async function getOHLCV(
  mint: string,
  timeFrom: number,
  timeTo: number,
  interval = '15m'
): Promise<OHLCVBar[]> {
  try {
    const res = await fetch(
      `${BASE}/defi/v3/ohlcv?address=${mint}&type=${interval}&time_from=${timeFrom}&time_to=${timeTo}`,
      { headers: HEADERS, cache: 'no-store' }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.items ?? [];
  } catch {
    return [];
  }
}

export async function getEntryPercentile(
  mint: string,
  entryTimestamp: number,
  entryPrice: number
): Promise<{ percentile: number | null; source: 'ohlcv' | 'trades_fallback' | null }> {
  try {
    const ohlcv = await getOHLCV(mint, entryTimestamp - 900, entryTimestamp + 900, '15m');
    if (ohlcv.length > 0) {
      const candle =
        ohlcv.find(candle => candle.unixTime <= entryTimestamp && candle.unixTime + 900 >= entryTimestamp) ??
        ohlcv[0];
      const range = candle.h - candle.l;
      if (range > 0) {
        const percentile = clampPercentile(Math.round(((entryPrice - candle.l) / range) * 100));
        return { percentile, source: 'ohlcv' };
      }
    }
  } catch {
    // fall through
  }

  const trades = (await getRecentTokenTrades(mint, 100))
    .filter(
      trade =>
        typeof trade.blockUnixTime === 'number' &&
        typeof trade.price === 'number' &&
        trade.blockUnixTime >= entryTimestamp - 900 &&
        trade.blockUnixTime <= entryTimestamp + 900
    )
    .map(trade => trade.price as number);

  if (trades.length < 3) return { percentile: null, source: null };

  const low = Math.min(...trades);
  const high = Math.max(...trades);
  if (high === low) return { percentile: 50, source: 'trades_fallback' };

  return {
    percentile: clampPercentile(Math.round(((entryPrice - low) / (high - low)) * 100)),
    source: 'trades_fallback',
  };
}

export async function getPeakPriceAfterEntry(
  mint: string,
  entryTimestamp: number,
  exitTimestamp: number | null
): Promise<{ price: number; timestamp: number; source: 'ohlcv' | 'trades_fallback' } | null> {
  const windowEnd = exitTimestamp ? Math.min(exitTimestamp, entryTimestamp + 86400) : entryTimestamp + 86400;

  try {
    const ohlcv = await getOHLCV(mint, entryTimestamp, windowEnd, '15m');
    if (ohlcv.length > 0) {
      const peak = ohlcv.reduce((best, candle) => (candle.h > best.h ? candle : best));
      return { price: peak.h, timestamp: peak.unixTime, source: 'ohlcv' };
    }
  } catch {
    // fall through
  }

  const trades = (await getRecentTokenTrades(mint, 200)).filter(
    trade =>
      typeof trade.blockUnixTime === 'number' &&
      typeof trade.price === 'number' &&
      trade.blockUnixTime >= entryTimestamp &&
      trade.blockUnixTime <= windowEnd &&
      trade.price > 0
  );

  if (trades.length === 0) return null;

  const peak = trades.reduce((best, trade) => ((trade.price ?? 0) > (best.price ?? 0) ? trade : best));
  if (!peak.price || !peak.blockUnixTime) return null;

  return { price: peak.price, timestamp: peak.blockUnixTime, source: 'trades_fallback' };
}

async function getRecentTokenTrades(mint: string, limit: number): Promise<BirdeyeTrade[]> {
  try {
    const res = await fetch(`${BASE}/defi/txs/token?address=${mint}&limit=${limit}&tx_type=swap`, {
      headers: HEADERS,
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.items ?? [];
  } catch {
    return [];
  }
}

function clampPercentile(value: number): number {
  return Math.max(0, Math.min(100, value));
}

