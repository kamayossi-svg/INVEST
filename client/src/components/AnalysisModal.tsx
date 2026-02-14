import { useState, useEffect } from 'react';
import { useStockAnalysis, useCompanyInfo, type CompanyInfo } from '../hooks/useApi';
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

// Format market cap in readable format (value is in millions from Finnhub)
function formatMarketCap(marketCapMillion: number): string {
  if (marketCapMillion >= 1000000) {
    return `$${(marketCapMillion / 1000000).toFixed(1)}T`;
  } else if (marketCapMillion >= 1000) {
    return `$${(marketCapMillion / 1000).toFixed(1)}B`;
  } else {
    return `$${marketCapMillion.toFixed(0)}M`;
  }
}

// Hebrew sector/industry names
const sectorToHebrew: Record<string, string> = {
  'Technology': 'טכנולוגיה',
  'Healthcare': 'בריאות',
  'Financial': 'פיננסים',
  'Financial Services': 'שירותים פיננסיים',
  'Consumer Cyclical': 'צריכה מחזורית',
  'Consumer Defensive': 'צריכה דפנסיבית',
  'Consumer': 'צריכה',
  'Communication Services': 'תקשורת',
  'Communication': 'תקשורת',
  'Industrials': 'תעשייה',
  'Energy': 'אנרגיה',
  'Utilities': 'תשתיות',
  'Real Estate': 'נדל"ן',
  'Materials': 'חומרי גלם',
  'Entertainment': 'בידור',
  // More specific industries
  'Software': 'תוכנה',
  'Semiconductors': 'מוליכים למחצה',
  'Biotechnology': 'ביוטכנולוגיה',
  'Pharmaceuticals': 'פרמצבטיקה',
  'Banks': 'בנקאות',
  'Insurance': 'ביטוח',
  'Retail': 'קמעונאות',
  'Automobiles': 'רכב',
  'Media': 'מדיה',
  'Telecommunications': 'טלקום',
};

function getHebrewSector(sector: string | null): string {
  if (!sector) return 'לא זמין';
  return sectorToHebrew[sector] || sector;
}

// Format news date
function formatNewsDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

