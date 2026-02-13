import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';
import { useStockAnalysis } from '../hooks/useApi';
import type { StockAnalysis } from '../types';

interface AnalysisModalProps {
  symbol: string;
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

export default function AnalysisModal({ symbol, onClose }: AnalysisModalProps) {
  const { t, isRTL } = useLanguage();
  const { analyze, loading, error } = useStockAnalysis();
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      const result = await analyze(symbol);
      if (result) {
        setAnalysis(result);
      }
    };
    fetchAnalysis();
  }, [symbol, analyze]);

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'BUY_NOW':
        return { bg: 'bg-green-500/20', text: 'text-green-400', label: isRTL ? 'קנה עכשיו' : 'Buy Now' };
      case 'WAIT_FOR_DIP':
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: isRTL ? 'המתן לירידה' : 'Wait for Dip' };
      case 'WATCH':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: isRTL ? 'צפה' : 'Watch' };
      case 'AVOID':
        return { bg: 'bg-red-500/20', text: 'text-red-400', label: isRTL ? 'הימנע' : 'Avoid' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: verdict };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <h2 className="text-xl font-bold text-white">{symbol}</h2>
              <p className="text-sm text-gray-400">
                {isRTL ? 'ניתוח מעודכן' : 'Updated Analysis'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
              <p className="text-gray-400">{isRTL ? 'מנתח...' : 'Analyzing...'}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
              <p className="font-medium">{isRTL ? 'שגיאה' : 'Error'}</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-6">
              {/* Verdict Banner */}
              {(() => {
                const badge = getVerdictBadge(analysis.battlePlan.verdict);
                return (
                  <div className={`${badge.bg} border ${badge.text.replace('text-', 'border-')}/30 rounded-xl p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-white font-medium">
                          {isRTL ? 'ביטחון' : 'Confidence'}: {analysis.battlePlan.confidenceScore}%
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-xl">{formatCurrency(analysis.price)}</p>
                        <p className={`text-sm ${analysis.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(analysis.changePercent)}
                        </p>
                      </div>
                    </div>
                    {analysis.battlePlan.reasoning && (
                      <p className="mt-3 text-gray-300 text-sm">{analysis.battlePlan.reasoning}</p>
                    )}
                  </div>
                );
              })()}

              {/* Trading Plan */}
              <div className="grid grid-cols-3 gap-4">
                {/* Entry Zone */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                    <span>🎯</span> {isRTL ? 'טווח כניסה' : 'Entry Zone'}
                  </p>
                  <p className="text-white font-semibold">
                    {formatCurrency(analysis.battlePlan.entryZone.low)} - {formatCurrency(analysis.battlePlan.entryZone.high)}
                  </p>
                </div>

                {/* Stop Loss */}
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
                    <span>🛑</span> {isRTL ? 'סטופ לוס' : 'Stop Loss'}
                  </p>
                  <p className="text-red-400 font-semibold">{formatCurrency(analysis.battlePlan.stopLoss.price)}</p>
                  <p className="text-red-500/70 text-xs">-{analysis.battlePlan.stopLoss.percentage.toFixed(1)}%</p>
                </div>

                {/* Take Profit */}
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <p className="text-green-400 text-xs mb-2 flex items-center gap-1">
                    <span>💰</span> {isRTL ? 'יעד רווח' : 'Take Profit'}
                  </p>
                  <p className="text-green-400 font-semibold">{formatCurrency(analysis.battlePlan.profitTarget.price)}</p>
                  <p className="text-green-500/70 text-xs">+{analysis.battlePlan.profitTarget.percentage.toFixed(1)}%</p>
                </div>
              </div>

              {/* Technical Indicators */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <span>📊</span> {isRTL ? 'אינדיקטורים טכניים' : 'Technical Indicators'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">RSI</p>
                    <p className={`font-semibold ${
                      analysis.rsi && analysis.rsi >= 70 ? 'text-red-400' :
                      analysis.rsi && analysis.rsi >= 50 ? 'text-green-400' :
                      analysis.rsi && analysis.rsi >= 30 ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {analysis.rsi?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">SMA 20</p>
                    <p className="text-gray-300 font-semibold">
                      {analysis.sma20 ? formatCurrency(analysis.sma20) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">SMA 50</p>
                    <p className="text-gray-300 font-semibold">
                      {analysis.sma50 ? formatCurrency(analysis.sma50) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">{isRTL ? 'יחס סיכון/סיכוי' : 'Risk/Reward'}</p>
                    <p className={`font-bold ${
                      analysis.battlePlan.riskReward.ratio >= 2 ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      1:{analysis.battlePlan.riskReward.ratio}
                    </p>
                  </div>
                </div>
              </div>

              {/* Why Factors */}
              {analysis.battlePlan.whyFactors && analysis.battlePlan.whyFactors.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <span>💡</span> {isRTL ? 'סיבות' : 'Why Factors'}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.battlePlan.whyFactors.map((factor, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {analysis.battlePlan.warnings && analysis.battlePlan.warnings.length > 0 && (
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <span>⚠️</span> {isRTL ? 'אזהרות' : 'Warnings'}
                  </h4>
                  <ul className="space-y-2">
                    {analysis.battlePlan.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-amber-300/80 flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Analyst Data */}
              {analysis.analystData && analysis.analystData.total > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <span>🏦</span> {isRTL ? 'דירוג אנליסטים' : 'Analyst Ratings'}
                  </h4>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      analysis.analystData.consensus === 'Strong Buy' ? 'bg-green-500/20 text-green-400' :
                      analysis.analystData.consensus === 'Buy' ? 'bg-green-500/15 text-green-300' :
                      analysis.analystData.consensus === 'Hold' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {analysis.analystData.consensus}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {analysis.analystData.total} {isRTL ? 'אנליסטים' : 'analysts'}
                    </span>
                    {analysis.analystData.targetMean && (
                      <span className="text-gray-400 text-sm">
                        {isRTL ? 'יעד:' : 'Target:'} {formatCurrency(analysis.analystData.targetMean)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
          >
            {isRTL ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
