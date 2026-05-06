import { ParsedSwap } from '@/types';
import { getHistoricalPrice } from './birdeye';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;
const BIRDEYE_KEY = process.env.BIRDEYE_API_KEY!;
const HELIUS_BASE = 'https://api-mainnet.helius-rpc.com/v0';
const BIRDEYE_BASE = 'https://public-api.birdeye.so';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const STABLE_SYMBOLS = new Set(['USDC', 'USDT']);
const HISTORY_PAGE_LIMIT = 100;
const MAX_HISTORY_PAGES = 4;
const PUMP_PROGRAM = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const PUMPSWAP_PROGRAM = 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

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
          cache: 'no-store',
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
  const [swapTxs, allTxs] = await Promise.all([
    fetchTransactionHistory(wallet, true),
    fetchTransactionHistory(wallet, false),
  ]);

  const txs = dedupeTransactions([...swapTxs, ...allTxs]);
  if (!Array.isArray(txs) || txs.length === 0) return [];

  const swaps: ParsedSwap[] = [];
  const solPriceCache = new Map<number, number | null>();

  // ── First pass: build raw swaps + collect mints that need symbol resolution ──
  const unknownMints = new Set<string>();

  // Symbol cache built from description parsing (free, no extra API call)
  const descriptionCache: Record<string, { sold: string | null; bought: string | null }> = {};
  for (const tx of txs) {
    if (tx.description) descriptionCache[tx.signature ?? ''] = parseDescriptionSymbols(tx.description);
  }

  const seenSignatures = new Set<string>();
  for (const tx of txs) {
    const parsed = await parseTransactionToSwap(tx, wallet, descriptionCache, solPriceCache);
    if (!parsed || seenSignatures.has(parsed.signature)) continue;
    seenSignatures.add(parsed.signature);
    if (parsed.tokenSymbol === 'UNKNOWN') unknownMints.add(parsed.tokenMint);
    swaps.push(parsed);
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

  const seen = new Set<string>();
  const deduped = swaps.filter(swap => {
    const key = `${swap.signature}_${swap.tokenMint}_${swap.isBuy}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped.sort((a, b) => b.timestamp - a.timestamp);
}

async function parseTransactionToSwap(
  tx: HeliusParsedTx,
  wallet: string,
  descriptionCache: Record<string, { sold: string | null; bought: string | null }>,
  solPriceCache: Map<number, number | null>
): Promise<ParsedSwap | null> {
  if (tx.events?.swap) {
    return parseStandardSwap(tx, descriptionCache, solPriceCache);
  }

  const isPumpTrade = (tx.instructions ?? []).some(
    instruction => instruction.programId === PUMP_PROGRAM || instruction.programId === PUMPSWAP_PROGRAM
  );

  if (isPumpTrade) {
    return parsePumpSwap(tx, wallet);
  }

  return null;
}

async function parseStandardSwap(
  tx: HeliusParsedTx,
  descriptionCache: Record<string, { sold: string | null; bought: string | null }>,
  solPriceCache: Map<number, number | null>
): Promise<ParsedSwap | null> {
  const swap = tx.events?.swap;
  if (!swap) return null;

  const timestamp = tx.timestamp ?? Math.floor(Date.now() / 1000);
  const sig = tx.signature ?? '';
  const source = tx.source ?? 'UNKNOWN';
  const desc = descriptionCache[sig];

  const nativeInput = swap.nativeInput;
  const nativeOutput = swap.nativeOutput;
  const tokenInputs: HeliusTokenTransfer[] = swap.tokenInputs ?? [];
  const tokenOutputs: HeliusTokenTransfer[] = swap.tokenOutputs ?? [];
  const solTokenInput = tokenInputs.find(transfer => transfer.mint === SOL_MINT);
  const solTokenOutput = tokenOutputs.find(transfer => transfer.mint === SOL_MINT);
  const stableTokenInput = tokenInputs.find(isStableTransfer);
  const stableTokenOutput = tokenOutputs.find(isStableTransfer);
  const nonQuoteInput = pickPrimaryTokenTransfer(tokenInputs.filter(transfer => !isQuoteTransfer(transfer)));
  const nonQuoteOutput = pickPrimaryTokenTransfer(tokenOutputs.filter(transfer => !isQuoteTransfer(transfer)));
  const solInputAmount = await quoteAmountToSol(
    nativeInput?.amount ? nativeInput.amount / 1e9 : tokenAmountToUi(solTokenInput),
    timestamp,
    false,
    solPriceCache
  );
  const solOutputAmount = await quoteAmountToSol(
    nativeOutput?.amount ? nativeOutput.amount / 1e9 : tokenAmountToUi(solTokenOutput),
    timestamp,
    false,
    solPriceCache
  );
  const stableInputSol = await quoteAmountToSol(tokenAmountToUi(stableTokenInput), timestamp, true, solPriceCache);
  const stableOutputSol = await quoteAmountToSol(tokenAmountToUi(stableTokenOutput), timestamp, true, solPriceCache);
  const quoteInputAmount = solInputAmount > 0 ? solInputAmount : stableInputSol;
  const quoteOutputAmount = solOutputAmount > 0 ? solOutputAmount : stableOutputSol;

  if (quoteInputAmount > 0 && nonQuoteOutput) {
    const out = nonQuoteOutput;
    const amount = tokenAmountToUi(out);
    const sym = desc?.bought ?? out.symbol ?? out.tokenName ?? null;
    return {
      signature: sig,
      timestamp,
      tokenMint: out.mint,
      tokenSymbol: sym ?? 'UNKNOWN',
      tokenName: out.tokenName ?? sym ?? 'Unknown Token',
      tokenIn: quoteInputAmount,
      tokenOut: amount,
      isBuy: true,
      source,
    };
  }

  if (quoteOutputAmount > 0 && nonQuoteInput) {
    const inp = nonQuoteInput;
    const amount = tokenAmountToUi(inp);
    const sym = desc?.sold ?? inp.symbol ?? inp.tokenName ?? null;
    return {
      signature: sig,
      timestamp,
      tokenMint: inp.mint,
      tokenSymbol: sym ?? 'UNKNOWN',
      tokenName: inp.tokenName ?? sym ?? 'Unknown Token',
      tokenIn: amount,
      tokenOut: quoteOutputAmount,
      isBuy: false,
      source,
    };
  }

  return null;
}

function parsePumpSwap(tx: HeliusParsedTx, wallet: string): ParsedSwap | null {
  try {
    const tokenTransfers = tx.tokenTransfers ?? [];
    const nativeTransfers = tx.nativeTransfers ?? [];
    const buyTransfer = pickPrimaryWalletTokenTransfer(
      tokenTransfers.filter(transfer => transfer.toUserAccount === wallet && transfer.mint !== SOL_MINT)
    );
    const sellTransfer = pickPrimaryWalletTokenTransfer(
      tokenTransfers.filter(transfer => transfer.fromUserAccount === wallet && transfer.mint !== SOL_MINT)
    );
    const tokenTransfer = buyTransfer ?? sellTransfer;
    if (!tokenTransfer) return null;

    const nativeSolIn = nativeTransfers
      .filter(transfer => transfer.toUserAccount === wallet)
      .reduce((sum, transfer) => sum + (transfer.amount ?? 0), 0) / 1e9;
    const nativeSolOut = nativeTransfers
      .filter(transfer => transfer.fromUserAccount === wallet)
      .reduce((sum, transfer) => sum + (transfer.amount ?? 0), 0) / 1e9;
    const wsolIn = tokenTransfers
      .filter(transfer => transfer.mint === SOL_MINT && transfer.toUserAccount === wallet)
      .reduce((sum, transfer) => sum + Math.abs(transfer.amount ?? tokenAmountToUi(transfer)), 0);
    const wsolOut = tokenTransfers
      .filter(transfer => transfer.mint === SOL_MINT && transfer.fromUserAccount === wallet)
      .reduce((sum, transfer) => sum + Math.abs(transfer.amount ?? tokenAmountToUi(transfer)), 0);
    const solIn = nativeSolIn + wsolIn;
    const solOut = nativeSolOut + wsolOut;

    if (solIn <= 0 && solOut <= 0) return null;

    const tokenAmount = tokenTransferUiAmount(tokenTransfer);
    const isBuy = Boolean(buyTransfer) && (solOut > 0 || !sellTransfer);
    const symbol = tokenTransfer.symbol ?? tokenTransfer.tokenName ?? tokenTransfer.mint.slice(0, 6);

    return {
      signature: tx.signature ?? '',
      timestamp: tx.timestamp ?? Math.floor(Date.now() / 1000),
      tokenMint: tokenTransfer.mint,
      tokenSymbol: symbol,
      tokenName: tokenTransfer.tokenName ?? symbol,
      tokenIn: isBuy ? solOut : tokenAmount,
      tokenOut: isBuy ? tokenAmount : solIn,
      isBuy,
      source: (tx.instructions ?? []).some(ix => ix.programId === PUMPSWAP_PROGRAM) ? 'PUMP_SWAP' : 'PUMP_FUN',
    };
  } catch {
    return null;
  }
}

async function fetchTransactionHistory(wallet: string, swapsOnly: boolean): Promise<HeliusParsedTx[]> {
  const collected: HeliusParsedTx[] = [];
  let before: string | undefined;

  for (let page = 0; page < MAX_HISTORY_PAGES; page += 1) {
    const params = new URLSearchParams({
      'api-key': HELIUS_API_KEY,
      limit: String(HISTORY_PAGE_LIMIT),
    });
    if (swapsOnly) params.set('type', 'SWAP');
    if (before) params.set('before', before);

    const url = `${HELIUS_BASE}/addresses/${wallet}/transactions?${params.toString()}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Helius API error ${res.status}: ${text}`);
    }

    const pageItems: HeliusParsedTx[] = await res.json();
    if (!Array.isArray(pageItems) || pageItems.length === 0) break;

    collected.push(...pageItems);

    const lastSignature = pageItems[pageItems.length - 1]?.signature;
    if (!lastSignature || pageItems.length < HISTORY_PAGE_LIMIT) break;
    before = lastSignature;
  }

  return collected;
}

function tokenAmountToUi(transfer?: HeliusTokenTransfer): number {
  if (!transfer?.rawTokenAmount) return 0;
  const decimals = transfer.rawTokenAmount.decimals ?? 6;
  return Number(transfer.rawTokenAmount.tokenAmount ?? '0') / Math.pow(10, decimals);
}

function pickPrimaryTokenTransfer(transfers: HeliusTokenTransfer[]): HeliusTokenTransfer | undefined {
  return [...transfers].sort((a, b) => tokenAmountToUi(b) - tokenAmountToUi(a))[0];
}

function pickPrimaryWalletTokenTransfer(transfers: HeliusTokenTransfer[]): HeliusTokenTransfer | undefined {
  return [...transfers].sort((a, b) => {
    const aAmount = tokenTransferUiAmount(a);
    const bAmount = tokenTransferUiAmount(b);
    return Math.abs(bAmount) - Math.abs(aAmount);
  })[0];
}

function tokenTransferUiAmount(transfer?: HeliusTokenTransfer): number {
  if (!transfer) return 0;
  if (typeof transfer.tokenAmount === 'number') return Math.abs(transfer.tokenAmount);
  if (typeof transfer.amount === 'number') return Math.abs(transfer.amount);
  return Math.abs(tokenAmountToUi(transfer));
}

function isStableTransfer(transfer?: HeliusTokenTransfer): boolean {
  if (!transfer) return false;
  const symbol = (transfer.symbol ?? transfer.tokenName ?? '').toUpperCase();
  return STABLE_SYMBOLS.has(symbol);
}

function isQuoteTransfer(transfer?: HeliusTokenTransfer): boolean {
  return Boolean(transfer && (transfer.mint === SOL_MINT || isStableTransfer(transfer)));
}

async function quoteAmountToSol(
  amount: number,
  timestamp: number,
  isStableQuote: boolean,
  cache: Map<number, number | null>
): Promise<number> {
  if (amount <= 0) return 0;
  if (!isStableQuote) return amount;

  const bucket = Math.floor(timestamp / 900) * 900;
  if (!cache.has(bucket)) {
    cache.set(bucket, await getHistoricalPrice(SOL_MINT, bucket));
  }

  const solPrice = cache.get(bucket);
  if (!solPrice || solPrice <= 0) return 0;
  return amount / solPrice;
}

function dedupeTransactions(transactions: HeliusParsedTx[]): HeliusParsedTx[] {
  const seen = new Set<string>();
  const unique: HeliusParsedTx[] = [];
  for (const transaction of transactions) {
    const signature = transaction.signature ?? '';
    if (!signature || seen.has(signature)) continue;
    seen.add(signature);
    unique.push(transaction);
  }
  return unique.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
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
  userAccount?: string;
  fromUserAccount?: string;
  toUserAccount?: string;
  amount?: number;
  tokenAmount?: number;
  rawTokenAmount?: HeliusRawTokenAmount;
}

interface HeliusNativeTransfer {
  amount: number; // lamports
  fromUserAccount?: string;
  toUserAccount?: string;
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
  instructions?: Array<{
    programId?: string;
  }>;
  tokenTransfers?: HeliusTokenTransfer[];
  nativeTransfers?: HeliusNativeTransfer[];
  events?: {
    swap?: HeliusSwapEvent;
  };
}
