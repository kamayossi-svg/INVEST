import { useState, useEffect, useRef } from 'react';
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
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
// INFO TOOLTIP COMPONENT
// ==========================================
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

// ==========================================
// HEBREW EDUCATIONAL TEXTS
// ==========================================
const educationalTexts = {
  rsi: (value: number | null) => {
    if (value === null) return 'אין מספיק נתונים לחישוב RSI';
    if (value >= 70) return `RSI של ${value.toFixed(1)} מעיד על קניית יתר - המניה עלתה מהר מדי ויש סיכוי לתיקון מחיר כלפי מטה. משקיעים זהירים ממתינים לירידה.`;
    if (value >= 50) return `RSI של ${value.toFixed(1)} מראה מומנטום חיובי - יותר קונים מאשר מוכרים. זה טווח בריא לכניסה.`;
    if (value >= 30) return `RSI של ${value.toFixed(1)} מראה מומנטום מעורב - המניה לא בטרנד ברור. כדאי לחכות לאות ברור יותר.`;
    return `RSI של ${value.toFixed(1)} מעיד על מכירת יתר - המניה ירדה מהר מדי ויש סיכוי לעלייה. אבל זהירות - לפעמים מכירת יתר נמשכת.`;
  },
  crossover: (goldenCross: boolean, deathCross: boolean, trendStrength?: number) => {
    if (goldenCross) {
      const strength = trendStrength ? ` (עוצמה: ${trendStrength.toFixed(2)}%)` : '';
      return `צלב זהב ✨ - הממוצע הקצר (SMA20) חצה מעל הממוצע הארוך (SMA50)${strength}. זהו אות קנייה קלאסי המעיד על תחילת מגמת עלייה. המגמה חזקה יותר ככל שהפער בין הממוצעים גדול יותר.`;
    }
    if (deathCross) {
      return `צלב מוות ☠️ - הממוצע הקצר (SMA20) חצה מתחת לממוצע הארוך (SMA50). זהו אות מכירה המעיד על תחילת מגמת ירידה. מומלץ להימנע מקנייה או לשקול מכירה.`;
    }
    return `מצב ניטרלי - אין חציית ממוצעים משמעותית. הממוצעים קרובים זה לזה, מה שמעיד על חוסר כיוון ברור בשוק.`;
  },
  volume: (volumeRatio: number) => {
    if (!volumeRatio) return 'אין נתוני נפח זמינים';
    const pct = Math.round((volumeRatio - 1) * 100);
    if (volumeRatio >= 2) return `נפח מסחר גבוה מאוד (${pct}% מעל הממוצע) - עניין רב מצד משקיעים. נפח גבוה מאשר תנועות מחיר ומעיד על אמינות הטרנד.`;
    if (volumeRatio >= 1.5) return `נפח מסחר גבוה (${pct}% מעל הממוצע) - יש עניין מוגבר במניה. זה סימן חיובי כשהמחיר עולה.`;
    if (volumeRatio >= 0.9) return `נפח מסחר רגיל - אין שינוי משמעותי בפעילות המסחר.`;
    return `נפח מסחר נמוך (${Math.abs(pct)}% מתחת לממוצע) - פחות משקיעים פעילים. תנועות מחיר בנפח נמוך פחות אמינות.`;
  },
  fallingKnife: (days: number) => {
    if (days >= 5) return `סכין נופלת 🔪 - המניה ירדה ${days} ימים ברציפות! מסוכן מאוד לקנות כשמניה בנפילה חופשית. המתן לסימני התייצבות.`;
    if (days >= 3) return `ירידות רצופות (${days} ימים) - המניה בלחץ מכירות. לא הזמן האידיאלי לכניסה, אבל עוד לא בטריטוריה מסוכנת.`;
    return `המניה לא בירידה רצופה משמעותית - אין סימן של "סכין נופלת".`;
  },
  volatility: (level: string) => {
    const levels: Record<string, string> = {
      'extreme': `תנודתיות קיצונית ⚡ - המניה זזה בחדות. יש להגדיל סטופ לוס ולהקטין גודל פוזיציה. מתאים למשקיעים מנוסים בלבד.`,
      'high': `תנודתיות גבוהה - המניה נעה יותר מהממוצע. מומלץ להיות זהיר עם גודל הפוזיציה.`,
      'elevated': `תנודתיות מוגברת - יש לקחת בחשבון תנודות גדולות יותר מהרגיל.`,
      'normal': `תנודתיות רגילה - המניה נעה בטווח צפוי.`,
      'low': `תנודתיות נמוכה - המניה יציבה יחסית. מתאים למשקיעים שמרניים.`
    };
    return levels[level] || `רמת תנודתיות: ${level}`;
  },
  analysts: (total: number, consensus: string) => {
    const consensusHeb: Record<string, string> = {
      'Strong Buy': 'קנייה חזקה',
      'Buy': 'קנייה',
      'Hold': 'החזק',
      'Sell': 'מכירה',
      'Strong Sell': 'מכירה חזקה'
    };
    const heb = consensusHeb[consensus] || consensus;
    return `${total} אנליסטים מוול סטריט עוקבים אחרי המניה. הקונצנזוס: ${heb}. דירוג האנליסטים משקף את הציפיות של מומחים מקצועיים לגבי ביצועי המניה.`;
  }
};

