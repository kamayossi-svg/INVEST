import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';

interface MarketStatusInfo {
  isOpen: boolean;
  isEarlyClose: boolean;
  statusText: string;
  timeText: string;
  nextEventTime: Date | null;
}

// US Market holidays for 2024-2026 (market closed)
const MARKET_HOLIDAYS: string[] = [
  // 2024
  '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', '2024-05-27',
  '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25',
  // 2025
  '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
  '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
  '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
];

// Early close days (1:00 PM ET instead of 4:00 PM)
// Typically: Day before Independence Day, Day after Thanksgiving, Christmas Eve,
// and sometimes day before other holidays
const EARLY_CLOSE_DAYS: string[] = [
  // 2024
  '2024-07-03', '2024-11-29', '2024-12-24',
  // 2025
  '2025-07-03', '2025-11-28', '2025-12-24',
  // 2026
  '2026-02-13', // Day before Presidents Day (Feb 16)
  '2026-07-02', // Day before Independence Day (July 3 is the holiday, so July 2 is early close)
  '2026-11-27', // Day after Thanksgiving
  '2026-12-24', // Christmas Eve
];

// Get current time components in Eastern Time
function getEasternTimeComponents(): { hours: number; minutes: number; dayOfWeek: number; dateKey: string } {
  const now = new Date();
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });

  const parts = etFormatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const hours = parseInt(getPart('hour'), 10);
  const minutes = parseInt(getPart('minute'), 10);
  const weekday = getPart('weekday');
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');

  const dayMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };

  return {
    hours,
    minutes,
    dayOfWeek: dayMap[weekday] ?? 0,
    dateKey: `${year}-${month}-${day}`,
  };
}

// Fixed Israel times for market events
// US Market: 9:30 AM - 4:00 PM ET (or 1:00 PM on early close days)
// Israel is 7 hours ahead of ET (winter) or 6 hours (summer DST overlap)
const ISRAEL_MARKET_OPEN = '16:30';   // 9:30 AM ET
const ISRAEL_MARKET_CLOSE = '23:00';  // 4:00 PM ET
const ISRAEL_EARLY_CLOSE = '20:00';   // 1:00 PM ET
const ISRAEL_PREMARKET_START = '11:00'; // 4:00 AM ET
const ISRAEL_PREMARKET_END = '16:30';   // 9:30 AM ET

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}

function isHoliday(dateKey: string): boolean {
  return MARKET_HOLIDAYS.includes(dateKey);
}

function isEarlyCloseDay(dateKey: string): boolean {
  return EARLY_CLOSE_DAYS.includes(dateKey);
}

// Find the next trading day (skip weekends and holidays)
function getNextTradingDay(startDate: Date): { dateKey: string; daysAway: number } {
  const date = new Date(startDate);
  let daysAway = 0;

  // Move to next day first
  date.setDate(date.getDate() + 1);
  daysAway++;

  // Keep moving forward until we find a trading day
  while (true) {
    const dayOfWeek = date.getDay();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!isWeekend(dayOfWeek) && !isHoliday(dateKey)) {
      return { dateKey, daysAway };
    }

    date.setDate(date.getDate() + 1);
    daysAway++;

    // Safety: don't loop forever
    if (daysAway > 10) break;
  }

  return { dateKey: '', daysAway: 1 };
}

function getMarketStatus(): MarketStatusInfo {
  const et = getEasternTimeComponents();
  const currentMinutes = et.hours * 60 + et.minutes;
  const earlyClose = isEarlyCloseDay(et.dateKey);

  // Market hours in minutes from midnight (ET)
  const marketOpen = 9 * 60 + 30;  // 9:30 AM ET
  const marketClose = earlyClose ? 13 * 60 : 16 * 60;  // 1:00 PM or 4:00 PM ET

  // Check if today is a trading day
  if (isWeekend(et.dayOfWeek) || isHoliday(et.dateKey)) {
    // Market is closed - find next trading day
    const now = new Date();
    const { dateKey: nextDateKey } = getNextTradingDay(now);

    // Format the next trading day for display
    let nextDayLabel = '';
    if (nextDateKey) {
      const [year, month, day] = nextDateKey.split('-');
      const nextDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      nextDayLabel = `${dayNames[nextDate.getDay()]} ${parseInt(day)}/${parseInt(month)}`;
    }

    return {
      isOpen: false,
      isEarlyClose: false,
      statusText: 'closed',
      timeText: nextDayLabel ? `${nextDayLabel} ${ISRAEL_MARKET_OPEN}` : ISRAEL_MARKET_OPEN,
      nextEventTime: null,
    };
  }

  // Check if within market hours
  if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
    // Market is OPEN
    return {
      isOpen: true,
      isEarlyClose: earlyClose,
      statusText: earlyClose ? 'earlyClose' : 'open',
      timeText: earlyClose ? ISRAEL_EARLY_CLOSE : ISRAEL_MARKET_CLOSE, // Closes at 20:00 or 23:00 Israel time
      nextEventTime: null,
    };
  }

  // Market is closed but it's a trading day
  if (currentMinutes < marketOpen) {
    // Before market open today
    return {
      isOpen: false,
      isEarlyClose: earlyClose, // Show if today will be early close
      statusText: earlyClose ? 'earlyCloseToday' : 'closed',
      timeText: ISRAEL_MARKET_OPEN, // Opens at 16:30 Israel time
      nextEventTime: null,
    };
  }

  // After market close - show next trading day
  const now = new Date();
  const { dateKey: nextDateKey } = getNextTradingDay(now);

  let nextDayLabel = '';
  if (nextDateKey) {
    const [year, month, day] = nextDateKey.split('-');
    const nextDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    nextDayLabel = `${dayNames[nextDate.getDay()]} ${parseInt(day)}/${parseInt(month)}`;
  }

  return {
    isOpen: false,
    isEarlyClose: false,
    statusText: 'closed',
    timeText: nextDayLabel ? `${nextDayLabel} ${ISRAEL_MARKET_OPEN}` : ISRAEL_MARKET_OPEN,
    nextEventTime: null,
  };
}

