// ─── Core parsed swap from Helius ─────────────────────────────────────────
export interface ParsedSwap {
  signature: string;
  timestamp: number; // unix seconds
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  tokenIn: number; // SOL spent (buy) or token amount (sell)
  tokenOut: number; // token received (buy) or SOL received (sell)
  isBuy: boolean;
  source: string; // "JUPITER", "RAYDIUM", etc.
}

// ─── Diagnosis types ──────────────────────────────────────────────────────
export type DiagnosisCode =
  | 'BOUGHT_THE_TOP'
  | 'SOLD_THE_BOTTOM'
  | 'PAPER_HANDS'
  | 'DIAMOND_HANDS_REKT'
  | 'GOOD_TRADE'
  | 'UNKNOWN';

// ─── Full trade analysis result ───────────────────────────────────────────
export interface TradeAnalysis {
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  entryTimestamp: number;
  exitTimestamp: number | null;
  entryPrice: number | null;
  exitPrice: number | null;
  currentPrice: number | null;
  peakPriceAfterEntry: number | null;
  peakTimestampAfterEntry: number | null;
  solSpent: number;
  solReceived: number | null;
  realizedPnlSOL: number | null;
  unrealizedPnlSOL: number | null;
  peakPnlSOL: number | null; // what you COULD have made
  leftOnTable: number | null; // peakPnl - realizedPnl
  diagnosis: DiagnosisCode;
  diagnosisText: string;
  damageScore: number; // 0-100
  entryPercentile: string;
  signature: string;
  source: string;
}

// ─── Summary stats across all trades ─────────────────────────────────────
export interface WalletSummary {
  wallet: string;
  tradesAnalyzed: number;
  totalPnlSOL: number;
  totalLeftOnTable: number;
  worstTradePnl: number;
  avgDamageScore: number;
  overallGrade: 'F' | 'D' | 'C' | 'B' | 'A';
  avgEntryPercentile: number | null;
}