// Generate Hebrew reasoning
function generateHebrewReasoning(stock: StockAnalysis): string {
  const parts: string[] = [];
  const { battlePlan, rsi, volumeRatio, analystData } = stock;
  const safetyData = battlePlan.safetyData || {};

  // Verdict intro
  const verdictIntros: Record<string, string> = {
    'BUY_NOW': '🟢 המניה מציגה הזדמנות קנייה מצוינת.',
    'WAIT_FOR_DIP': '🟡 המניה מעניינת אך כדאי לחכות לירידה.',
    'WATCH': '🟡 המניה במעקב - עדיין לא מציגה סיגנל ברור.',
    'AVOID': '🔴 מומלץ להימנע מהמניה כרגע.'
  };
  parts.push(verdictIntros[battlePlan.verdict] || '');

  // Golden Cross / Death Cross
  if (safetyData.goldenCross) {
    parts.push(`צלב זהב פעיל ✨ - SMA20 מעל SMA50 בפער של ${safetyData.trendStrength?.toFixed(2) || '?'}%, אות חיובי למגמת עלייה.`);
  } else if (safetyData.deathCross) {
    parts.push(`צלב מוות פעיל ☠️ - מגמה שלילית.`);
  }

  // RSI Analysis
  if (rsi !== null && rsi !== undefined) {
    if (rsi >= 70) {
      parts.push(`RSI של ${rsi.toFixed(1)} מעיד על קניית יתר - יש סיכון לתיקון מחיר.`);
    } else if (rsi >= 50) {
      parts.push(`RSI של ${rsi.toFixed(1)} מראה מומנטום חיובי בריא.`);
    } else if (rsi >= 30) {
      parts.push(`RSI של ${rsi.toFixed(1)} מראה מומנטום מעורב.`);
    } else {
      parts.push(`RSI של ${rsi.toFixed(1)} מעיד על מכירת יתר - אפשרות להתאוששות.`);
    }
  }

  // Volume
  if (volumeRatio && volumeRatio > 1.3) {
    parts.push(`נפח מסחר גבוה (${Math.round((volumeRatio - 1) * 100)}% מעל הממוצע) מחזק את האות.`);
  }

  // Safety warnings
  if (safetyData.isFallingKnife) {
    parts.push(`⚠️ זהירות: סכין נופלת - ${safetyData.consecutiveDownDays} ימי ירידה ברציפות.`);
  }
  if (safetyData.volatilityLevel === 'extreme' || safetyData.volatilityLevel === 'high') {
    parts.push(`⚠️ תנודתיות ${safetyData.volatilityLevel === 'extreme' ? 'קיצונית' : 'גבוהה'} - מומלץ להקטין גודל פוזיציה.`);
  }

  // Analyst consensus
  if (analystData && analystData.total >= 10) {
    const buyPct = Math.round(((analystData.strongBuy + analystData.buy) / analystData.total) * 100);
    if (buyPct >= 70) {
      parts.push(`${analystData.total} אנליסטים עם ${buyPct}% המלצות קנייה - תמיכה חזקה מוול סטריט.`);
    } else if (buyPct >= 50) {
      parts.push(`${buyPct}% מתוך ${analystData.total} אנליסטים ממליצים לקנות.`);
    }
  }

  return parts.join(' ');
}

