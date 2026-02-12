import { useState, useEffect } from 'react';
import type { StockAnalysis } from '../types';
import { useTrading } from '../hooks/useApi';

interface BuyModalProps {
  stock: StockAnalysis;
  cash: number;
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

export default function BuyModal({ stock, cash, onClose, onSuccess }: BuyModalProps) {
  const [shares, setShares] = useState<string>('');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const { buy, loading, error, getQuote } = useTrading();

  // Fetch fresh price when modal opens
  useEffect(() => {
    const fetchPrice = async () => {
      setFetchingPrice(true);
      setPriceError(null);
      const quote = await getQuote(stock.symbol);
      if (quote) {
        setLivePrice(quote.price);
      } else {
        setPriceError('Could not get the latest price');
      }
      setFetchingPrice(false);
    };
    fetchPrice();

    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [stock.symbol, getQuote]);

  const shareCount = parseFloat(shares) || 0;
  const currentPrice = livePrice ?? stock.price;
  const totalCost = shareCount * currentPrice;
  const canAfford = totalCost <= cash && shareCount > 0;
  const maxShares = Math.floor(cash / currentPrice);

  const takeProfit = currentPrice * 1.07;
  const stopLoss = currentPrice * 0.97;
  const potentialProfit = shareCount * (takeProfit - currentPrice);
  const potentialLoss = shareCount * (currentPrice - stopLoss);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAfford || loading) return;

    const result = await buy(stock.symbol, shareCount);
    if (result) {
      onSuccess();
    }
  };

  // Quick amount buttons
  const quickAmounts = [
    { label: '$500', shares: Math.floor(500 / currentPrice) },
    { label: '$1,000', shares: Math.floor(1000 / currentPrice) },
    { label: '$5,000', shares: Math.floor(5000 / currentPrice) },
    { label: '10%', shares: Math.floor((cash * 0.1) / currentPrice) },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">Practice Buy</h3>
              <p className="text-gray-400 mt-1">Using virtual money - no real risk!</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stock Info */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-white">{stock.symbol}</h4>
                <p className="text-gray-400 text-sm">{stock.name}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {fetchingPrice && (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span className="text-2xl font-bold text-white">
                    {formatCurrency(currentPrice)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Live price (updates every 5s)</p>
              </div>
            </div>
          </div>

          {priceError && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm">
              {priceError} - Using last known price
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Shares Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                How many shares do you want to buy?
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="Enter number of shares"
                min="1"
                step="1"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-xl font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-sm text-gray-500 mt-2">
                You have {formatCurrency(cash)} available (max {maxShares.toLocaleString()} shares)
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Quick amounts:</p>
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => setShares(qa.shares.toString())}
                    disabled={qa.shares < 1}
                    className="py-2 px-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            {shareCount > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-white">Order Summary</h4>

                <div className="space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>{shareCount} shares × {formatCurrency(currentPrice)}</span>
                    <span className={`font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                  {!canAfford && (
                    <p className="text-red-400 text-sm">You don't have enough money for this</p>
                  )}
                </div>

                {/* Trading Plan Explanation */}
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm text-gray-400 mb-3">📋 Your Trading Plan</p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-xl">🎯</span>
                      <div className="flex-1">
                        <p className="text-green-400 font-medium text-sm">Take Profit at {formatCurrency(takeProfit)}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          If the price goes up 7%, sell and pocket {formatCurrency(potentialProfit)} profit!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <span className="text-xl">🛑</span>
                      <div className="flex-1">
                        <p className="text-red-400 font-medium text-sm">Stop Loss at {formatCurrency(stopLoss)}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          If it drops 3%, sell to limit your loss to {formatCurrency(potentialLoss)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    💡 Tip: This gives you a 2.3:1 reward-to-risk ratio. You risk losing $1 to potentially make $2.30!
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canAfford || loading || fetchingPrice}
                className="flex-1 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Buying...</span>
                  </>
                ) : (
                  <>
                    <span>💰</span>
                    <span>Buy {shareCount > 0 ? `${shareCount} Shares` : 'Now'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
