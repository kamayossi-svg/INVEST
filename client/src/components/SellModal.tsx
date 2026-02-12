import { useState, useEffect } from 'react';
import type { Holding } from '../types';
import { useTrading } from '../hooks/useApi';
import { useLanguage } from '../i18n';

interface SellModalProps {
  holding: Holding;
  onClose: () => void;
  onSuccess: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SellModal({ holding, onClose, onSuccess }: SellModalProps) {
  const { t } = useLanguage();
  const [shares, setShares] = useState<string>('');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const { sell, loading, error, getQuote } = useTrading();

  // Fetch fresh price when modal opens
  useEffect(() => {
    const fetchPrice = async () => {
      setFetchingPrice(true);
      setPriceError(null);
      const quote = await getQuote(holding.symbol);
      if (quote) {
        setLivePrice(quote.price);
      } else {
        setPriceError(t('unableToFetchPrice'));
      }
      setFetchingPrice(false);
    };
    fetchPrice();

    // Refresh price every 5 seconds
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [holding.symbol, getQuote, t]);

  const shareCount = parseFloat(shares) || 0;
  const currentPrice = livePrice ?? holding.currentPrice;
  const totalProceeds = shareCount * currentPrice;
  const costBasis = shareCount * holding.avg_cost;
  const realizedPL = totalProceeds - costBasis;
  const realizedPLPercent = (realizedPL / costBasis) * 100;
  const canSell = shareCount > 0 && shareCount <= holding.shares;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSell || loading) return;

    const result = await sell(holding.symbol, shareCount);
    if (result) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">{t('sellSymbol')} {holding.symbol}</h3>
            <p className="text-sm text-gray-400">{holding.name || holding.symbol}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Position Summary */}
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">{t('sharesOwned')}</p>
              <p className="text-white font-mono font-semibold">{holding.shares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400">{t('avgCost')}</p>
              <p className="text-white font-mono">{formatCurrency(holding.avg_cost)}</p>
            </div>
          </div>
        </div>

        {/* Live Price */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{t('liveMarketPrice')}</span>
            <div className="flex items-center space-x-2">
              {fetchingPrice && (
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              <span className="text-2xl font-bold text-white font-mono">
                {formatCurrency(currentPrice)}
              </span>
            </div>
          </div>
          {priceError && (
            <p className="text-sm text-red-400 mt-2">{priceError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {t('priceRefreshNote')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shares Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">{t('sharesToSell')}</label>
            <div className="relative">
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="0"
                min="1"
                max={holding.shares}
                step="1"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShares(holding.shares.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                ALL
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('available')} {holding.shares.toLocaleString()} {t('shares')}
            </p>
          </div>

          {/* Order Summary */}
          {shareCount > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-gray-400">
                <span>{t('totalProceeds')}</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(totalProceeds)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>{t('costBasis')}</span>
                <span className="font-mono text-gray-300">
                  {formatCurrency(costBasis)}
                </span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between">
                <span className="text-gray-400">{t('realizedPL')}</span>
                <div className="text-right">
                  <p className={`font-mono font-bold ${realizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(realizedPL)}
                  </p>
                  <p className={`text-xs ${realizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {realizedPL >= 0 ? '+' : ''}{realizedPLPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSell || loading || fetchingPrice}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t('executingOrder')}</span>
              </>
            ) : (
              <>
                <span>{t('sellSymbol')} {shareCount > 0 ? `${shareCount} ${t('shares')}` : t('sellNow')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