// Tooltip component with info icon
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="cursor-help text-gray-500 hover:text-blue-400 transition-colors mr-1"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        ℹ️
      </span>
      {show && (
        <div className="absolute z-50 bottom-full right-0 mb-2 w-72 p-3 bg-gray-900 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-300 leading-relaxed">
          {text}
          <div className="absolute top-full right-4 border-8 border-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  );
}

// Hebrew educational explanations
const educationalTexts = {
  rsi: (value: number | null) => {
    if (value === null) return 'אין מספיק נתונים לחישוב RSI';
    if (value >= 70) return `RSI של ${value.toFixed(1)} מעיד על קניית יתר - המניה עלתה מהר מדי ויש סיכוי לתיקון מחיר כלפי מטה. משקיעים זהירים ממתינים לירידה.`;
    if (value >= 50) return `RSI של ${value.toFixed(1)} מראה מומנטום חיובי - יותר קונים מאשר מוכרים. זה טווח בריא לכניסה.`;
    if (value >= 30) return `RSI של ${value.toFixed(1)} מראה מומנטום מעורב - המניה לא בטרנד ברור. כדאי לחכות לאות ברור יותר.`;
    return `RSI של ${value.toFixed(1)} מעיד על מכירת יתר - המניה ירדה מהר מדי ויש סיכוי לעלייה. אבל זהירות - לפעמים מכירת יתר נמשכת.`;
  },
  crossover: (crossStatus: string, sma20: number | null, sma50: number | null) => {
    const sma20Str = sma20 ? formatCurrency(sma20) : 'N/A';
    const sma50Str = sma50 ? formatCurrency(sma50) : 'N/A';
    if (crossStatus === 'strong_bullish' || crossStatus === 'bullish') {
      return `צלב זהב ✨ - ממוצע נע 20 יום (${sma20Str}) נמצא מעל ממוצע נע 50 יום (${sma50Str}). המשמעות: המגמה לטווח קצר חזקה מהמגמה לטווח ארוך - סימן חיובי לעליית מחיר.`;
    }
    if (crossStatus === 'strong_bearish' || crossStatus === 'bearish') {
      return `צלב מוות ⚠️ - ממוצע נע 20 יום (${sma20Str}) נמצא מתחת לממוצע נע 50 יום (${sma50Str}). המשמעות: המגמה לטווח קצר חלשה מהמגמה לטווח ארוך - סימן שלילי שמעיד על לחץ מכירות.`;
    }
    return `ממוצעים נעים: SMA20=${sma20Str}, SMA50=${sma50Str}. ממוצע נע מחשב את המחיר הממוצע על פני תקופה ומחליק תנודות יומיות.`;
  },
  volume: (volumeRatio: number) => {
    const pct = Math.round((volumeRatio - 1) * 100);
    if (volumeRatio >= 1.5) return `נפח מסחר גבוה מאוד (${pct}% מעל הממוצע) - עניין רב מצד משקיעים. נפח גבוה מאשר תנועות מחיר ומעיד על אמינות הטרנד.`;
    if (volumeRatio >= 1.1) return `נפח מסחר גבוה (${pct}% מעל הממוצע) - יש עניין מוגבר במניה. זה סימן חיובי כשהמחיר עולה.`;
    if (volumeRatio >= 0.9) return `נפח מסחר רגיל - אין שינוי משמעותי בפעילות המסחר.`;
    return `נפח מסחר נמוך (${Math.abs(pct)}% מתחת לממוצע) - פחות משקיעים פעילים. תנועות מחיר בנפח נמוך פחות אמינות.`;
  },
  fallingKnife: (days: number) => {
    if (days >= 5) return `סכין נופלת 🔪 - המניה ירדה ${days} ימים ברציפות! מסוכן מאוד לקנות כשמניה בנפילה חופשית. המתן לסימני התייצבות.`;
    if (days >= 3) return `ירידות רצופות (${days} ימים) - המניה בלחץ מכירות. לא הזמן האידיאלי לכניסה, אבל עוד לא בטריטוריה מסוכנת.`;
    return `המניה לא בירידה רצופה משמעותית - אין סימן של "סכין נופלת".`;
  },
  volatility: (level: string, _riskMultiplier?: number) => {
    const levels: Record<string, string> = {
      'extreme': `תנודתיות קיצונית ⚡ - המניה זזה בחדות. יש להגדיל סטופ לוס ולהקטין גודל פוזיציה. מתאים למשקיעים מנוסים בלבד.`,
      'high': `תנודתיות גבוהה - המניה נעה יותר מהממוצע. מומלץ להיות זהיר עם גודל הפוזיציה.`,
      'elevated': `תנודתיות מוגברת - יש לקחת בחשבון תנודות גדולות יותר מהרגיל.`,
      'normal': `תנודתיות רגילה - המניה נעה בטווח צפוי.`,
      'low': `תנודתיות נמוכה - המניה יציבה יחסית. מתאים למשקיעים שמורים.`
    };
    return levels[level] || `רמת תנודתיות: ${level}`;
  },
  analysts: (consensus: string, total: number, score?: number) => {
    const consensusHeb: Record<string, string> = {
      'Strong Buy': 'קנייה חזקה',
      'Buy': 'קנייה',
      'Hold': 'החזק',
      'Sell': 'מכירה',
      'Strong Sell': 'מכירה חזקה'
    };
    const heb = consensusHeb[consensus] || consensus;
    const scoreStr = score ? ` (ציון ${score.toFixed(2)}/5)` : '';
    return `${total} אנליסטים מוול סטריט עוקבים אחרי המניה. הקונצנזוס: ${heb}${scoreStr}. דירוג האנליסטים משקף את הציפיות של מומחים מקצועיים לגבי ביצועי המניה.`;
  },
  riskReward: (ratio: number) => {
    if (ratio >= 3) return `יחס סיכון/סיכוי מעולה (1:${ratio}) - הרווח הפוטנציאלי גדול פי ${ratio} מההפסד המקסימלי. הזדמנות אטרקטיבית!`;
    if (ratio >= 2) return `יחס סיכון/סיכוי טוב (1:${ratio}) - הרווח הפוטנציאלי גדול פי ${ratio} מההפסד. עומד בסטנדרטים המקובלים.`;
    if (ratio >= 1.5) return `יחס סיכון/סיכוי סביר (1:${ratio}) - הרווח מעט גדול מהסיכון. לא אידיאלי אבל קביל.`;
    return `יחס סיכון/סיכוי נמוך (1:${ratio}) - הסיכון קרוב לרווח הפוטנציאלי. שקול אם זה שווה את זה.`;
  }
};

// Generate comprehensive Hebrew reasoning
function generateHebrewReasoning(analysis: StockAnalysis): string {
  const parts: string[] = [];
  const { battlePlan, rsi, volumeRatio, analystData } = analysis;
  const crossoverData = (analysis as any).crossoverData || {};
  const fallingKnifeData = (analysis as any).fallingKnifeData || {};
  const volatilityData = (analysis as any).volatilityData || {};

  // Opening based on verdict
  const verdictIntros: Record<string, string> = {
    'BUY_NOW': 'המניה מציגה תמונה טכנית חיובית ומתאימה לכניסה.',
    'WAIT_FOR_DIP': 'המניה נראית טוב אך המחיר גבוה מדי כרגע - מומלץ להמתין לירידה.',
    'WATCH': 'המניה לא עומדת בכל הקריטריונים כרגע - יש לעקוב ולהמתין.',
    'AVOID': 'המניה מציגה סימנים שליליים - מומלץ להימנע כרגע.'
  };
  parts.push(verdictIntros[battlePlan.verdict] || '');

  // Trend analysis
  if (crossoverData.crossStatus === 'strong_bullish' || crossoverData.crossStatus === 'bullish') {
    parts.push(`ממוצע נע קצר (20 יום) חצה את הארוך (50 יום) כלפי מעלה - צלב זהב שמעיד על מגמת עלייה.`);
  } else if (crossoverData.crossStatus === 'strong_bearish' || crossoverData.crossStatus === 'bearish') {
    parts.push(`ממוצע נע קצר מתחת לארוך - צלב מוות שמעיד על מגמת ירידה.`);
  }

  // RSI
  if (rsi !== null) {
    if (rsi >= 70) {
      parts.push(`RSI של ${rsi.toFixed(1)} מעיד על קניית יתר - המניה עלתה מהר וייתכן תיקון.`);
    } else if (rsi >= 50) {
      parts.push(`מומנטום חיובי עם RSI של ${rsi.toFixed(1)} מראה כוח קנייה.`);
    } else if (rsi < 30) {
      parts.push(`RSI נמוך של ${rsi.toFixed(1)} מעיד על מכירת יתר - אפשרי ריבאונד.`);
    }
  }

  // Volume
  if (volumeRatio >= 1.1) {
    const pct = Math.round((volumeRatio - 1) * 100);
    parts.push(`נפח מסחר גבוה ב-${pct}% מהממוצע מעיד על עניין גובר מצד משקיעים.`);
  }

  // Analyst data
  if (analystData && analystData.total > 0) {
    const consensusHeb: Record<string, string> = {
      'Strong Buy': 'קנייה חזקה',
      'Buy': 'קנייה',
      'Hold': 'החזק',
      'Sell': 'מכירה',
      'Strong Sell': 'מכירה חזקה'
    };
    parts.push(`${analystData.total} אנליסטים עוקבים עם המלצת ${consensusHeb[analystData.consensus] || analystData.consensus}.`);
  }

  // Warnings
  if (fallingKnifeData.isFallingKnife) {
    parts.push(`⚠️ זהירות: המניה ב"סכין נופלת" - ${fallingKnifeData.consecutiveDownDays} ימי ירידה ברצף.`);
  }
  if (volatilityData.volatilityLevel === 'extreme' || volatilityData.volatilityLevel === 'high') {
    parts.push(`⚠️ תנודתיות ${volatilityData.volatilityLevel === 'extreme' ? 'קיצונית' : 'גבוהה'} - יש להתאים את גודל הפוזיציה.`);
  }

  return parts.join(' ');
}

// Get crossover status display
function getCrossoverDisplay(crossoverData: any, _sma20?: number | null, _sma50?: number | null) {
  const status = crossoverData?.crossStatus || 'unknown';
  const displays: Record<string, { label: string; color: string; emoji: string }> = {
    'strong_bullish': { label: 'צלב זהב חזק', color: 'text-green-400', emoji: '✨' },
    'bullish': { label: 'צלב זהב', color: 'text-green-400', emoji: '✨' },
    'neutral': { label: 'ניטרלי', color: 'text-gray-400', emoji: '➖' },
    'bearish': { label: 'צלב מוות', color: 'text-red-400', emoji: '⚠️' },
    'strong_bearish': { label: 'צלב מוות חזק', color: 'text-red-400', emoji: '💀' },
    'unknown': { label: 'לא ידוע', color: 'text-gray-500', emoji: '❓' }
  };
  return displays[status] || displays['unknown'];
}

export default function AnalysisModal({ symbol, onClose }: AnalysisModalProps) {
  const { analyze, loading, error } = useStockAnalysis();
  const { fetchInfo: fetchCompanyInfo, loading: companyLoading } = useCompanyInfo();
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch analysis and company info in parallel
      const [analysisResult, companyResult] = await Promise.all([
        analyze(symbol),
        fetchCompanyInfo(symbol)
      ]);
      if (analysisResult) {
        setAnalysis(analysisResult);
      }
      if (companyResult) {
        setCompanyInfo(companyResult);
      }
    };
    fetchData();
  }, [symbol, analyze, fetchCompanyInfo]);

  const getVerdictBadge = (verdict: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      'BUY_NOW': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'קנה עכשיו 🚀' },
      'WAIT_FOR_DIP': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'המתן לירידה ⏳' },
      'WATCH': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'עקוב 👀' },
      'AVOID': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'הימנע ⛔' }
    };
    return badges[verdict] || { bg: 'bg-gray-500/20', text: 'text-gray-400', label: verdict };
  };

  // Extract additional data
  const crossoverData = analysis ? (analysis as any).crossoverData || {} : {};
  const fallingKnifeData = analysis ? (analysis as any).fallingKnifeData || {} : {};
  const volatilityData = analysis ? (analysis as any).volatilityData || {} : {};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔬</span>
            <div>
              <h2 className="text-xl font-bold text-white">{symbol}</h2>
              <p className="text-sm text-gray-400">ניתוח טכני מפורט</p>
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
              <p className="text-gray-400">מנתח את המניה...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
              <p className="font-medium">שגיאה</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Company Info Section */}
          {companyInfo && companyInfo.profile && (
            <div className="mb-6 space-y-4">
              {/* Company Header with Logo */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="flex items-start gap-4">
                  {companyInfo.profile.logo && (
                    <img
                      src={companyInfo.profile.logo}
                      alt={companyInfo.profile.name}
                      className="w-12 h-12 rounded-lg bg-white p-1 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{companyInfo.profile.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                      <span className="text-blue-400">
                        {getHebrewSector(companyInfo.profile.sector)}
                      </span>
                      {companyInfo.profile.marketCap && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400">
                            שווי שוק: {formatMarketCap(companyInfo.profile.marketCap)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Description */}
                {companyInfo.profile.description && (
                  <p className="mt-3 text-sm text-gray-300 leading-relaxed line-clamp-3">
                    {companyInfo.profile.description}
                  </p>
                )}
              </div>

              {/* Recent News */}
              {companyInfo.news && companyInfo.news.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <span>📰</span> חדשות אחרונות
                  </h4>
                  <div className="space-y-2">
                    {companyInfo.news.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                      >
                        <p className="text-sm text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-2">
                          {item.headline}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{item.source}</span>
                          <span>•</span>
                          <span>{formatNewsDate(item.datetime)}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading company info indicator */}
          {companyLoading && !companyInfo && (
            <div className="mb-6 bg-gray-900 rounded-xl p-4 border border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-6">
              {/* Verdict Banner */}
              {(() => {
                const badge = getVerdictBadge(analysis.battlePlan.verdict);
                return (
                  <div className={`${badge.bg} border ${badge.text.replace('text-', 'border-')}/30 rounded-xl p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-lg font-bold ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <span className="text-white font-medium">
                          רמת ביטחון: {analysis.battlePlan.confidenceScore}%
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-2xl">{formatCurrency(analysis.price)}</p>
                        <p className={`text-sm ${analysis.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPercent(analysis.changePercent)} היום
                        </p>
                      </div>
                    </div>

                    {/* Hebrew Reasoning Paragraph */}
                    <div className="bg-black/20 rounded-lg p-4 mt-4">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <span>📝</span> סיכום הניתוח
                      </h4>
                      <p className="text-gray-200 leading-relaxed text-sm">
                        {generateHebrewReasoning(analysis)}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Trading Plan */}
              <div className="grid grid-cols-3 gap-4">
                {/* Entry Zone */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                    <span>🎯</span> טווח כניסה מומלץ
                  </p>
                  <p className="text-white font-semibold">
                    {formatCurrency(analysis.battlePlan.entryZone.low)} - {formatCurrency(analysis.battlePlan.entryZone.high)}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">מחיר אידיאלי לקנייה</p>
                </div>

                {/* Stop Loss */}
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
                    <span>🛑</span> סטופ לוס (עצור הפסד)
                  </p>
                  <p className="text-red-400 font-semibold">{formatCurrency(analysis.battlePlan.stopLoss.price)}</p>
                  <p className="text-red-500/70 text-xs mt-1">-{analysis.battlePlan.stopLoss.percentage.toFixed(1)}% מהכניסה</p>
                </div>

                {/* Take Profit */}
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                  <p className="text-green-400 text-xs mb-2 flex items-center gap-1">
                    <span>💰</span> יעד רווח
                  </p>
                  <p className="text-green-400 font-semibold">{formatCurrency(analysis.battlePlan.profitTarget.price)}</p>
                  <p className="text-green-500/70 text-xs mt-1">+{analysis.battlePlan.profitTarget.percentage.toFixed(1)}% מהכניסה</p>
                </div>
              </div>

              {/* Educational Technical Indicators */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>📊</span> אינדיקטורים טכניים
                </h3>

                {/* Golden/Death Cross */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <InfoTooltip text={educationalTexts.crossover(crossoverData.crossStatus, analysis.sma20, analysis.sma50)} />
                      <span className="text-gray-300 font-medium">ממוצעים נעים (SMA)</span>
                    </div>
                    {(() => {
                      const display = getCrossoverDisplay(crossoverData, analysis.sma20, analysis.sma50);
                      return (
                        <span className={`${display.color} font-semibold flex items-center gap-1`}>
                          {display.emoji} {display.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">ממוצע 20 יום</p>
                      <p className="text-white font-semibold">{analysis.sma20 ? formatCurrency(analysis.sma20) : 'N/A'}</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">ממוצע 50 יום</p>
                      <p className="text-white font-semibold">{analysis.sma50 ? formatCurrency(analysis.sma50) : 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                    {educationalTexts.crossover(crossoverData.crossStatus, analysis.sma20, analysis.sma50)}
                  </p>
                </div>

                {/* RSI */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <InfoTooltip text="RSI (מדד חוזק יחסי) מודד את עוצמת תנועות המחיר. ערך 0-100. מעל 70 = קניית יתר, מתחת 30 = מכירת יתר, 50-70 = מומנטום חיובי." />
                      <span className="text-gray-300 font-medium">RSI - מדד חוזק יחסי</span>
                    </div>
                    <span className={`font-bold text-xl ${
                      analysis.rsi && analysis.rsi >= 70 ? 'text-red-400' :
                      analysis.rsi && analysis.rsi >= 50 ? 'text-green-400' :
                      analysis.rsi && analysis.rsi >= 30 ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {analysis.rsi?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  {/* RSI Bar */}
                  {analysis.rsi && (
                    <div className="relative h-3 bg-gray-700 rounded-full mt-3 overflow-hidden">
                      <div className="absolute inset-0 flex">
                        <div className="w-[30%] bg-blue-500/30" />
                        <div className="w-[20%] bg-yellow-500/30" />
                        <div className="w-[20%] bg-green-500/30" />
                        <div className="w-[30%] bg-red-500/30" />
                      </div>
                      <div
                        className="absolute top-0 w-1 h-full bg-white shadow-lg"
                        style={{ left: `${analysis.rsi}%` }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>מכירת יתר (0-30)</span>
                    <span>ניטרלי (30-50)</span>
                    <span>חיובי (50-70)</span>
                    <span>קניית יתר (70+)</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                    {educationalTexts.rsi(analysis.rsi)}
                  </p>
                </div>

                {/* Volume */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <InfoTooltip text="נפח מסחר מראה כמה מניות נסחרות. נפח גבוה מאשר תנועות מחיר - הרבה קונים/מוכרים מסכימים על הכיוון." />
                      <span className="text-gray-300 font-medium">נפח מסחר</span>
                    </div>
                    <span className={`font-bold ${
                      analysis.volumeRatio >= 1.5 ? 'text-green-400' :
                      analysis.volumeRatio >= 1.1 ? 'text-blue-400' :
                      analysis.volumeRatio >= 0.9 ? 'text-gray-400' : 'text-yellow-400'
                    }`}>
                      {Math.round(analysis.volumeRatio * 100)}% מהממוצע
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                    {educationalTexts.volume(analysis.volumeRatio)}
                  </p>
                </div>

                {/* Falling Knife Warning */}
                {fallingKnifeData.consecutiveDownDays >= 2 && (
                  <div className={`rounded-xl p-4 border ${
                    fallingKnifeData.isFallingKnife
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <InfoTooltip text="סכין נופלת היא מניה בירידה חדה. לתפוס סכין נופלת זה מסוכן - המניה יכולה להמשיך לרדת עוד הרבה." />
                        <span className={`font-medium ${fallingKnifeData.isFallingKnife ? 'text-red-400' : 'text-yellow-400'}`}>
                          {fallingKnifeData.isFallingKnife ? '🔪 סכין נופלת!' : '⚠️ ירידות רצופות'}
                        </span>
                      </div>
                      <span className={`font-bold ${fallingKnifeData.isFallingKnife ? 'text-red-400' : 'text-yellow-400'}`}>
                        {fallingKnifeData.consecutiveDownDays} ימים
                      </span>
                    </div>
                    <p className={`text-xs mt-2 leading-relaxed ${fallingKnifeData.isFallingKnife ? 'text-red-300' : 'text-yellow-300'}`}>
                      {educationalTexts.fallingKnife(fallingKnifeData.consecutiveDownDays)}
                    </p>
                  </div>
                )}

                {/* Volatility */}
                {volatilityData.volatilityLevel && volatilityData.volatilityLevel !== 'unknown' && (
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <InfoTooltip text="תנודתיות מודדת כמה המחיר זז. תנודתיות גבוהה = סיכון גבוה יותר אבל גם פוטנציאל רווח גדול יותר." />
                        <span className="text-gray-300 font-medium">תנודתיות</span>
                      </div>
                      <span className={`font-bold ${
                        volatilityData.volatilityLevel === 'extreme' ? 'text-red-400' :
                        volatilityData.volatilityLevel === 'high' ? 'text-orange-400' :
                        volatilityData.volatilityLevel === 'elevated' ? 'text-yellow-400' :
                        volatilityData.volatilityLevel === 'low' ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {({
                          'extreme': 'קיצונית ⚡',
                          'high': 'גבוהה',
                          'elevated': 'מוגברת',
                          'normal': 'רגילה',
                          'low': 'נמוכה'
                        } as Record<string, string>)[volatilityData.volatilityLevel] || volatilityData.volatilityLevel}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                      {educationalTexts.volatility(volatilityData.volatilityLevel, volatilityData.riskMultiplier)}
                    </p>
                  </div>
                )}

                {/* Risk/Reward */}
                <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <InfoTooltip text="יחס סיכון/סיכוי משווה בין הרווח הפוטנציאלי להפסד המקסימלי. יחס 1:2 אומר שאתה מסכן $1 כדי להרוויח $2." />
                      <span className="text-purple-300 font-medium">יחס סיכון/סיכוי</span>
                    </div>
                    <span className={`font-bold text-xl ${
                      analysis.battlePlan.riskReward.ratio >= 2 ? 'text-purple-400' : 'text-gray-400'
                    }`}>
                      1:{analysis.battlePlan.riskReward.ratio}
                    </span>
                  </div>
                  <p className="text-purple-300/70 text-xs mt-2 leading-relaxed">
                    {educationalTexts.riskReward(analysis.battlePlan.riskReward.ratio)}
                  </p>
                </div>
              </div>

              {/* Analyst Data */}
              {analysis.analystData && analysis.analystData.total > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <InfoTooltip text={educationalTexts.analysts(analysis.analystData.consensus, analysis.analystData.total, analysis.analystData.consensusScore)} />
                      <span className="text-gray-300 font-medium">🏦 דירוג אנליסטים מוול סטריט</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      analysis.analystData.consensus === 'Strong Buy' ? 'bg-green-500/20 text-green-400' :
                      analysis.analystData.consensus === 'Buy' ? 'bg-green-500/15 text-green-300' :
                      analysis.analystData.consensus === 'Hold' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {{
                        'Strong Buy': 'קנייה חזקה 🚀',
                        'Buy': 'קנייה 👍',
                        'Hold': 'החזק ✋',
                        'Sell': 'מכירה 👎',
                        'Strong Sell': 'מכירה חזקה ⛔'
                      }[analysis.analystData.consensus] || analysis.analystData.consensus}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {analysis.analystData.total} אנליסטים
                    </span>
                    {analysis.analystData.consensusScore && (
                      <span className="text-gray-400 text-sm">
                        ציון: {analysis.analystData.consensusScore.toFixed(2)}/5
                      </span>
                    )}
                    {analysis.analystData.targetMean && (
                      <span className="text-blue-400 text-sm">
                        יעד מחיר: {formatCurrency(analysis.analystData.targetMean)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-3 leading-relaxed">
                    {educationalTexts.analysts(analysis.analystData.consensus, analysis.analystData.total, analysis.analystData.consensusScore)}
                  </p>
                </div>
              )}

              {/* Warnings */}
              {analysis.battlePlan.warnings && analysis.battlePlan.warnings.length > 0 && (
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                  <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                    <span>⚠️</span> אזהרות חשובות
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
