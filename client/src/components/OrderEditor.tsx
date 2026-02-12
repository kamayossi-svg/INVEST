import { useState, useEffect, useMemo } from 'react';
import type { StockAnalysis } from '../types';
import { useLanguage } from '../i18n';

const API_BASE = 'http://localhost:3001/api';

interface OrderEditorProps {
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

// Number input with +/- buttons
function NumberStepper({
  value,
  onChange,
  min,
  max,
  step,
  label,
  suffix,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  suffix?: string;
  disabled?: boolean;
}) {
  const handleDecrease = () => {
    const newValue = Math.max(min, value - step);
    onChange(parseFloat(newValue.toFixed(2)));
  };

  const handleIncrease = () => {
    const newValue = Math.min(max, value + step);
    onChange(parseFloat(newValue.toFixed(2)));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold text-xl transition-colors"
      >
        -
      </button>
      <div className="flex-1 text-center">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-xl font-bold text-white">
          {suffix === '$' ? formatCurrency(value) : value}
          {suffix && suffix !== '$' && <span className="text-gray-400 text-sm ml-1">{suffix}</span>}
        </p>
      </div>
      <button
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold text-xl transition-colors"
      >
        +
      </button>
    </div>
  );
}

// Slider component
function PriceSlider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  color,
  currentPrice,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  color: 'green' | 'red';
  currentPrice: number;
}) {
  const percentage = ((value - currentPrice) / currentPrice) * 100;
  const colorClasses = color === 'green'
    ? 'bg-green-500 accent-green-500'
    : 'bg-red-500 accent-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <div className="text-right">
          <span className={`text-lg font-bold ${color === 'green' ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(value)}
          </span>
          <span className={`text-sm ml-2 ${color === 'green' ? 'text-green-500' : 'text-red-500'}`}>
            ({percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${colorClasses}`}
        style={{
          background: `linear-gradient(to right, ${color === 'green' ? '#22c55e' : '#ef4444'} 0%, ${color === 'green' ? '#22c55e' : '#ef4444'} ${((value - min) / (max - min)) * 100}%, #374151 ${((value - min) / (max - min)) * 100}%, #374151 100%)`
        }}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
    </div>
  );
}

