import { ParsedSwap } from '@/types';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const HELIUS_BASE = 'https://api-mainnet.helius-rpc.com/v0';

/**
 * Fetch and parse swap transactions for a wallet using the Helius
 * Parse Transaction History REST API.
 */
export async function getWalletSwaps(wallet: string): Promise<ParsedSwap[]> {
  const url = `${HELIUS_BASE}/addresses/${wallet}/transactions?api-key=${HELIUS_API_KEY}&type=SWAP&limit=100`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 }, // cache 60s
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Helius API error ${res.status}: ${text}`);
  }

  const txs: HeliusParsedTx[] = await res.json();
  if (!Array.isArray(txs)) return [];

  const swaps: ParsedSwap[] = [];

  for (const tx of txs) {
    if (!tx.events?.swap) continue;

    const swap = tx.events.swap;
    const timestamp = tx.timestamp ?? Math.floor(Date.now() / 1000);
    const sig = tx.signature ?? '';
    const source = tx.source ?? 'UNKNOWN';

    const nativeInput = swap.nativeInput;
    const nativeOutput = swap.nativeOutput;
    const tokenInputs: HeliusTokenTransfer[] = swap.tokenInputs ?? [];
    const tokenOutputs: HeliusTokenTransfer[] = swap.tokenOutputs ?? [];

    // ── BUY: SOL/USDC in → token out ──────────────────────────────
    if (nativeInput && tokenOutputs.length > 0) {
      const out = tokenOutputs[0];
      const decimals = out.rawTokenAmount?.decimals ?? 6;
      const amount = Number(out.rawTokenAmount?.tokenAmount ?? '0') / Math.pow(10, decimals);

      swaps.push({
        signature: sig,
        timestamp,
        tokenMint: out.mint,
        tokenSymbol: out.symbol || 'UNKNOWN',
        tokenName: out.tokenName || out.symbol || 'Unknown Token',
        tokenIn: nativeInput.amount / 1e9, // lamports → SOL
        tokenOut: amount,
        isBuy: true,
        source,
      });
    }

    // ── SELL: token in → SOL/USDC out ────────────────────────────
    if (nativeOutput && tokenInputs.length > 0) {
      const inp = tokenInputs[0];
      const decimals = inp.rawTokenAmount?.decimals ?? 6;
      const amount = Number(inp.rawTokenAmount?.tokenAmount ?? '0') / Math.pow(10, decimals);

      swaps.push({
        signature: sig,
        timestamp,
        tokenMint: inp.mint,
        tokenSymbol: inp.symbol || 'UNKNOWN',
        tokenName: inp.tokenName || inp.symbol || 'Unknown Token',
        tokenIn: amount,
        tokenOut: nativeOutput.amount / 1e9,
        isBuy: false,
        source,
      });
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
  events?: {
    swap?: HeliusSwapEvent;
  };
}
