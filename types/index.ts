export interface ParsedSwap {
  signature: string;
  timestamp: number;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  tokenIn: number;
  tokenOut: number;
  isBuy: boolean;
  source: string;
}

export type DiagnosisCode =
  | 'BOUGHT_THE_TOP'
  | 'SOLD_THE_BOTTOM'
  | 'PAPER_HANDS'
  | 'DIAMOND_HANDS_REKT'
  | 'GOOD_TRADE'
  | 'UNKNOWN';

export type DataConfidence = 'live' | 'estimated' | 'simulated' | 'unavailable';

export interface LabeledValue {
  label: string;
  value: string;
  tone?: 'pass' | 'warning' | 'critical' | 'neutral';
  sublabel?: string;
  confidence?: DataConfidence;
}

export interface VerdictCheckRow {
  name: string;
  detail: string;
  status: 'pass' | 'warning' | 'critical';
  badge: 'PASS' | 'WARNING' | 'CRITICAL' | 'INFO';
  confidence: DataConfidence;
}

export interface VerdictHero {
  score: number;
  verdict: 'CLEAN' | 'CAUTION' | 'FLAGGED' | 'TRAP';
  symbol: string;
  name: string;
  mint: string;
  summary: string;
}

export interface VerdictViewModel {
  hero: VerdictHero;
  safetyLayer: VerdictCheckRow[];
  marketStructure: VerdictCheckRow[];
  marketMetrics: LabeledValue[];
  timingPosition: VerdictCheckRow[];
}

export interface MirrorLeaderboardRow {
  wallet: string;
  walletLabel: string;
  tag: string | null;
  totalPnlSol: number;
  roi: number;
  holdDisplay: string;
  entryLine: string;
  entryMarketCap: number | null;
  entryTimestamp: number | null;
  dex: string | null;
  sizeSol: number | null;
  tookPartialProfits: boolean;
  confidence: Partial<Record<'entryMarketCap' | 'dex' | 'hold' | 'entryTiming', DataConfidence>>;
}

export interface MirrorComparison {
  yourPnlSol: number;
  yourEntryLine: string;
  yourDex: string | null;
  yourDexConfidence: DataConfidence;
  winnerPnlSol: number;
  winnerEntryLine: string;
  winnerDex: string | null;
  winnerDexConfidence: DataConfidence;
  entryTimingGapLabel: string;
  entryMarketCapGapLabel: string;
  solGapLabel: string;
}

export interface MirrorPatternInsights {
  avgEntryMarketCap: string;
  avgHoldBeforePartialExit: string;
  mostUsedDex: string;
  partialProfitFrequency: string;
  avgEntryBeforePeak: string;
  avgSizeDeployed: string;
}

export interface MirrorViewModel {
  mint: string;
  symbol: string;
  leaderboard: MirrorLeaderboardRow[];
  yourRow: MirrorLeaderboardRow | null;
  comparison: MirrorComparison | null;
  patternInsights: MirrorPatternInsights;
  comparisonNote: string | null;
}

export interface WinnerTradeSnapshot {
  wallet: string;
  label: string;
  tag: string | null;
  totalPnlSol: number;
  roi: number;
  entryPrice: number | null;
  entryMarketCap: number | null;
  entryTimingLabel: string;
  deployedSol: number | null;
  exitTimingLabel: string;
  dexLabel: string;
  confidence: Partial<Record<'entryMarketCap' | 'dex' | 'entryTiming' | 'hold', DataConfidence>>;
}

export interface PayslipTradeCard {
  id: string;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  diagnosis: DiagnosisCode;
  diagnosisLabel: string;
  entryTimestamp: number;
  entryDisplay: string;
  pnlSol: number;
  pnlLabel: 'Realized' | 'Unrealized';
  damageScore: number;
  winnerHeadline: string;
  yourTrade: LabeledValue[];
  topWinner: WinnerTradeSnapshot | null;
  comparison: {
    entryTimingGap: string;
    entryMarketCapGap: string;
    solGap: string;
  } | null;
  narrative: string;
  wallet: string;
  source: string;
  signature: string;
}

export interface PayslipBanner {
  title: string;
  body: string;
}

export interface PayslipGrades {
  overall: { grade: string; score: number };
  entryDiscipline: { grade: string; score: number };
  exitDiscipline: { grade: string; score: number };
  sizeManagement: { grade: string; score: number };
  tokenSelection: { grade: string; score: number };
}

export interface PayslipSummary {
  wallet: string;
  tradesAnalyzed: number;
  totalPnlSol: number;
  totalLeftOnTable: number;
  worstTradePnl: number;
  avgEntryPercentile: number | null;
}

export interface PayslipViewModel {
  wallet: string;
  grades: PayslipGrades;
  banner: PayslipBanner | null;
  summary: PayslipSummary;
  trades: PayslipTradeCard[];
}

export interface TradeWinnerSnapshot {
  address: string;
  tag: string | null;
  entryTimestamp: number;
  totalPnlSOL: number;
  roi: number;
  holdTimeMinutes: number | null;
  entryMarketCap: number | null;
}

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
  peakPnlSOL: number | null;
  leftOnTable: number | null;
  diagnosis: DiagnosisCode;
  diagnosisText: string;
  damageScore: number;
  entryPercentile: string | null;
  signature: string;
  source: string;
  topWinner: TradeWinnerSnapshot | null;
  winnerEntryAdvantageMinutes: number | null;
  winnerEntryTimestamp: number | null;
  winnerHoldTimeMinutes: number | null;
  entryPriceSource: 'birdeye' | 'trades_fallback' | null;
  peakPriceSource: 'ohlcv' | 'trades_fallback' | null;
  entryPercentileSource: 'ohlcv' | 'trades_fallback' | null;
}

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

export interface PatternTax {
  mostCommonMistake: DiagnosisCode | 'UNKNOWN';
  timesRepeated: number;
  totalCostSOL: number;
  avgLossHoldTimeHours: number | null;
  avgWinHoldTimeHours: number | null;
  avgWinnerEntryAdvantageMinutes: number | null;
  avgWinnerHoldTimeMinutes: number | null;
}

export interface TradingGrade {
  overall: 'A' | 'B' | 'C' | 'D' | 'F';
  overallScore: number;
  entryDiscipline: number;
  exitDiscipline: number;
  sizeManagement: number;
  tokenSelection: number;
}


/* SLIP v2 Official Release */
