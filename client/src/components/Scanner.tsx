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

// Verdict styling configuration
const verdictStyles: Record<Verdict, { bg: string; text: string }> = {
  'BUY_NOW': { bg: 'bg-green-500/20', text: 'text-green-400' },
  'WAIT_FOR_DIP': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'WATCH': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'AVOID': { bg: 'bg-red-500/20', text: 'text-red-400' }
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
// MAIN SCANNER COMPONENT - TABLE LAYOUT
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

  // Table headers
  const headers = [
    { key: 'symbol', label: isRTL ? 'סימול' : 'Symbol' },
    { key: 'price', label: isRTL ? 'מחיר' : 'Price' },
    { key: 'change', label: isRTL ? 'שינוי' : 'Change' },
    { key: 'verdict', label: isRTL ? 'המלצה' : 'Verdict' },
    { key: 'confidence', label: isRTL ? 'ביטחון' : 'Confidence' },
    { key: 'analyst', label: isRTL ? 'אנליסטים' : 'Analysts' },
    { key: 'stopLoss', label: isRTL ? 'סטופ לוס' : 'Stop Loss' },
    { key: 'takeProfit', label: isRTL ? 'טייק פרופיט' : 'Take Profit' },
    { key: 'riskReward', label: isRTL ? 'סיכון/סיכוי' : 'R/R' },
    { key: 'action', label: isRTL ? 'פעולה' : 'Action' },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
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

      {/* Stock Table */}
      {filteredData.length > 0 && (
        <>
          {/* Display count info */}
          <div className="flex items-center justify-between">
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

          {/* Responsive Table Container */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                {/* Table Header */}
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header.key}
                        className={`px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                          isRTL ? 'text-right' : 'text-left'
                        }`}
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-gray-700/50">
                  {filteredData.map((stock) => {
                    const { battlePlan } = stock;
                    const badge = verdictStyles[battlePlan.verdict];
                    const verdictLabel = getVerdictLabel(battlePlan.verdict, t);
                    const isOwned = ownedSymbols.includes(stock.symbol);

                    // Analyst consensus color
                    const getAnalystColor = (consensus: string | undefined) => {
                      if (!consensus) return 'text-gray-500';
                      if (consensus === 'Strong Buy' || consensus === 'Buy') return 'text-green-400';
                      if (consensus === 'Hold') return 'text-yellow-400';
                      return 'text-red-400';
                    };

                    // Translate analyst consensus
                    const getAnalystLabel = (consensus: string | undefined) => {
                      if (!consensus) return '-';
                      if (isRTL) {
                        switch (consensus) {
                          case 'Strong Buy': return 'קניה חזקה';
                          case 'Buy': return 'קניה';
                          case 'Hold': return 'החזק';
                          case 'Sell': return 'מכירה';
                          case 'Strong Sell': return 'מכירה חזקה';
                          default: return consensus;
                        }
                      }
                      return consensus;
                    };

                    return (
                      <tr
                        key={stock.symbol}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        {/* Symbol */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-lg">{stock.symbol}</span>
                            {isOwned && (
                              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded border border-purple-500/30">
                                💼
                              </span>
                            )}
                            <a
                              href={`https://www.tradingview.com/chart/?symbol=${stock.symbol}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-500 hover:text-blue-400 transition-colors"
                              title={isRTL ? 'צפה בטריידינגויו' : 'View on TradingView'}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white">{formatCurrency(stock.price)}</span>
                        </td>

                        {/* Change % */}
                        <td className="px-4 py-3">
                          <span className={`font-medium ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </td>

                        {/* Verdict */}
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                            {verdictLabel}
                          </span>
                        </td>

                        {/* Confidence Score */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  battlePlan.confidenceScore >= 70 ? 'bg-green-500' :
                                  battlePlan.confidenceScore >= 45 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(battlePlan.confidenceScore, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-semibold ${
                              battlePlan.confidenceScore >= 70 ? 'text-green-400' :
                              battlePlan.confidenceScore >= 45 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {battlePlan.confidenceScore}%
                            </span>
                          </div>
                        </td>

                        {/* Analyst Rating */}
                        <td className="px-4 py-3">
                          <span className={`font-medium text-sm ${getAnalystColor(stock.analystData?.consensus)}`}>
                            {getAnalystLabel(stock.analystData?.consensus)}
                          </span>
                        </td>

                        {/* Stop Loss */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-red-400 font-medium">{formatCurrency(battlePlan.stopLoss.price)}</span>
                            <span className="text-red-500/70 text-xs">-{battlePlan.stopLoss.percentage.toFixed(1)}%</span>
                          </div>
                        </td>

                        {/* Take Profit */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-green-400 font-medium">{formatCurrency(battlePlan.profitTarget.price)}</span>
                            <span className="text-green-500/70 text-xs">+{battlePlan.profitTarget.percentage.toFixed(1)}%</span>
                          </div>
                        </td>

                        {/* Risk/Reward Ratio */}
                        <td className="px-4 py-3">
                          <span className={`font-bold ${
                            battlePlan.riskReward.ratio >= 2 ? 'text-purple-400' : 'text-gray-400'
                          }`}>
                            1:{battlePlan.riskReward.ratio}
                          </span>
                        </td>

                        {/* Action Button */}
                        <td className="px-4 py-3">
                          {battlePlan.verdict === 'BUY_NOW' ? (
                            <button
                              onClick={() => handleTradePlan(stock)}
                              className="px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 transition-all active:scale-95"
                            >
                              {isRTL ? 'קנה' : 'Buy'}
                            </button>
                          ) : battlePlan.verdict === 'AVOID' ? (
                            <button
                              disabled
                              className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-700 text-gray-500 cursor-not-allowed"
                            >
                              {isRTL ? 'הימנע' : 'Avoid'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTradePlan(stock)}
                              className="px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg shadow-yellow-500/25 transition-all active:scale-95"
                            >
                              {isRTL ? 'צפה' : 'View'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
