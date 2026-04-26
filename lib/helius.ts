import { ParsedSwap } from '@/types';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY!;
const HELIUS_BASE = 'https://api-mainnet.helius-rpc.com/v0';
const BIRDEYE_BASE = 'https://public-api.birdeye.so';

/**
 * Parse token symbol from Helius description string.
 * Example: "wallet swapped 447.35 SAMO for 0.224833 RAY"
 * Returns { soldSymbol, boughtSymbol }
 */
function parseDescriptionSymbols(description: string): { sold: string | null; bought: string | null } {
  // Pattern: "... swapped <amount> <SYMBOL> for <amount> <SYMBOL>"
  const match = description.match(/swapped\s+[\d,.]+\s+(\S+)\s+for\s+[\d,.]+\s+(\S+)/i);
  if (match) {
    return { sold: match[1].toUpperCase(), bought: match[2].toUpperCase() };
  }
  return { sold: null, bought: null };
}

/**
 * Batch resolve token symbols via Birdeye token metadata API.
 * Returns a map of mint → symbol.
 */
async function resolveTokenSymbols(mints: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(mints)].filter(Boolean);
  const result: Record<string, string> = {};

  // Resolve concurrently but cap to avoid rate limiting
  const BATCH_SIZE = 8;
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map(async (mint) => {
        const res = await fetch(`${BIRDEYE_BASE}/defi/token_overview?address=${mint}`, {
          headers: {
            accept: 'application/json',
            'x-chain': 'solana',
            'X-API-KEY': BIRDEYE_KEY,
          },
          next: { revalidate: 86400 }, // cache 24h — symbols don't change
        });
        if (!res.ok) return { mint, symbol: null };
        const data = await res.json();
        const symbol = data?.data?.symbol ?? null;
        return { mint, symbol };
      })
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value.symbol) {
        result[r.value.mint] = r.value.symbol;
      }
    }
  }

  return result;
}

/**
 * Fetch and parse swap transactions for a wallet using the Helius
 * Parse Transaction History REST API.
 */
export async function getWalletSwaps(wallet: string): Promise<ParsedSwap[]> {
  const url = `${HELIUS_BASE}/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&type=SWAP&limit=100`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Helius API error ${res.status}: ${text}`);
  }

  const txs: HeliusParsedTx[] = await res.json();
  if (!Array.isArray(txs)) return [];

  const swaps: ParsedSwap[] = [];

  // ── First pass: build raw swaps + collect mints that need symbol resolution ──
  const unknownMints = new Set<string>();

  // Symbol cache built from description parsing (free, no extra API call)
  const descriptionCache: Record<string, { sold: string | null; bought: string | null }> = {};
  for (const tx of txs) {
    if (tx.description) descriptionCache[tx.signature ?? ''] = parseDescriptionSymbols(tx.description);
  }

  for (const tx of txs) {
    if (!tx.events?.swap) continue;

    const swap = tx.events.swap;
    const timestamp = tx.timestamp ?? Math.floor(Date.now() / 1000);
    const sig = tx.signature ?? '';
    const source = tx.source ?? 'UNKNOWN';
    const desc = descriptionCache[sig];

    const nativeInput = swap.nativeInput;
    const nativeOutput = swap.nativeOutput;
    const tokenInputs: HeliusTokenTransfer[] = swap.tokenInputs ?? [];
    const tokenOutputs: HeliusTokenTransfer[] = swap.tokenOutputs ?? [];

    // ── BUY: SOL in → token out ───────────────────────────────────
    if (nativeInput && tokenOutputs.length > 0) {
      const out = tokenOutputs[0];
      const decimals = out.rawTokenAmount?.decimals ?? 6;
      const amount = Number(out.rawTokenAmount?.tokenAmount ?? '0') / Math.pow(10, decimals);
      // Try description first (most reliable), then fallback field, then mark unknown
      const sym = desc?.bought ?? out.symbol ?? null;
      if (!sym) unknownMints.add(out.mint);

      swaps.push({
        signature: sig,
        timestamp,
        tokenMint: out.mint,
        tokenSymbol: sym ?? 'UNKNOWN',
        tokenName: sym ?? 'Unknown Token',
        tokenIn: nativeInput.amount / 1e9, // lamports → SOL
        tokenOut: amount,
        isBuy: true,
        source,
      });
    }

    // ── SELL: token in → SOL out ──────────────────────────────────
    if (nativeOutput && tokenInputs.length > 0) {
      const inp = tokenInputs[0];
      const decimals = inp.rawTokenAmount?.decimals ?? 6;
      const amount = Number(inp.rawTokenAmount?.tokenAmount ?? '0') / Math.pow(10, decimals);
      const sym = desc?.sold ?? inp.symbol ?? null;
      if (!sym) unknownMints.add(inp.mint);

      swaps.push({
        signature: sig,
        timestamp,
        tokenMint: inp.mint,
        tokenSymbol: sym ?? 'UNKNOWN',
        tokenName: sym ?? 'Unknown Token',
        tokenIn: amount,
        tokenOut: nativeOutput.amount / 1e9,
        isBuy: false,
        source,
      });
    }
  }

  // ── Second pass: batch-resolve any remaining UNKNOWN symbols via Birdeye ──
  if (unknownMints.size > 0) {
    const resolved = await resolveTokenSymbols([...unknownMints]);
    for (const swap of swaps) {
      if (swap.tokenSymbol === 'UNKNOWN' && resolved[swap.tokenMint]) {
        swap.tokenSymbol = resolved[swap.tokenMint];
        swap.tokenName = resolved[swap.tokenMint];
      }
    }
  }

  return swaps.sort((a, b) => b.timestamp - a.timestamp);
}

// ─── Helius REST API response types ────────────────────────────────────────

interface HeliusRawTokenAmount {
  tokenAmount: string;
  decimals: number;
}

interface HeliusTokenTransfer {
  mint: string;
  symbol?: string;
  tokenName?: string;
  rawTokenAmount?: HeliusRawTokenAmount;
}

interface HeliusNativeTransfer {
  amount: number; // lamports
}

interface HeliusSwapEvent {
  nativeInput?: HeliusNativeTransfer;
  nativeOutput?: HeliusNativeTransfer;
  tokenInputs?: HeliusTokenTransfer[];
  tokenOutputs?: HeliusTokenTransfer[];
}

interface HeliusParsedTx {
  signature?: string;
  timestamp?: number;
  source?: string;
  description?: string;
  events?: {
    swap?: HeliusSwapEvent;
  };
}