export default function MarketStatus() {
  const { isRTL } = useLanguage();
  const [status, setStatus] = useState<MarketStatusInfo>(getMarketStatus);

  // Update status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getMarketStatus());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Determine display text based on language and status
  const getStatusLabel = () => {
    if (isRTL) {
      switch (status.statusText) {
        case 'open': return 'השוק פתוח';
        case 'earlyClose': return 'נסגר מוקדם היום';
        case 'earlyCloseToday': return 'סגירה מוקדמת היום';
        case 'closed': return 'השוק סגור';
        default: return 'השוק סגור';
      }
    } else {
      switch (status.statusText) {
        case 'open': return 'Market Open';
        case 'earlyClose': return 'Early Close Today';
        case 'earlyCloseToday': return 'Early Close Today';
        case 'closed': return 'Market Closed';
        default: return 'Market Closed';
      }
    }
  };

  const getTimeLabel = () => {
    if (status.isOpen) {
      return isRTL ? `נסגר ב-${status.timeText}` : `Closes at ${status.timeText}`;
    } else if (status.statusText === 'earlyCloseToday') {
      // Before market opens on an early close day
      return isRTL ? `נפתח ב-${ISRAEL_MARKET_OPEN}, נסגר ב-${ISRAEL_EARLY_CLOSE}` : `Opens ${ISRAEL_MARKET_OPEN}, Closes ${ISRAEL_EARLY_CLOSE}`;
    } else {
      return isRTL ? `נפתח ב-${status.timeText}` : `Opens at ${status.timeText}`;
    }
  };

  const getDotColor = () => {
    if (status.isOpen && !status.isEarlyClose) return 'bg-green-500';
    if (status.isOpen && status.isEarlyClose) return 'bg-yellow-500';
    if (status.statusText === 'earlyCloseToday') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (status.isOpen && !status.isEarlyClose) return 'text-green-400';
    if (status.isOpen && status.isEarlyClose) return 'text-yellow-400';
    if (status.statusText === 'earlyCloseToday') return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get trading hours text based on early close status
  const getTradingHoursText = () => {
    if (isRTL) {
      if (status.isEarlyClose || status.statusText === 'earlyCloseToday') {
        return `שעות מסחר: ${ISRAEL_MARKET_OPEN} - ${ISRAEL_EARLY_CLOSE} (סגירה מוקדמת)`;
      }
      return `שעות מסחר: ${ISRAEL_MARKET_OPEN} - ${ISRAEL_MARKET_CLOSE} (שעון ישראל)`;
    } else {
      if (status.isEarlyClose || status.statusText === 'earlyCloseToday') {
        return `Trading Hours: ${ISRAEL_MARKET_OPEN} - ${ISRAEL_EARLY_CLOSE} (Early Close)`;
      }
      return `Trading Hours: ${ISRAEL_MARKET_OPEN} - ${ISRAEL_MARKET_CLOSE} (Israel Time)`;
    }
  };

  const getPreMarketText = () => {
    if (isRTL) {
      return `פרה-מרקט: ${ISRAEL_PREMARKET_START} - ${ISRAEL_PREMARKET_END}`;
    }
    return `Pre-Market: ${ISRAEL_PREMARKET_START} - ${ISRAEL_PREMARKET_END}`;
  };

  return (
    <>
      {/* Mobile: Compact status indicator */}
      <div className="md:hidden flex items-center gap-1.5 px-2 py-1 bg-gray-900/50 rounded-lg border border-gray-700/50">
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${getDotColor()}`} />
          {status.isOpen && (
            <div className={`absolute inset-0 w-2 h-2 rounded-full ${getDotColor()} animate-ping opacity-75`} />
          )}
        </div>
        <span className={`text-xs font-medium ${getTextColor()}`}>
          {status.isOpen ? (isRTL ? 'פתוח' : 'Open') : (isRTL ? 'סגור' : 'Closed')}
        </span>
      </div>

      {/* Desktop: Full status with details */}
      <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-gray-900/50 rounded-xl border border-gray-700/50">
        {/* Status dot with pulse animation when open */}
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full ${getDotColor()}`} />
          {status.isOpen && (
            <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${getDotColor()} animate-ping opacity-75`} />
          )}
        </div>

        {/* Status info */}
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {getStatusLabel()}
          </span>
          <span className="text-xs text-gray-500">
            {getTimeLabel()}
          </span>
          {/* Trading hours info */}
          <div className="mt-1 pt-1 border-t border-gray-700/30">
            <span className="text-xs text-gray-600">
              {getTradingHoursText()}
            </span>
            <span className="text-xs text-gray-600 block">
              {getPreMarketText()}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