// ==========================================
// EXPANDED ROW DETAIL COMPONENT
// ==========================================
function ExpandedRowDetail({ stock, isRTL }: { stock: StockAnalysis; isRTL: boolean }) {
  const { battlePlan, analystData } = stock;
  const safetyData = battlePlan.safetyData || {};

  return (
    <div className="bg-gray-900/80 p-6 border-t border-gray-700/50">
      {/* Pending Confirmation Banner */}
      {battlePlan.isPendingConfirmation && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
          <span className="text-2xl animate-pulse">⏳</span>
          <div>
            <p className="text-amber-400 font-medium">
              {isRTL ? 'ממתין לאישור' : 'Pending Confirmation'}
            </p>
            <p className="text-amber-300/70 text-sm">
              {isRTL
                ? `המלצה מקורית: ${battlePlan.originalVerdict}. נדרש אימות בסריקה הבאה.`
                : `Original verdict: ${battlePlan.originalVerdict}. Requires confirmation in next scan.`}
            </p>
          </div>
        </div>
      )}

      {/* Mobile: Vertical Price Ladder */}
      <div className="block md:hidden mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span>📊</span> {isRTL ? 'תוכנית מחיר' : 'Price Plan'}
          </h4>
          {/* Vertical Price Bar */}
          <div className="flex items-stretch gap-4">
            {/* Vertical Progress Bar */}
            <div className="relative w-3 bg-gray-700 rounded-full flex flex-col-reverse">
              {/* Stop Loss Zone (Red) */}
              <div className="h-1/3 bg-gradient-to-t from-red-600 to-red-500 rounded-b-full" />
              {/* Entry Zone (Blue) */}
              <div className="h-1/3 bg-gradient-to-t from-blue-600 to-blue-500" />
              {/* Take Profit Zone (Green) */}
              <div className="h-1/3 bg-gradient-to-t from-green-600 to-green-500 rounded-t-full" />
              {/* Current Price Marker */}
              <div className="absolute left-1/2 -translate-x-1/2 w-5 h-1 bg-white rounded-full shadow-lg" style={{ bottom: '50%' }} />
            </div>
            {/* Price Labels */}
            <div className="flex flex-col justify-between flex-1 py-1">
              <div className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <span className="text-green-400 text-xs font-medium flex items-center gap-1">
                  <span>🎯</span> {isRTL ? 'יעד רווח' : 'Take Profit'}
                </span>
                <span className="text-green-400 font-bold text-sm">
                  {formatCurrency(battlePlan.profitTarget.price)}
                  <span className="text-green-500/70 text-xs ml-1">+{battlePlan.profitTarget.percentage.toFixed(1)}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 my-2">
                <span className="text-blue-400 text-xs font-medium flex items-center gap-1">
                  <span>📍</span> {isRTL ? 'מחיר נוכחי' : 'Current'}
                </span>
                <span className="text-blue-400 font-bold text-sm">{formatCurrency(stock.price)}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <span className="text-red-400 text-xs font-medium flex items-center gap-1">
                  <span>🛑</span> {isRTL ? 'סטופ לוס' : 'Stop Loss'}
                </span>
                <span className="text-red-400 font-bold text-sm">
                  {formatCurrency(battlePlan.stopLoss.price)}
                  <span className="text-red-500/70 text-xs ml-1">-{battlePlan.stopLoss.percentage.toFixed(1)}%</span>
                </span>
              </div>
            </div>
          </div>
          {/* Risk/Reward Badge */}
          <div className="mt-4 flex items-center justify-center gap-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <span className="text-purple-400 text-xs">{isRTL ? 'יחס סיכון/סיכוי' : 'Risk/Reward'}</span>
            <span className="text-purple-400 font-bold">1:{battlePlan.riskReward.ratio}</span>
          </div>
          {/* Mobile Trade Summary */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-gray-900/50 rounded-lg">
              <span className="text-gray-500 block">{isRTL ? 'גודל פוזיציה' : 'Position Size'}</span>
              <span className="text-purple-400 font-medium">{battlePlan.suggestedPosition?.shares || 'N/A'} {isRTL ? 'מניות' : 'shares'}</span>
            </div>
            <div className="p-2 bg-gray-900/50 rounded-lg">
              <span className="text-gray-500 block">{isRTL ? 'אזור כניסה' : 'Entry Zone'}</span>
              <span className="text-blue-400 font-medium">{formatCurrency(battlePlan.entryZone?.low || stock.price * 0.99)}</span>
            </div>
            <div className="p-2 bg-gray-900/50 rounded-lg">
              <span className="text-gray-500 block">{isRTL ? 'רווח מקסימלי' : 'Max Profit'}</span>
              <span className="text-green-400 font-medium">{battlePlan.suggestedPosition?.maxProfit ? formatCurrency(battlePlan.suggestedPosition.maxProfit) : 'N/A'}</span>
            </div>
            <div className="p-2 bg-gray-900/50 rounded-lg">
              <span className="text-gray-500 block">{isRTL ? 'סיכון מקסימלי' : 'Max Risk'}</span>
              <span className="text-red-400 font-medium">{battlePlan.suggestedPosition?.maxRisk ? formatCurrency(battlePlan.suggestedPosition.maxRisk) : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet: 4-column grid, Mobile: stacked */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

        {/* Technical Indicators */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>📊</span> {isRTL ? 'אינדיקטורים טכניים' : 'Technical Indicators'}
          </h4>
          <div className="space-y-3 text-sm">
            {/* Golden Cross / Death Cross */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  {isRTL && <InfoTooltip text={educationalTexts.crossover(!!safetyData.goldenCross, !!safetyData.deathCross, safetyData.trendStrength)} />}
                  {isRTL ? 'צלב SMA' : 'SMA Cross'}
                </span>
                {safetyData.goldenCross ? (
                  <span className="text-green-400 font-medium flex items-center gap-1">
                    <span>✨</span> {isRTL ? 'צלב זהב' : 'Golden Cross'}
                  </span>
                ) : safetyData.deathCross ? (
                  <span className="text-red-400 font-medium flex items-center gap-1">
                    <span>☠️</span> {isRTL ? 'צלב מוות' : 'Death Cross'}
                  </span>
                ) : (
                  <span className="text-gray-500">{isRTL ? 'ניטרלי' : 'Neutral'}</span>
                )}
              </div>
              {isRTL && (
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  {educationalTexts.crossover(!!safetyData.goldenCross, !!safetyData.deathCross, safetyData.trendStrength)}
                </p>
              )}
            </div>

            {/* Trend Strength */}
            {safetyData.trendStrength !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{isRTL ? 'עוצמת מגמה' : 'Trend Strength'}</span>
                <span className={`font-medium ${safetyData.trendStrength > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {safetyData.trendStrength > 0 ? '+' : ''}{safetyData.trendStrength}%
                </span>
              </div>
            )}

            {/* Falling Knife */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  {isRTL && <InfoTooltip text={educationalTexts.fallingKnife(safetyData.consecutiveDownDays || 0)} />}
                  {isRTL ? 'סכין נופלת' : 'Falling Knife'}
                </span>
                {safetyData.isFallingKnife ? (
                  <span className="text-red-400 font-medium flex items-center gap-1">
                    <span>🔪</span> {isRTL ? 'כן' : 'Yes'} ({safetyData.consecutiveDownDays} {isRTL ? 'ימים' : 'days'})
                  </span>
                ) : (
                  <span className="text-green-400">{isRTL ? 'לא' : 'No'}</span>
                )}
              </div>
            </div>

            {/* Volatility */}
            {/* Volatility */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  {isRTL && <InfoTooltip text={educationalTexts.volatility(safetyData.volatilityLevel || 'normal')} />}
                  {isRTL ? 'תנודתיות' : 'Volatility'}
                </span>
                <span className={`font-medium ${
                  safetyData.volatilityLevel === 'extreme' || safetyData.volatilityLevel === 'high'
                    ? 'text-red-400'
                    : safetyData.volatilityLevel === 'elevated'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                }`}>
                  {isRTL ? ({
                    'extreme': 'קיצונית ⚡',
                    'high': 'גבוהה',
                    'elevated': 'מוגברת',
                    'normal': 'רגילה',
                    'low': 'נמוכה'
                  } as Record<string, string>)[safetyData.volatilityLevel || 'normal'] || safetyData.volatilityLevel : safetyData.volatilityLevel || 'N/A'}
                </span>
              </div>
            </div>

            {/* RSI */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1">
                  {isRTL && <InfoTooltip text={educationalTexts.rsi(stock.rsi)} />}
                  RSI
                </span>
                <span className={`font-medium ${
                  stock.rsi && stock.rsi >= 70 ? 'text-red-400' :
                  stock.rsi && stock.rsi >= 50 ? 'text-green-400' :
                  stock.rsi && stock.rsi >= 30 ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {stock.rsi?.toFixed(1) || 'N/A'}
                </span>
              </div>
              {isRTL && stock.rsi && (
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  {educationalTexts.rsi(stock.rsi)}
                </p>
              )}
            </div>

            {/* SMA Values */}
            {stock.sma20 && stock.sma50 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">SMA20</span>
                  <span className="text-gray-300">{formatCurrency(stock.sma20)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">SMA50</span>
                  <span className="text-gray-300">{formatCurrency(stock.sma50)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Safety Warnings */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>⚠️</span> {isRTL ? 'אזהרות בטיחות' : 'Safety Warnings'}
          </h4>
          {battlePlan.warnings && battlePlan.warnings.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {battlePlan.warnings.map((warning, idx) => (
                <li key={idx} className="text-yellow-400 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-green-400 text-sm flex items-center gap-2">
              <span>✅</span> {isRTL ? 'אין אזהרות' : 'No warnings'}
            </p>
          )}

          {/* False Positive Indicators */}
          <div className="mt-4 pt-3 border-t border-gray-700/50 space-y-2 text-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              {isRTL ? 'מניעת חיובי שווא' : 'False Positive Prevention'}
            </p>
            {safetyData.isBullTrap && (
              <div className="text-orange-400 flex items-center gap-2">
                <span>🪤</span> {isRTL ? 'מלכודת שוורים' : 'Bull Trap'} ({safetyData.bullTrapRiskLevel})
              </div>
            )}
            {safetyData.hasBearishDivergence && (
              <div className="text-orange-400 flex items-center gap-2">
                <span>📉</span> {isRTL ? 'דיברגנציה דובית' : 'Bearish Divergence'}
              </div>
            )}
            {safetyData.isExtended && (
              <div className="text-orange-400 flex items-center gap-2">
                <span>📏</span> {isRTL ? 'מתוח' : 'Extended'} ({safetyData.extensionPercent}%)
              </div>
            )}
            {safetyData.isOverboughtExtreme && (
              <div className="text-red-400 flex items-center gap-2">
                <span>🔥</span> {isRTL ? 'קניית יתר קיצונית' : 'Overbought Extreme'}
              </div>
            )}
            {safetyData.isWeakBreakout && (
              <div className="text-orange-400 flex items-center gap-2">
                <span>💨</span> {isRTL ? 'פריצה חלשה' : 'Weak Breakout'}
              </div>
            )}
            {!safetyData.isBullTrap && !safetyData.hasBearishDivergence && !safetyData.isExtended &&
             !safetyData.isOverboughtExtreme && !safetyData.isWeakBreakout && (
              <div className="text-green-400 flex items-center gap-2">
                <span>✅</span> {isRTL ? 'עבר את כל הבדיקות' : 'All checks passed'}
              </div>
            )}
          </div>
        </div>

        {/* Analyst Breakdown */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>🏛️</span> {isRTL ? 'פירוט אנליסטים' : 'Analyst Breakdown'}
          </h4>
          {analystData ? (
            <div className="space-y-3">
              {/* Rating Distribution */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">{isRTL ? 'קניה חזקה' : 'Strong Buy'}</span>
                  <span className="font-medium text-green-400">{analystData.strongBuy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400">{isRTL ? 'קניה' : 'Buy'}</span>
                  <span className="font-medium text-emerald-400">{analystData.buy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400">{isRTL ? 'החזק' : 'Hold'}</span>
                  <span className="font-medium text-yellow-400">{analystData.hold}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-400">{isRTL ? 'מכירה' : 'Sell'}</span>
                  <span className="font-medium text-orange-400">{analystData.sell}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">{isRTL ? 'מכירה חזקה' : 'Strong Sell'}</span>
                  <span className="font-medium text-red-400">{analystData.strongSell}</span>
                </div>
              </div>

              {/* Visual Bar */}
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-700 mt-2">
                {analystData.strongBuy > 0 && (
                  <div className="bg-green-500" style={{ width: `${(analystData.strongBuy / analystData.total) * 100}%` }} />
                )}
                {analystData.buy > 0 && (
                  <div className="bg-emerald-400" style={{ width: `${(analystData.buy / analystData.total) * 100}%` }} />
                )}
                {analystData.hold > 0 && (
                  <div className="bg-yellow-400" style={{ width: `${(analystData.hold / analystData.total) * 100}%` }} />
                )}
                {analystData.sell > 0 && (
                  <div className="bg-orange-400" style={{ width: `${(analystData.sell / analystData.total) * 100}%` }} />
                )}
                {analystData.strongSell > 0 && (
                  <div className="bg-red-500" style={{ width: `${(analystData.strongSell / analystData.total) * 100}%` }} />
                )}
              </div>

              {/* Summary */}
              <div className="pt-2 border-t border-gray-700/50 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{isRTL ? 'סה"כ אנליסטים' : 'Total Analysts'}</span>
                  <span className="text-gray-300">{analystData.total}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-400">{isRTL ? 'ציון קונצנזוס' : 'Consensus Score'}</span>
                  <span className="text-gray-300">{analystData.consensusScore}/5</span>
                </div>
                {analystData.targetMean && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400">{isRTL ? 'יעד מחיר ממוצע' : 'Avg Price Target'}</span>
                    <span className="text-gray-300">{formatCurrency(analystData.targetMean)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">{isRTL ? 'אין נתוני אנליסטים' : 'No analyst data available'}</p>
          )}
        </div>

        {/* Recommendation Reasoning */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>🤖</span> {isRTL ? 'נימוק ההמלצה' : 'Recommendation Reasoning'}
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed mb-4" dir={isRTL ? 'rtl' : 'ltr'}>
            {isRTL ? generateHebrewReasoning(stock) : battlePlan.reasoning}
          </p>

          {/* Why Factors - Only show in English mode */}
          {!isRTL && battlePlan.whyFactors && battlePlan.whyFactors.length > 0 && (
            <div className="pt-3 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                {isRTL ? 'גורמי החלטה' : 'Decision Factors'}
              </p>
              <ul className="space-y-1 text-xs">
                {battlePlan.whyFactors.map((factor, idx) => (
                  <li key={idx} className="text-gray-400 leading-relaxed">
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Battle Plan Summary - Hidden on mobile (shown in vertical layout above) */}
          <div className="mt-4 pt-3 border-t border-gray-700/50 hidden md:block">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              {isRTL ? 'תוכנית מסחר' : 'Trade Plan'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">{isRTL ? 'אזור כניסה' : 'Entry Zone'}</span>
                <p className="text-blue-400 font-medium">
                  {formatCurrency(battlePlan.entryZone?.low || stock.price * 0.99)} - {formatCurrency(battlePlan.entryZone?.high || stock.price * 1.01)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">{isRTL ? 'גודל פוזיציה מוצע' : 'Suggested Position'}</span>
                <p className="text-purple-400 font-medium">
                  {battlePlan.suggestedPosition?.shares || 'N/A'} {isRTL ? 'מניות' : 'shares'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">{isRTL ? 'רווח מקסימלי' : 'Max Profit'}</span>
                <p className="text-green-400 font-medium">
                  {battlePlan.suggestedPosition?.maxProfit ? formatCurrency(battlePlan.suggestedPosition.maxProfit) : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">{isRTL ? 'סיכון מקסימלי' : 'Max Risk'}</span>
                <p className="text-red-400 font-medium">
                  {battlePlan.suggestedPosition?.maxRisk ? formatCurrency(battlePlan.suggestedPosition.maxRisk) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Cache previous data to show while loading
  const [displayData, setDisplayData] = useState<StockAnalysis[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const prevLoadingRef = useRef(loading);

  // Update display data only when loading completes with new data
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    const isNowDone = !loading;

    // Loading just finished
    if (wasLoading && isNowDone && data.length > 0) {
      setDisplayData(data);
      setLastUpdated(new Date());
    }

    // First load (no cached data yet)
    if (!wasLoading && data.length > 0 && displayData.length === 0) {
      setDisplayData(data);
      setLastUpdated(new Date());
    }

    prevLoadingRef.current = loading;
  }, [loading, data, displayData.length]);

  // Handle trade action
  const handleTradePlan = (stock: StockAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStock(stock);
  };

  // Handle row click to expand/collapse
  const handleRowClick = (symbol: string) => {
    setExpandedRow(expandedRow === symbol ? null : symbol);
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

  // Use displayData (cached) instead of raw data for filtering
  const MAX_DISPLAY = 30;
  const allFilteredData = displayData.filter(stock => {
    if (filter === 'buy_now') return stock.battlePlan.verdict === 'BUY_NOW';
    if (filter === 'watch') return stock.battlePlan.verdict === 'WAIT_FOR_DIP' || stock.battlePlan.verdict === 'WATCH';
    if (filter === 'avoid') return stock.battlePlan.verdict === 'AVOID';
    return true;
  });
  const filteredData = allFilteredData.slice(0, MAX_DISPLAY);
  const totalScanned = displayData.length;
  const totalInCategory = allFilteredData.length;

  // Count by verdict (use displayData)
  const buyNowCount = displayData.filter(s => s.battlePlan.verdict === 'BUY_NOW').length;
  const watchCount = displayData.filter(s => s.battlePlan.verdict === 'WAIT_FOR_DIP' || s.battlePlan.verdict === 'WATCH').length;
  const avoidCount = displayData.filter(s => s.battlePlan.verdict === 'AVOID').length;

  // Table headers
  const headers = [
    { key: 'expand', label: '' },
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
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 md:gap-3">
            <span>🎯</span> {t('scannerTitle')}
          </h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            {t('scannerSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Last Updated Timestamp + Refreshing indicator */}
          {lastUpdated && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>
                {loading ? (
                  <span className="text-blue-400">{isRTL ? 'מרענן...' : 'Refreshing...'}</span>
                ) : (
                  <>
                    {isRTL ? 'עדכון אחרון:' : 'Last updated:'}{' '}
                    <span className="text-gray-300 font-mono">{formatTime(lastUpdated)}</span>
                  </>
                )}
              </span>
            </div>
          )}

          <div className="text-xs md:text-sm text-gray-400">
            {t('cashLabel')}: <span className="text-green-400 font-semibold">{formatCurrency(cash)}</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`min-h-[44px] flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-medium text-sm transition-all active:scale-95 ${
              loading
                ? 'bg-blue-900/50 text-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
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

      {/* Filter Tabs - 44px min touch target on mobile */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
            filter === 'all'
              ? 'bg-white text-gray-900 shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white active:bg-gray-600'
          }`}
        >
          {t('filterAll')} ({displayData.length})
        </button>
        <button
          onClick={() => setFilter('buy_now')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 active:scale-95 ${
            filter === 'buy_now'
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white active:bg-gray-600'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-green-400" />
          {t('filterBuyNow')} ({buyNowCount})
        </button>
        <button
          onClick={() => setFilter('watch')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 active:scale-95 ${
            filter === 'watch'
              ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white active:bg-gray-600'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          {t('filterWatch')} ({watchCount})
        </button>
        <button
          onClick={() => setFilter('avoid')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 active:scale-95 ${
            filter === 'avoid'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white active:bg-gray-600'
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

      {/* Initial Loading State (no cached data) */}
      {loading && displayData.length === 0 && (
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

      {/* Stock Table with Loading Overlay */}
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
              <span className="text-gray-500 mx-2">•</span>
              <span className="text-gray-500">
                {isRTL ? 'לחץ על שורה להרחבת פרטים' : 'Click row to expand details'}
              </span>
            </p>
          </div>

          {/* Responsive Table Container - no overlay, data stays visible during refresh */}
          <div className="relative">
            <div className={`bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden ${loading ? 'opacity-75' : ''}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  {/* Table Header */}
                  <thead className="bg-gray-900/50 border-b border-gray-700">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header.key}
                          className={`px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                            isRTL ? 'text-right' : 'text-left'
                          } ${header.key === 'expand' ? 'w-10' : ''}`}
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
                      const isExpanded = expandedRow === stock.symbol;

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
                        <>
                          <tr
                            key={stock.symbol}
                            onClick={() => handleRowClick(stock.symbol)}
                            className={`hover:bg-gray-700/30 transition-colors cursor-pointer ${
                              isExpanded ? 'bg-gray-700/20' : ''
                            }`}
                          >
                            {/* Expand Icon */}
                            <td className="px-4 py-3 w-10">
                              <svg
                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </td>

                            {/* Symbol */}
                            <td className="px-3 md:px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-base md:text-lg">{stock.symbol}</span>
                                {isOwned && (
                                  <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded border border-purple-500/30">
                                    💼
                                  </span>
                                )}
                                <a
                                  href={`https://www.tradingview.com/chart/?symbol=${stock.symbol}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
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
                              <div className="flex flex-col gap-1">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                                  {verdictLabel}
                                </span>
                                {battlePlan.isPendingConfirmation && (
                                  <span className="text-xs text-amber-400 flex items-center gap-1">
                                    <span className="animate-pulse">⏳</span>
                                    {isRTL ? 'ממתין לאישור' : 'Pending'}
                                  </span>
                                )}
                              </div>
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

                            {/* Action Button - 44px min touch target */}
                            <td className="px-4 py-3">
                              {battlePlan.verdict === 'BUY_NOW' ? (
                                <button
                                  onClick={(e) => handleTradePlan(stock, e)}
                                  disabled={loading}
                                  className="min-h-[44px] px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:from-green-700 active:to-emerald-700 text-white shadow-lg shadow-green-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isRTL ? 'קנה' : 'Buy'}
                                </button>
                              ) : battlePlan.verdict === 'AVOID' ? (
                                <button
                                  disabled
                                  className="min-h-[44px] px-4 py-2 rounded-lg font-semibold text-sm bg-gray-700 text-gray-500 cursor-not-allowed"
                                >
                                  {isRTL ? 'הימנע' : 'Avoid'}
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => handleTradePlan(stock, e)}
                                  disabled={loading}
                                  className="min-h-[44px] px-4 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 active:from-yellow-700 active:to-orange-700 text-white shadow-lg shadow-yellow-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isRTL ? 'צפה' : 'View'}
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Row Detail */}
                          {isExpanded && (
                            <tr key={`${stock.symbol}-detail`}>
                              <td colSpan={headers.length}>
                                <ExpandedRowDetail stock={stock} isRTL={isRTL} />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && filteredData.length === 0 && displayData.length > 0 && (
        <div className="text-center py-16 bg-gray-800/50 rounded-2xl">
          <div className="text-6xl mb-4">
            {filter === 'buy_now' ? '🎯' : filter === 'watch' ? '👀' : filter === 'avoid' ? '🛑' : '📭'}
          </div>
          <p className="text-xl text-gray-400">{t('noStocksInCategory')}</p>
          <p className="text-gray-500 mt-2">{t('tryDifferentFilter')}</p>
        </div>
      )}

      {/* No Data State */}
      {!loading && displayData.length === 0 && (
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
