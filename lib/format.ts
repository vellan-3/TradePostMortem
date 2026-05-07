/**
 * Display helpers for null-safe formatting.
 * Rule: missing data shows `—` (em dash), never the word "Unavailable".
 * This is the standard financial data convention.
 */

export function displayPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return '—';
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(6)}`;
  if (price < 1000) return `$${price.toFixed(4)}`;
  return `$${price.toLocaleString()}`;
}

export function displaySOL(amount: number | null | undefined, suffix = ' SOL'): string {
  if (amount === null || amount === undefined) return '—';
  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount.toFixed(2)}${suffix}`;
}

export function displayPercentile(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return '—';
  return `${pct}th percentile`;
}

export function displayPeak(
  price: number | null | undefined,
  source?: 'ohlcv' | 'trades_fallback' | null
): string {
  if (price === null || price === undefined) return '—';
  const label = displayPrice(price);
  // Append a tilde for fallback data to signal it's approximate
  return source === 'trades_fallback' ? `${label} ~` : label;
}

export function displayLeftOnTable(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  if (amount <= 0) return '—';
  return `+${amount.toFixed(2)} SOL`;
}

export function displayTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    hour12: false,
  }) + ' UTC';
}

export function displayCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

