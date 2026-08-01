import type { Trade } from '../types';
import { useLanguage } from '../i18n';

interface TradeDetailModalProps {
  sellTrade: Trade;
  buyTrade: Trade | null;
  onClose: () => void;
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

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getHoldingDays(buyDate: string, sellDate: string): number {
  const buy = new Date(buyDate).getTime();
  const sell = new Date(sellDate).getTime();
  return Math.max(1, Math.round((sell - buy) / (1000 * 60 * 60 * 24)));
}

export default function TradeDetailModal({ sellTrade, buyTrade, onClose }: TradeDetailModalProps) {
  const { t, isRTL } = useLanguage();

  // `realized_pl` is the legacy field from automatic exits recorded before the
  // price monitor shared the money math; those trades carry no fee breakdown.
  const grossPL = sellTrade.grossPL ?? sellTrade.realized_pl ?? 0;
  const commission = sellTrade.commission ?? 0;
  const taxAmount = sellTrade.taxAmount ?? 0;
  const netPL = sellTrade.netRealizedPL ?? (grossPL - commission - taxAmount);
  const isLegacyExit = sellTrade.grossPL === undefined && sellTrade.realized_pl !== undefined;
  const costBasis = buyTrade ? buyTrade.price * sellTrade.shares : sellTrade.total - grossPL;
  const grossPLPercent = costBasis > 0 ? (grossPL / costBasis) * 100 : 0;
  const netPLPercent = costBasis > 0 ? (netPL / costBasis) * 100 : 0;

  const isProfit = netPL > 0;
  const isLoss = netPL < 0;

  const holdingDays = buyTrade ? getHoldingDays(buyTrade.executed_at, sellTrade.executed_at) : null;

  let planAccuracy = '';
  let planAccuracyColor = 'text-gray-400';
  let planAccuracyIcon = '';

  if (buyTrade?.take_profit && buyTrade?.stop_loss) {
    const tp = buyTrade.take_profit;
    const sl = buyTrade.stop_loss;
    const exitPrice = sellTrade.price;

    if (exitPrice >= tp) {
      planAccuracy = t('exitedAboveTP');
      planAccuracyColor = 'text-green-400';
      planAccuracyIcon = '🎯';
    } else if (exitPrice <= sl) {
      planAccuracy = t('exitedBelowSL');
      planAccuracyColor = 'text-red-400';
      planAccuracyIcon = '🛑';
    } else {
      planAccuracy = t('exitedBetween');
      planAccuracyColor = 'text-yellow-400';
      planAccuracyIcon = '↔️';
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700 ${isRTL ? 'rtl' : 'ltr'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b border-gray-700 ${isProfit ? 'bg-green-500/10' : isLoss ? 'bg-red-500/10' : 'bg-gray-700/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                isProfit ? 'bg-green-500/20' : isLoss ? 'bg-red-500/20' : 'bg-gray-600/20'
              }`}>
                {isProfit ? '📈' : isLoss ? '📉' : '➡️'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{sellTrade.symbol}</h2>
                <p className="text-sm text-gray-400">{t('tradeDetails')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className={`text-3xl font-bold ${isProfit ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-gray-400'}`}>
              {formatCurrency(netPL)}
            </p>
            <p className={`text-sm ${isProfit ? 'text-green-500' : isLoss ? 'text-red-500' : 'text-gray-500'}`}>
              {formatPercent(netPLPercent)} {t('netProfit')}
            </p>
            <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              isProfit ? 'bg-green-500/20 text-green-400' : isLoss ? 'bg-red-500/20 text-red-400' : 'bg-gray-600/20 text-gray-400'
            }`}>
              {isProfit ? t('profitTrade') : isLoss ? t('lossTrade') : t('breakEvenTrade')}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Buy & Sell comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">
              <p className="text-xs text-gray-500 mb-1">{t('buyPrice')}</p>
              <p className="text-white font-semibold">{buyTrade ? formatCurrency(buyTrade.price) : '—'}</p>
              {buyTrade
                ? <p className="text-xs text-gray-500 mt-1">{formatDate(buyTrade.executed_at)}</p>
                : <p className="text-xs text-gray-500 mt-1">{t('noMatchingBuy')}</p>}
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">
              <p className="text-xs text-gray-500 mb-1">{t('sellPrice')}</p>
              <p className="text-white font-semibold">{formatCurrency(sellTrade.price)}</p>
              <p className="text-xs text-gray-500 mt-1">{formatDate(sellTrade.executed_at)}</p>
            </div>
          </div>

          {holdingDays !== null && (
            <div className="flex items-center justify-between bg-gray-900/50 rounded-xl p-3 border border-gray-700/50">
              <span className="text-gray-400 text-sm">{t('holdingDays')}</span>
              <span className="text-white font-medium">{holdingDays} {t('days')}</span>
            </div>
          )}

          {/* P&L Breakdown */}
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">{t('shares')}</span>
              <span className="text-white">{sellTrade.shares}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">{t('costBasis')}</span>
              <span className="text-white">{formatCurrency(costBasis)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">{t('totalProceeds')}</span>
              <span className="text-white">{formatCurrency(sellTrade.total)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{t('grossProfit')}</span>
                <span className={grossPL >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(grossPL)} ({formatPercent(grossPLPercent)})
                </span>
              </div>
            </div>
            {isLegacyExit ? (
              <p className="text-xs text-yellow-500/80">{t('legacyExitNoFees')}</p>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('commissionFee')}</span>
                <span className="text-red-400/70">-{formatCurrency(commission)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t('taxPaid')}</span>
                <span className="text-red-400/70">-{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-2">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-white">{t('netProfit')}</span>
                <span className={netPL >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(netPL)}
                </span>
              </div>
            </div>
          </div>

          {/* Plan Accuracy */}
          {buyTrade?.take_profit && buyTrade?.stop_loss && (
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50 space-y-3">
              <h3 className="text-white font-medium text-sm">{t('planAccuracy')}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">{t('plannedTP')}</p>
                  <p className="text-green-400">{formatCurrency(buyTrade.take_profit)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">{t('plannedSL')}</p>
                  <p className="text-red-400">{formatCurrency(buyTrade.stop_loss)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">{t('actualExit')}</span>
                <span className="text-white font-medium">{formatCurrency(sellTrade.price)}</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                planAccuracyColor.includes('green') ? 'bg-green-500/10' :
                planAccuracyColor.includes('red') ? 'bg-red-500/10' : 'bg-yellow-500/10'
              }`}>
                <span>{planAccuracyIcon}</span>
                <span className={`text-sm font-medium ${planAccuracyColor}`}>{planAccuracy}</span>
              </div>
            </div>
          )}

          <a
            href={`https://www.tradingview.com/chart/?symbol=${sellTrade.symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {isRTL ? 'TradingView-ב הצג' : `View ${sellTrade.symbol} on TradingView`}
          </a>
        </div>
      </div>
    </div>
  );
}
