export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketState: string;
  sector?: string;
  timestamp: number;
  isSimulated?: boolean;
  isLive?: boolean;
}

export interface Explanation {
  icon: string;
  title: string;
  text: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning' | 'opportunity';
}

export interface Recommendation {
  action: string;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  color: string;
}

export interface Insights {
  explanations: Explanation[];
  tips: string[];
  recommendation: Recommendation;
  riskLevel: string;
}

export interface TradingPlan {
  entry: number;
  takeProfit: number;
  stopLoss: number;
  riskReward: number;
}

// Battle Plan Types for Strategic Trading
export interface EntryZone {
  low: number;
  high: number;
  current: number;
}

export interface ProfitTarget {
  price: number;
  percentage: number;
  perShare: number;
}

export interface StopLossTarget {
  price: number;
  percentage: number;
  perShare: number;
}

export interface RiskReward {
  ratio: number;
  description: string;
}

export interface SuggestedPosition {
  shares: number;
  investment: number;
  maxRisk: number;
  maxProfit: number;
  // Net Profit Calculation (After Fees & Tax)
  grossProfit?: number;
  totalCommission?: number;
  profitAfterFees?: number;
  taxAmount?: number;
  netProfit?: number;
  taxRate?: number;
}

export type Verdict = 'BUY_NOW' | 'WAIT_FOR_DIP' | 'WATCH' | 'AVOID';
export type Confidence = 'High' | 'Medium' | 'Low';

export interface FilterResults {
  trendFilter: boolean;      // Price > SMA 50
  momentumFilter: boolean;   // RSI 48-72 (stabilized)
  volumeFilter: boolean;     // Volume > 110% avg
  priceFilter: boolean;      // Price > $10
  safetyFilter?: boolean;    // No falling knife, no stale data
  falsePositiveFilter?: boolean; // No bull trap, divergence, extension, etc.
}

export interface RSIInterpretation {
  status: string;
  color: string;
  description?: string;
}

// Wall Street Analyst Data from Finnhub
export interface AnalystData {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  total: number;
  consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  consensusScore: number;
  period?: string;
  targetHigh: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  lastUpdated?: string;
}

// ATR-based Strategy
export interface Strategy {
  stopLoss: number;
  target: number;
  riskRatio: string;
  volatilityBased: boolean;
  volatilityPercent: number | null;
  atr?: number;
}

export interface SafetyData {
  deathCross?: boolean;
  goldenCross?: boolean;
  crossStatus?: string;
  trendStrength?: number;
  consecutiveDownDays?: number;
  isFallingKnife?: boolean;
  fiveDayReturn?: number;
  volatilityLevel?: string;
  isHighVolatility?: boolean;
  isStaleData?: boolean;
  // False Positive Prevention
  isBullTrap?: boolean;
  bullTrapRiskLevel?: string;
  hasBearishDivergence?: boolean;
  divergenceStrength?: number;
  isExtended?: boolean;
  extensionType?: string;
  extensionPercent?: number;
  isOverboughtExtreme?: boolean;
  overboughtSeverity?: string;
  isWeakBreakout?: boolean;
  breakoutQuality?: string;
  analystDivergence?: boolean;
  analystConsensus?: string;
  // Earnings Risk Data
  nextEarningsDate?: string | null;
  daysUntilEarnings?: number | null;
  earningsRisk?: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  hasUpcomingEarnings?: boolean;
}

export interface BattlePlan {
  verdict: Verdict;
  confidence: Confidence;
  confidenceScore: number;
  reasoning: string;
  whyFactors: string[];
  warnings?: string[];
  filterResults: FilterResults;
  safetyData?: SafetyData;
  entryZone: EntryZone;
  profitTarget: ProfitTarget;
  stopLoss: StopLossTarget;
  riskReward: RiskReward;
  suggestedPosition: SuggestedPosition;
  strategy?: Strategy;
  // Hysteresis fields (Stabilization #1)
  originalVerdict?: Verdict;
  isPendingConfirmation?: boolean;
  previousVerdict?: Verdict | null;
}

export interface EarningsData {
  nextEarningsDate: string | null;
  daysUntilEarnings: number | null;
  earningsRisk: 'none' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  hasUpcomingEarnings: boolean;
}

export interface StockAnalysis extends Quote {
  sma20: number | null;
  sma50: number | null;
  rsi: number | null;
  rsiInterpretation: RSIInterpretation;
  volumeRatio: number;
  avgVolume20: number;
  isUptrend: boolean;
  distanceFromSMA20: number | null;
  distanceFromSMA50: number | null;
  distanceFrom52WeekHigh: number | null;
  signal: 'QUALIFIED' | 'PARTIAL' | null;
  signalStrength: number;
  passesAllFilters: boolean;
  hasRealData: boolean;
  filterResults: FilterResults;
  tradingPlan?: TradingPlan;
  insights?: Insights;
  battlePlan: BattlePlan;
  analystData?: AnalystData;
  earningsData?: EarningsData;
}

export interface Holding {
  id: number;
  symbol: string;
  shares: number;
  avg_cost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  change?: number;
  changePercent?: number;
  name?: string;
  take_profit?: number;
  stop_loss?: number;
}

export interface Alert {
  id: number;
  type: 'TAKE_PROFIT' | 'STOP_LOSS';
  symbol: string;
  shares: number;
  exit_price: number;
  target_price: number;
  realized_pl: number;
  realized_pl_percent: number;
  message: string;
  read: boolean;
  created_at: string;
}

export interface FeesSummary {
  totalCommissionsPaid: number;
  totalTaxesPaid: number;
  totalRealizedPL: number;
  totalCosts: number;
}

export interface Portfolio {
  cash: number;
  holdings: Holding[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  totalEquity: number;
  feesSummary?: FeesSummary;
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  shares: number;
  price: number;
  total: number;
  take_profit?: number;
  stop_loss?: number;
  executed_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}