export default function OrderEditor({ stock, cash, onClose, onSuccess }: OrderEditorProps) {
  const { t, isRTL } = useLanguage();
  const { battlePlan } = stock;
  const currentPrice = stock.price;

  // Editable state
  const [quantity, setQuantity] = useState(battlePlan.suggestedPosition.shares);
  const [takeProfit, setTakeProfit] = useState(battlePlan.profitTarget.price);
  const [stopLoss, setStopLoss] = useState(battlePlan.stopLoss.price);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate max shares user can afford
  const maxAffordableShares = Math.floor(cash / currentPrice);

  // Price range limits
  const takeProfitMin = currentPrice * 1.01; // At least +1%
  const takeProfitMax = currentPrice * 1.25; // Up to +25%
  const stopLossMin = currentPrice * 0.75;   // Down to -25%
  const stopLossMax = currentPrice * 0.99;   // At least -1%

  // Real-time calculations
  const calculations = useMemo(() => {
    const totalInvestment = quantity * currentPrice;
    const profitPerShare = takeProfit - currentPrice;
    const lossPerShare = currentPrice - stopLoss;

    const potentialProfit = quantity * profitPerShare;
    const potentialLoss = quantity * lossPerShare;
    const riskRewardRatio = lossPerShare > 0 ? profitPerShare / lossPerShare : 0;

    const takeProfitPercent = ((takeProfit - currentPrice) / currentPrice) * 100;
    const stopLossPercent = ((currentPrice - stopLoss) / currentPrice) * 100;

    return {
      totalInvestment,
      profitPerShare,
      lossPerShare,
      potentialProfit,
      potentialLoss,
      riskRewardRatio,
      takeProfitPercent,
      stopLossPercent,
      canAfford: totalInvestment <= cash,
    };
  }, [quantity, currentPrice, takeProfit, stopLoss, cash]);

  // Handle order submission
  const handleSubmit = async () => {
    if (!calculations.canAfford) {
      setError(t('insufficientFunds'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/trade/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          shares: quantity,
          takeProfit: takeProfit,
          stopLoss: stopLoss,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || t('orderFailed'));
      }
    } catch (err) {
      setError(t('connectionError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Quick percentage buttons for take profit
  const takeProfitPresets = [5, 8, 10, 15];
  const stopLossPresets = [3, 4, 5, 7];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📝</span> {t('reviewTradePlan')}
              </h2>
              <p className="text-gray-400 text-sm mt-1">{t('customizeOrder')}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stock Info */}
        <div className="px-6 py-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{stock.symbol}</p>
              <p className="text-gray-400 text-sm">{stock.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{t('currentPrice')}</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(currentPrice)}</p>
              <p className={`text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}% {t('today')}
              </p>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="px-6 py-4 space-y-6">
          {/* Quantity */}
          <div className="bg-gray-900 rounded-xl p-4">
            <NumberStepper
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={maxAffordableShares}
              step={1}
              label={t('quantityShares')}
              suffix={t('shares')}
            />
            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-sm">
              <span className="text-gray-400">{t('totalInvestment')}</span>
              <span className={`font-bold ${calculations.canAfford ? 'text-white' : 'text-red-400'}`}>
                {formatCurrency(calculations.totalInvestment)}
              </span>
            </div>
            {!calculations.canAfford && (
              <p className="text-red-400 text-xs mt-2">
                {t('exceedsCash')} ({formatCurrency(cash)})
              </p>
            )}
          </div>

          {/* Entry Price (Read Only) */}
          <div className="bg-gray-900/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('entryPrice')}</p>
                <p className="text-xl font-bold text-white">{formatCurrency(currentPrice)}</p>
              </div>
              <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                {t('marketPriceLive')}
              </div>
            </div>
          </div>

          {/* Take Profit */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💰</span>
              <span className="text-white font-medium">{t('takeProfitTarget')}</span>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 mb-4">
              {takeProfitPresets.map((pct) => (
                <button
                  key={pct}
                  onClick={() => setTakeProfit(parseFloat((currentPrice * (1 + pct / 100)).toFixed(2)))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    Math.abs(calculations.takeProfitPercent - pct) < 0.5
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>

            <PriceSlider
              value={takeProfit}
              onChange={setTakeProfit}
              min={takeProfitMin}
              max={takeProfitMax}
              step={0.01}
              label={t('sellWhenReaches')}
              color="green"
              currentPrice={currentPrice}
            />
          </div>

          {/* Stop Loss */}
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🛡️</span>
              <span className="text-white font-medium">{t('stopLossProtection')}</span>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2 mb-4">
              {stopLossPresets.map((pct) => (
                <button
                  key={pct}
                  onClick={() => setStopLoss(parseFloat((currentPrice * (1 - pct / 100)).toFixed(2)))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    Math.abs(calculations.stopLossPercent - pct) < 0.5
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  -{pct}%
                </button>
              ))}
            </div>

            <PriceSlider
              value={stopLoss}
              onChange={setStopLoss}
              min={stopLossMin}
              max={stopLossMax}
              step={0.01}
              label={t('exitIfDrops')}
              color="red"
              currentPrice={currentPrice}
            />
          </div>

          {/* Real-Time Calculator */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span>📊</span> {t('orderSummary')}
            </h3>

            <div className="space-y-4">
              {/* Risk */}
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span className="text-gray-300">{t('ifStopLossHit')}</span>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold text-xl">
                    -{formatCurrency(calculations.potentialLoss)}
                  </p>
                  <p className="text-red-500/70 text-xs">
                    {formatCurrency(calculations.lossPerShare)}{t('perShare')}
                  </p>
                </div>
              </div>

              {/* Reward */}
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <span className="text-gray-300">{t('ifTakeProfitHit')}</span>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-xl">
                    +{formatCurrency(calculations.potentialProfit)}
                  </p>
                  <p className="text-green-500/70 text-xs">
                    {formatCurrency(calculations.profitPerShare)}{t('perShare')}
                  </p>
                </div>
              </div>

              {/* Risk/Reward Ratio */}
              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚖️</span>
                  <span className="text-gray-300">{t('riskRewardRatio')}:</span>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-xl ${
                    calculations.riskRewardRatio >= 2 ? 'text-green-400' :
                    calculations.riskRewardRatio >= 1 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    1:{calculations.riskRewardRatio.toFixed(1)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {calculations.riskRewardRatio >= 2 ? t('great') :
                     calculations.riskRewardRatio >= 1 ? t('okay') : t('risky')}
                  </p>
                </div>
              </div>
            </div>

            {/* Educational tip */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-gray-400 text-xs">
                <strong className="text-gray-300">{t('proTip')}</strong> {t('proTipText')}
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
              <span className="text-red-400">❌</span>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer with Submit */}
        <div className="px-6 py-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!calculations.canAfford || submitting}
              className={`flex-[2] py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3
                ${calculations.canAfford && !submitting
                  ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <span className="text-xl">🚀</span>
                  {t('submitOrder')}
                </>
              )}
            </button>
          </div>

          {/* Order summary line */}
          <p className="text-center text-gray-500 text-sm mt-3">
            {t('buy')} {quantity} {stock.symbol} @ {formatCurrency(currentPrice)} = {formatCurrency(calculations.totalInvestment)}
          </p>
        </div>
      </div>
    </div>
  );
}
