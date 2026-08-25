import { useState } from 'react';
import type { Trade } from '../types';
import { useLanguage } from '../i18n';
import TradeDetailModal from './TradeDetailModal';

interface TradeHistoryProps {
  trades: Trade[];
  loading: boolean;
  onRefresh: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Find the most recent BUY trade for a given SELL trade's symbol that happened before the sell */
function findMatchingBuy(sellTrade: Trade, allTrades: Trade[]): Trade | null {
  return allTrades.find(
    t => t.action === 'BUY' &&
         t.symbol === sellTrade.symbol &&
         new Date(t.executed_at) < new Date(sellTrade.executed_at)
  ) || null;
}

function TradeCard({ trade, onClick }: { trade: Trade; onClick?: () => void }) {
  const { t } = useLanguage();
  const isBuy = trade.action === 'BUY';
  const isSell = trade.action === 'SELL';
  const netPL = trade.netRealizedPL;

  return (
    <div
      className={`bg-gray-800 rounded-xl p-4 border border-gray-700 ${isSell ? 'cursor-pointer hover:border-gray-500 hover:bg-gray-750 transition-colors' : ''}`}
      onClick={isSell ? onClick : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
            isBuy ? 'bg-green-500/20' : 'bg-red-500/20'
          }`}>
            {isBuy ? '📈' : '📉'}
          </div>
          <div>
            <p className="font-semibold text-white">{trade.symbol}</p>
            <p className="text-xs text-gray-500">{formatDate(trade.executed_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isBuy ? t('bought') : t('sold')}
          </div>
          {isSell && (
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">{t('shares')}</p>
          <p className="text-white font-medium">{trade.shares}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">{t('price')}</p>
          <p className="text-white font-medium">{formatCurrency(trade.price)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">{t('total')}</p>
          <p className={`font-semibold ${isBuy ? 'text-red-400' : 'text-green-400'}`}>
            {isBuy ? '-' : '+'}{formatCurrency(trade.total)}
          </p>
        </div>
      </div>

      {isBuy && trade.take_profit && trade.stop_loss && (
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          {t('planTakeProfitAt')} {formatCurrency(trade.take_profit)} {t('stopLossAt')} {formatCurrency(trade.stop_loss)}
        </div>
      )}

      {isSell && netPL !== undefined && (
        <div className={`mt-3 pt-3 border-t border-gray-700 flex items-center justify-between`}>
          <span className="text-xs text-gray-500">{t('netProfit')}</span>
          <span className={`text-sm font-semibold ${netPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netPL >= 0 ? '+' : ''}{formatCurrency(netPL)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function TradeHistory({ trades, loading, onRefresh }: TradeHistoryProps) {
  const { t } = useLanguage();
  const [selectedSellTrade, setSelectedSellTrade] = useState<Trade | null>(null);
  const recentTrades = trades.slice(0, 10);

  const matchingBuy = selectedSellTrade ? findMatchingBuy(selectedSellTrade, trades) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{t('tradeHistory')}</h2>
          <p className="text-sm text-gray-500">{t('recentPracticeTrades')}</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
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
        </button>
      </div>

      {recentTrades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentTrades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              onClick={trade.action === 'SELL' ? () => setSelectedSellTrade(trade) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-400">{t('noTradesYet')}</p>
          <p className="text-gray-500 text-sm mt-1">
            {t('tradesWillAppear')}
          </p>
        </div>
      )}

      {trades.length > 10 && (
        <p className="text-center text-gray-500 text-sm">
          {t('showingRecentTrades')} {trades.length} {t('totalTrades')}
        </p>
      )}

      {selectedSellTrade && (
        <TradeDetailModal
          sellTrade={selectedSellTrade}
          buyTrade={matchingBuy}
          onClose={() => setSelectedSellTrade(null)}
        />
      )}
    </div>
  );
}
