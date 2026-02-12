import { useState } from 'react';
import type { Portfolio as PortfolioType, Holding } from '../types';
import { useLanguage } from '../i18n';
import SellModal from './SellModal';

interface PortfolioProps {
  data: PortfolioType | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onReset: () => void;
  onTradeComplete: () => void;
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

// Holding Card Component
function HoldingCard({
  holding,
  onSell,
}: {
  holding: Holding;
  onSell: () => void;
}) {
  const { t } = useLanguage();
  const isProfit = holding.unrealizedPL >= 0;

  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">{holding.symbol}</h3>
            <a
              href={`https://www.tradingview.com/chart/?symbol=${holding.symbol}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-400 transition-colors"
              title={t('verifyOnTradingView')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <p className="text-gray-400 text-sm">{holding.name || holding.symbol}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">{formatCurrency(holding.marketValue)}</p>
          <p className="text-xs text-gray-500">{t('currentValue')}</p>
        </div>
      </div>

      {/* P&L Display */}
      <div className={`rounded-xl p-4 mb-4 ${isProfit ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">
              {isProfit ? t('makingMoney') : t('currentlyDown')}
            </p>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(holding.unrealizedPL)}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${isProfit ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            {formatPercent(holding.unrealizedPLPercent)}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-gray-500 text-xs">{t('sharesOwned')}</p>
          <p className="text-white font-semibold">{holding.shares}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-gray-500 text-xs">{t('youPaid')}</p>
          <p className="text-white font-semibold">{formatCurrency(holding.avg_cost)}{t('perShare')}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3">
          <p className="text-gray-500 text-xs">{t('nowWorth')}</p>
          <p className="text-white font-semibold">{formatCurrency(holding.currentPrice)}{t('perShare')}</p>
        </div>
      </div>

      {/* Today's change */}
      {holding.changePercent !== undefined && (
        <p className={`text-sm mb-4 ${holding.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {t('today')}: {formatPercent(holding.changePercent)}
        </p>
      )}

      {/* Auto-Exit Targets (TP/SL) */}
      {(holding.take_profit || holding.stop_loss) && (
        <div className="bg-gray-900/50 rounded-lg p-3 mb-4 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-400">🤖</span>
            <span className="text-xs text-amber-400 font-medium">{t('autoMonitored')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {holding.take_profit && (
              <div className="flex items-center gap-2">
                <span className="text-green-400">🎯</span>
                <span className="text-gray-400">{t('targetTP')}:</span>
                <span className="text-green-400 font-medium">${holding.take_profit.toFixed(2)}</span>
              </div>
            )}
            {holding.stop_loss && (
              <div className="flex items-center gap-2">
                <span className="text-red-400">🛑</span>
                <span className="text-gray-400">{t('targetSL')}:</span>
                <span className="text-red-400 font-medium">${holding.stop_loss.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onSell}
        className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium rounded-xl transition-colors border border-red-500/20"
      >
        {t('sellShares')}
      </button>
    </div>
  );
}

export default function Portfolio({
  data,
  loading,
  error,
  onRefresh,
  onReset,
  onTradeComplete,
}: PortfolioProps) {
  const { t, isRTL } = useLanguage();
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-gray-400">{t('loadingPortfolio')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
        <p className="font-medium">{t('somethingWentWrong')}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalReturn = data.totalEquity - 100000;
  const totalReturnPercent = (totalReturn / 100000) * 100;
  const isOverallProfit = totalReturn >= 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-purple-500/20">
        <h2 className="text-2xl font-bold text-white mb-2">
          💼 {t('portfolioTitle')}
        </h2>
        <p className="text-gray-300">
          {t('portfolioSubtitle')}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Value Card */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2">{t('totalPortfolioValue')}</p>
          <p className="text-4xl font-bold text-white mb-2">{formatCurrency(data.totalEquity)}</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${isOverallProfit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className="font-semibold">{formatCurrency(totalReturn)}</span>
            <span>({formatPercent(totalReturnPercent)})</span>
            <span>{isOverallProfit ? '📈' : '📉'}</span>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            {t('startedWith')}
          </p>
        </div>

        {/* Breakdown Card */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <p className="text-gray-400 text-sm mb-4">{t('portfolioBreakdown')}</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💵</span>
                <span className="text-gray-300">{t('cashAvailable')}</span>
              </div>
              <span className="text-white font-semibold">{formatCurrency(data.cash)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <span className="text-gray-300">{t('investedInStocks')}</span>
              </div>
              <span className="text-white font-semibold">{formatCurrency(data.totalMarketValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{data.totalUnrealizedPL >= 0 ? '✨' : '😅'}</span>
                <span className="text-gray-300">{t('unrealizedPL')}</span>
              </div>
              <span className={`font-semibold ${data.totalUnrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(data.totalUnrealizedPL)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{t('yourHoldings')} ({data.holdings.length})</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
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
            {t('updatePrices')}
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors"
          >
            {t('startOver')}
          </button>
        </div>
      </div>

      {/* Holdings Grid */}
      {data.holdings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.holdings.map((holding) => (
            <HoldingCard
              key={holding.symbol}
              holding={holding}
              onSell={() => setSelectedHolding(holding)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-white mb-2">{t('noInvestmentsYet')}</h3>
          <p className="text-gray-400 mb-4">
            {t('noInvestmentsDesc')}
          </p>
          <p className="text-sm text-gray-500">
            {formatCurrency(data.cash)} {t('waitingToBeInvested')}
          </p>
        </div>
      )}

      {/* Learning Section */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <span>📚</span> {t('understandingPL')}
        </h3>
        <div className="text-gray-400 text-sm space-y-2">
          <p>
            <strong className="text-gray-200">{t('unrealizedPL')}:</strong> {t('unrealizedPLExplanation')}
          </p>
          <p>
            <strong className="text-gray-200">{isRTL ? 'רווח/הפסד ממומש' : 'Realized P&L'}:</strong> {t('realizedPLExplanation')}
          </p>
        </div>
      </div>

      {/* Sell Modal */}
      {selectedHolding && (
        <SellModal
          holding={selectedHolding}
          onClose={() => setSelectedHolding(null)}
          onSuccess={() => {
            setSelectedHolding(null);
            onTradeComplete();
          }}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-xl font-bold text-white mb-2">{t('startOverQuestion')}</h3>
              <p className="text-gray-400">
                {t('resetDescription')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
              >
                {t('keepTrading')}
              </button>
              <button
                onClick={() => {
                  onReset();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl transition-colors"
              >
                {t('startFresh')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
