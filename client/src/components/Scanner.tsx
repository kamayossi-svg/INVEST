import { useState } from 'react';
import type { StockAnalysis, Verdict } from '../types';
import { useLanguage } from '../i18n';
import OrderEditor from './OrderEditor';

interface ScannerProps {
  data: StockAnalysis[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onTradeComplete: () => void;
  cash: number;
  ownedSymbols: string[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

// Verdict Badge Configuration (styling only - labels come from translations)
const verdictStyles: Record<Verdict, { bg: string; text: string; dot: string }> = {
  'BUY_NOW': {
    bg: 'bg-green-500/20 border-green-500/40',
    text: 'text-green-400',
    dot: 'bg-green-500'
  },
  'WAIT_FOR_DIP': {
    bg: 'bg-yellow-500/20 border-yellow-500/40',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500'
  },
  'WATCH': {
    bg: 'bg-yellow-500/20 border-yellow-500/40',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500'
  },
  'AVOID': {
    bg: 'bg-red-500/20 border-red-500/40',
    text: 'text-red-400',
    dot: 'bg-red-500'
  }
};

// Get verdict label based on language
function getVerdictLabel(verdict: Verdict, t: (key: string) => string): string {
  switch (verdict) {
    case 'BUY_NOW': return t('verdictBuyNow');
    case 'WAIT_FOR_DIP':
    case 'WATCH': return t('verdictWatch');
    case 'AVOID': return t('verdictAvoid');
    default: return verdict;
  }
}

// ==========================================
// SMART TRADE CARD COMPONENT
// ==========================================
function SmartTradeCard({
  stock,
  onTradePlan,
  isOwned,
}: {
  stock: StockAnalysis;
  onTradePlan: (stock: StockAnalysis) => void;
  isOwned: boolean;
}) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const { t, isRTL } = useLanguage();
  const { battlePlan, filterResults } = stock;
  const badge = verdictStyles[battlePlan.verdict];
  const verdictLabel = getVerdictLabel(battlePlan.verdict, t);

  // Calculate risk/reward percentages
  const riskPercent = ((stock.price - battlePlan.stopLoss.price) / stock.price * 100).toFixed(1);
  const rewardPercent = ((battlePlan.profitTarget.price - stock.price) / stock.price * 100).toFixed(1);

  // Determine analysis indicators
  const trendStatus = filterResults?.trendFilter
    ? { icon: '✅', text: t('trendUp'), color: 'text-green-400' }
    : { icon: '❌', text: t('trendDown'), color: 'text-red-400' };

  const momentumStatus = stock.rsi !== null
    ? stock.rsi >= 70
      ? { icon: '⚠️', text: `${t('momentumHigh')} (RSI ${stock.rsi})`, color: 'text-yellow-400' }
      : stock.rsi >= 50
        ? { icon: '✅', text: `${t('momentumStrong')} (RSI ${stock.rsi})`, color: 'text-green-400' }
        : { icon: '⚠️', text: `${t('momentumWeak')} (RSI ${stock.rsi})`, color: 'text-yellow-400' }
    : { icon: '❓', text: t('momentumUnknown'), color: 'text-gray-400' };

  const volumeStatus = filterResults?.volumeFilter
    ? { icon: '✅', text: t('volumeStrong'), color: 'text-green-400' }
    : { icon: '⚠️', text: t('volumeLow'), color: 'text-yellow-400' };

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl shadow-black/20 border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300">

      {/* ========== TOP SECTION: Ticker & Status ========== */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-start justify-between">
          {/* Left: Symbol & Price */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-2xl font-bold text-white">{stock.symbol}</h3>
              {isOwned && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30 flex items-center gap-1">
                  <span>💼</span> {t('inPortfolio')}
                </span>
              )}
              <span className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(stock.changePercent)}
              </span>
              <a
                href={`https://www.tradingview.com/chart/?symbol=${stock.symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-400 transition-colors ml-1"
                title={t('verifyOnTradingView')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {formatCurrency(stock.price)}
            </p>
            <p className="text-sm text-gray-500">{stock.name}</p>
          </div>

          {/* Right: Verdict Badge & Confidence */}
          <div className="flex flex-col items-end gap-2">
            <div className={`px-4 py-2 rounded-full border ${badge.bg} flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
              <span className={`font-bold text-sm ${badge.text}`}>{verdictLabel}</span>
            </div>
            {/* Confidence Score */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    battlePlan.confidenceScore >= 70 ? 'bg-green-500' :
                    battlePlan.confidenceScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(battlePlan.confidenceScore, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${
                battlePlan.confidenceScore >= 70 ? 'text-green-400' :
                battlePlan.confidenceScore >= 45 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {battlePlan.confidenceScore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== WALL STREET ANALYSTS SECTION ========== */}
      {stock.analystData && (
        <div className="px-5 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-2">
              <span>🏛️</span> {t('wallStreetAnalysts')}
            </p>
            <span className="text-xs text-gray-500">
              {stock.analystData.total} {t('analysts')}
            </span>
          </div>

          {/* Consensus Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                stock.analystData.consensus === 'Strong Buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                stock.analystData.consensus === 'Buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                stock.analystData.consensus === 'Hold' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                stock.analystData.consensus === 'Sell' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {stock.analystData.consensus === 'Strong Buy' ? t('strongBuy') :
                 stock.analystData.consensus === 'Buy' ? t('buy') :
                 stock.analystData.consensus === 'Hold' ? t('hold') :
                 stock.analystData.consensus === 'Sell' ? t('sell') : t('strongSell')}
              </span>
              <span className="text-gray-400 text-sm">
                {t('consensusScore')}: {stock.analystData.consensusScore}/5
              </span>
            </div>
          </div>

          {/* Rating Distribution Bar */}
          <div className="flex h-2 rounded-full overflow-hidden mb-3 bg-gray-700">
            {stock.analystData.strongBuy > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(stock.analystData.strongBuy / stock.analystData.total) * 100}%` }}
                title={`Strong Buy: ${stock.analystData.strongBuy}`}
              />
            )}
            {stock.analystData.buy > 0 && (
              <div
                className="bg-emerald-400"
                style={{ width: `${(stock.analystData.buy / stock.analystData.total) * 100}%` }}
                title={`Buy: ${stock.analystData.buy}`}
              />
            )}
            {stock.analystData.hold > 0 && (
              <div
                className="bg-yellow-400"
                style={{ width: `${(stock.analystData.hold / stock.analystData.total) * 100}%` }}
                title={`Hold: ${stock.analystData.hold}`}
              />
            )}
            {stock.analystData.sell > 0 && (
              <div
                className="bg-orange-400"
                style={{ width: `${(stock.analystData.sell / stock.analystData.total) * 100}%` }}
                title={`Sell: ${stock.analystData.sell}`}
              />
            )}
            {stock.analystData.strongSell > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(stock.analystData.strongSell / stock.analystData.total) * 100}%` }}
                title={`Strong Sell: ${stock.analystData.strongSell}`}
              />
            )}
          </div>

          {/* Rating Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> {t('strongBuy')}: {stock.analystData.strongBuy}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> {t('buy')}: {stock.analystData.buy}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> {t('hold')}: {stock.analystData.hold}
            </span>
            {(stock.analystData.sell > 0 || stock.analystData.strongSell > 0) && (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400" /> {t('sell')}: {stock.analystData.sell}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> {t('strongSell')}: {stock.analystData.strongSell}
                </span>
              </>
            )}
          </div>

          {/* Price Target */}
          {stock.analystData.targetMean && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
              <span className="text-gray-400 text-sm">{t('avgPriceTarget')}</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">
                  {formatCurrency(stock.analystData.targetMean)}
                </span>
                {stock.price && (
                  <span className={`text-sm font-medium ${
                    stock.analystData.targetMean > stock.price ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ({stock.analystData.targetMean > stock.price ? '+' : ''}
                    {(((stock.analystData.targetMean - stock.price) / stock.price) * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== MIDDLE SECTION: The Battle Plan (Visual) ========== */}
      <div className="p-5 bg-gray-900/50">
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">
          {t('riskRewardPlan')}
        </p>

        {/* Visual Risk/Reward Display */}
        <div className="relative">
          {/* Vertical Line */}
          <div className={`absolute ${isRTL ? 'right-6' : 'left-6'} top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-blue-500 to-green-500`} />

          {/* Stop Loss */}
          <div className="flex items-center gap-4 mb-4 relative">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center z-10">
              <span className="text-lg">🔻</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('stopLoss')}</p>
              <p className="text-xl font-bold text-red-400">{formatCurrency(battlePlan.stopLoss.price)}</p>
              <p className="text-sm text-red-500/70">{t('risk')}: -{riskPercent}%</p>
            </div>
          </div>

          {/* Entry (Current Price) */}
          <div className="flex items-center gap-4 mb-4 relative">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center z-10">
              <span className="text-lg">🔵</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('entryPrice')}</p>
              <p className="text-xl font-bold text-blue-400">{formatCurrency(stock.price)}</p>
              <p className="text-sm text-blue-500/70">{t('currentMarketPrice')}</p>
            </div>
          </div>

          {/* Target */}
          <div className="flex items-center gap-4 relative">
            <div className="w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center z-10">
              <span className="text-lg">✅</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('target')}</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(battlePlan.profitTarget.price)}</p>
              <p className="text-sm text-green-500/70">{t('reward')}: +{rewardPercent}%</p>
            </div>
          </div>
        </div>

        {/* Risk/Reward Ratio */}
        <div className="mt-5 pt-4 border-t border-gray-700 flex items-center justify-between">
          <span className="text-gray-400 text-sm">{t('riskRewardRatio')}</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-purple-400">1:{battlePlan.riskReward.ratio}</span>
            {battlePlan.riskReward.ratio >= 2 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                {t('good')}
              </span>
            )}
          </div>
        </div>

        {/* Volatility-Based Strategy Info */}
        {battlePlan.strategy && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs uppercase tracking-wide">{t('strategyBasis')}</span>
              {battlePlan.strategy.volatilityBased ? (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-md font-medium flex items-center gap-1">
                    <span>📊</span> {t('atrBased')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {t('volatility')}: {battlePlan.strategy.volatilityPercent?.toFixed(1)}%
                  </span>
                </div>
              ) : (
                <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md font-medium">
                  {t('fixedPercent')}
                </span>
              )}
            </div>
            {battlePlan.strategy.volatilityBased && battlePlan.strategy.atr && (
              <p className="text-xs text-gray-500 mt-2">
                {t('atrExplanation')} (${battlePlan.strategy.atr.toFixed(2)}) × 1.5 {t('riskMultiplier')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ========== BOTTOM SECTION: Analysis (Collapsible) ========== */}
      <div className="border-t border-gray-700">
        <button
          onClick={() => setAnalysisOpen(!analysisOpen)}
          className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
        >
          <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <span>🧐</span> {t('analysis')}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${analysisOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Content */}
        <div className={`overflow-hidden transition-all duration-300 ${analysisOpen ? 'max-h-[1200px] overflow-y-auto' : 'max-h-0'}`}>
          <div className="px-5 pb-5 space-y-4">
            {/* Trend */}
            <div className="py-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm font-medium">{t('trendDirection')}</span>
                <span className={`text-sm font-medium ${trendStatus.color} flex items-center gap-2`}>
                  <span>{trendStatus.icon}</span>
                  {trendStatus.text}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {filterResults?.trendFilter ? t('trendUpExplanation') : t('trendDownExplanation')}
              </p>
            </div>

            {/* Momentum */}
            <div className="py-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm font-medium">{t('momentumRSI')}</span>
                <span className={`text-sm font-medium ${momentumStatus.color} flex items-center gap-2`}>
                  <span>{momentumStatus.icon}</span>
                  {momentumStatus.text}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {stock.rsi !== null
                  ? stock.rsi >= 70
                    ? `RSI ${stock.rsi} ${t('momentumOverboughtExplanation')}`
                    : stock.rsi >= 50
                      ? `RSI ${stock.rsi} ${t('momentumBullishExplanation')}`
                      : `RSI ${stock.rsi} ${t('momentumWeakExplanation')}`
                  : t('momentumUnknownExplanation')}
              </p>
            </div>

            {/* Volume */}
            <div className="py-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm font-medium">{t('volumeActivity')}</span>
                <span className={`text-sm font-medium ${volumeStatus.color} flex items-center gap-2`}>
                  <span>{volumeStatus.icon}</span>
                  {volumeStatus.text} ({(stock.volumeRatio * 100).toFixed(0)}%)
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {filterResults?.volumeFilter
                  ? `${(stock.volumeRatio * 100).toFixed(0)}% ${t('volumeStrongExplanation')}`
                  : `${(stock.volumeRatio * 100).toFixed(0)}% ${t('volumeLowExplanation')}`}
              </p>
            </div>

            {/* Volatility */}
            <div className="py-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm font-medium">{t('volatilityATR')}</span>
                {battlePlan.strategy?.volatilityBased ? (
                  <span className="text-sm font-medium text-cyan-400 flex items-center gap-2">
                    <span>📊</span>
                    {battlePlan.strategy.volatilityPercent?.toFixed(1)}% {t('dailyRange')}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <span>❓</span>
                    N/A
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {battlePlan.strategy?.volatilityBased
                  ? `${t('volatilityExplanation')} ${battlePlan.strategy.volatilityPercent?.toFixed(1)}% ${t('volatilityExplanation2')} ($${battlePlan.strategy.atr?.toFixed(2)}) ${t('volatilityExplanation3')}`
                  : t('volatilityNA')}
              </p>
            </div>

            {/* Data Quality */}
            <div className="py-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-sm font-medium">{t('dataQuality')}</span>
                <span className={`text-sm font-medium ${stock.hasRealData ? 'text-green-400' : 'text-yellow-400'} flex items-center gap-2`}>
                  <span>{stock.hasRealData ? '✅' : '⚠️'}</span>
                  {stock.hasRealData ? t('realMarketData') : t('limitedData')}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {stock.hasRealData
                  ? `${stock.dataPoints || ''} ${t('dataQualityGoodExplanation')}`
                  : t('dataQualityBadExplanation')}
              </p>
            </div>

            {/* AI Reasoning - Expanded */}
            <div className="mt-4 p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🤖</span>
                <p className="text-sm font-semibold text-white">{t('aiAnalysisSummary')}</p>
              </div>

              {/* Main Reasoning */}
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {battlePlan.reasoning}
              </p>

              {/* Detailed Breakdown */}
              <div className="space-y-2 pt-3 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('decisionFactors')}</p>
                {battlePlan.whyFactors?.map((factor, index) => (
                  <p key={index} className="text-xs text-gray-400 leading-relaxed pl-2 border-l-2 border-gray-700">
                    {factor}
                  </p>
                ))}
              </div>

              {/* Confidence Score */}
              <div className="mt-4 pt-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t('confidenceScore')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          battlePlan.confidenceScore >= 70 ? 'bg-green-500' :
                          battlePlan.confidenceScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(battlePlan.confidenceScore, 100)}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${
                      battlePlan.confidenceScore >= 70 ? 'text-green-400' :
                      battlePlan.confidenceScore >= 45 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {battlePlan.confidenceScore}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {battlePlan.confidenceScore >= 70
                    ? t('confidenceHigh')
                    : battlePlan.confidenceScore >= 45
                      ? t('confidenceMedium')
                      : t('confidenceLow')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== ACTION BUTTON ========== */}
      <div className="p-5 bg-gray-900/30 border-t border-gray-700">
        {battlePlan.verdict === 'BUY_NOW' ? (
          <button
            onClick={() => onTradePlan(stock)}
            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <span className="text-xl">📈</span>
            {t('tradeThisPlan')}
          </button>
        ) : battlePlan.verdict === 'AVOID' ? (
          <button
            disabled
            className="w-full py-4 rounded-xl font-bold text-lg bg-gray-700 text-gray-400 cursor-not-allowed flex items-center justify-center gap-3"
          >
            <span className="text-xl">🛑</span>
            {t('notRecommended')}
          </button>
        ) : (
          <button
            onClick={() => onTradePlan(stock)}
            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg shadow-yellow-500/25 transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <span className="text-xl">👀</span>
            {t('reviewAnyway')}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN SCANNER COMPONENT
// ==========================================
export default function Scanner({
  data,
  loading,
  error,
  onRefresh,
  onTradeComplete,
  cash,
  ownedSymbols,
}: ScannerProps) {
  const { t, isRTL } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'buy_now' | 'watch' | 'avoid'>('all');
  const [selectedStock, setSelectedStock] = useState<StockAnalysis | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);

  // Handle trade action
  const handleTradePlan = (stock: StockAnalysis) => {
    setSelectedStock(stock);
  };

  // Handle successful trade
  const handleTradeSuccess = () => {
    if (selectedStock) {
      setTradeSuccess(`${t('orderSubmittedFor')} ${selectedStock.symbol}!`);
      setSelectedStock(null);
      onTradeComplete();
      setTimeout(() => setTradeSuccess(null), 5000);
    }
  };

  // Filter data based on selection and limit to top 30
  const MAX_DISPLAY = 30;
  const allFilteredData = data.filter(stock => {
    if (filter === 'buy_now') return stock.battlePlan.verdict === 'BUY_NOW';
    if (filter === 'watch') return stock.battlePlan.verdict === 'WAIT_FOR_DIP' || stock.battlePlan.verdict === 'WATCH';
    if (filter === 'avoid') return stock.battlePlan.verdict === 'AVOID';
    return true;
  });
  const filteredData = allFilteredData.slice(0, MAX_DISPLAY);
  const totalScanned = data.length;
  const totalInCategory = allFilteredData.length;

  // Count by verdict
  const buyNowCount = data.filter(s => s.battlePlan.verdict === 'BUY_NOW').length;
  const watchCount = data.filter(s => s.battlePlan.verdict === 'WAIT_FOR_DIP' || s.battlePlan.verdict === 'WATCH').length;
  const avoidCount = data.filter(s => s.battlePlan.verdict === 'AVOID').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>🎯</span> {t('scannerTitle')}
          </h1>
          <p className="text-gray-400 mt-1">
            {t('scannerSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {t('cashLabel')}: <span className="text-green-400 font-semibold">{formatCurrency(cash)}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              loading
                ? 'bg-blue-900/50 text-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
            }`}
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? t('scanning') : t('refreshBtn')}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {tradeSuccess && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-green-400 font-medium">{t('tradeSubmitted')}</p>
            <p className="text-green-300 text-sm">{tradeSuccess}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-white text-gray-900 shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {t('filterAll')} ({data.length})
        </button>
        <button
          onClick={() => setFilter('buy_now')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            filter === 'buy_now'
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-400" />
          {t('filterBuyNow')} ({buyNowCount})
        </button>
        <button
          onClick={() => setFilter('watch')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            filter === 'watch'
              ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          {t('filterWatch')} ({watchCount})
        </button>
        <button
          onClick={() => setFilter('avoid')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
            filter === 'avoid'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400" />
          {t('filterAvoid')} ({avoidCount})
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          <p className="font-medium">{t('somethingWentWrong')}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-xl font-medium text-white">{t('analyzingMarket')}</p>
          <p className="text-gray-500 mt-2">{t('pacingRequests')}</p>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600">{t('fetchingRealTime')}</span>
          </div>
        </div>
      )}

      {/* Partial Loading */}
      {loading && data.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-blue-400 font-medium">{t('stillScanning')}</p>
            <p className="text-blue-300/70 text-sm">{data.length} {t('stocksAnalyzed')}</p>
          </div>
        </div>
      )}

      {/* Trade Cards Grid */}
      {filteredData.length > 0 && (
        <>
        {/* Display count info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-400">
            {isRTL
              ? `מציג ${filteredData.length} המניות הטובות ביותר מתוך ${totalScanned} שנסרקו`
              : `Showing top ${filteredData.length} of ${totalScanned} stocks scanned`
            }
            {totalInCategory > MAX_DISPLAY && (
              <span className="text-blue-400 mx-1">
                ({totalInCategory} {isRTL ? 'בקטגוריה זו' : 'in this category'})
              </span>
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredData.map((stock) => (
            <SmartTradeCard
              key={stock.symbol}
              stock={stock}
              onTradePlan={handleTradePlan}
              isOwned={ownedSymbols.includes(stock.symbol)}
            />
          ))}
        </div>
        </>
      )}

      {/* Empty State */}
      {!loading && filteredData.length === 0 && data.length > 0 && (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl">
          <div className="text-6xl mb-4">
            {filter === 'buy_now' ? '🎯' : filter === 'watch' ? '👀' : filter === 'avoid' ? '🛑' : '📭'}
          </div>
          <p className="text-xl text-gray-400">{t('noStocksInCategory')}</p>
          <p className="text-gray-500 mt-2">{t('tryDifferentFilter')}</p>
        </div>
      )}

      {/* No Data State */}
      {!loading && data.length === 0 && (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-gray-400">{t('noMarketData')}</p>
          <p className="text-gray-500 mt-2">{t('clickRefreshToScan')}</p>
        </div>
      )}

      {/* Order Editor Modal */}
      {selectedStock && (
        <OrderEditor
          stock={selectedStock}
          cash={cash}
          onClose={() => setSelectedStock(null)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </div>
  );
}
