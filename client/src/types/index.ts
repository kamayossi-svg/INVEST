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
}

export type Verdict = 'BUY_NOW' | 'WAIT_FOR_DIP' | 'WATCH' | 'AVOID';
export type Confidence = 'High' | 'Medium' | 'Low';

export interface FilterResults {
  trendFilter: boolean;      // Price > SMA 50
  momentumFilter: boolean;   // RSI 50-70
  volumeFilter: boolean;     // Volume > 110% avg
  priceFilter: boolean;      // Price > $10
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

export interface BattlePlan {
  verdict: Verdict;
  confidence: Confidence;
  confidenceScore: number;
  reasoning: string;
  whyFactors: string[];
  filterResults: FilterResults;
  entryZone: EntryZone;
  profitTarget: ProfitTarget;
  stopLoss: StopLossTarget;
  riskReward: RiskReward;
  suggestedPosition: SuggestedPosition;
  strategy?: Strategy;
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

export interface Portfolio {
  cash: number;
  holdings: Holding[];
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPL: number;
  totalUnrealizedPLPercent: number;
  totalEquity: number;
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
