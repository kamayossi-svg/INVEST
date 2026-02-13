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
const EARLY_CLOSE_DAYS: string[] = [
  // 2024
  '2024-07-03', '2024-11-29', '2024-12-24',
  // 2025
  '2025-07-03', '2025-11-28', '2025-12-24',
  // 2026
  '2026-07-02', '2026-11-27', '2026-12-24',
];

function getEasternTime(): Date {
  // Get current time in Eastern Time
  const now = new Date();
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(etString);
}

function getIsraelTime(date: Date): Date {
  const israelString = date.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
  return new Date(israelString);
}

function formatTimeIsrael(date: Date): string {
  return date.toLocaleTimeString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

function isHoliday(date: Date): boolean {
  return MARKET_HOLIDAYS.includes(formatDateKey(date));
}

function isEarlyCloseDay(date: Date): boolean {
  return EARLY_CLOSE_DAYS.includes(formatDateKey(date));
}

function getNextTradingDay(fromDate: Date): Date {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 1);

  // Skip weekends and holidays
  while (isWeekend(next) || isHoliday(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getMarketStatus(): MarketStatusInfo {
  const etNow = getEasternTime();
  const hours = etNow.getHours();
  const minutes = etNow.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const dateKey = formatDateKey(etNow);
  const earlyClose = isEarlyCloseDay(etNow);

  // Market hours in minutes from midnight
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = earlyClose ? 13 * 60 : 16 * 60;  // 1:00 PM or 4:00 PM

  // Check if today is a trading day
  if (isWeekend(etNow) || isHoliday(etNow)) {
    // Market is closed - find next opening
    const nextDay = getNextTradingDay(etNow);
    nextDay.setHours(9, 30, 0, 0);

    return {
      isOpen: false,
      isEarlyClose: false,
      statusText: 'closed',
      timeText: formatTimeIsrael(nextDay),
      nextEventTime: nextDay,
    };
  }

  // Check if within market hours
  if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
    // Market is OPEN
    const closeTime = new Date(etNow);
    closeTime.setHours(earlyClose ? 13 : 16, 0, 0, 0);

    return {
      isOpen: true,
      isEarlyClose: earlyClose,
      statusText: earlyClose ? 'earlyClose' : 'open',
      timeText: formatTimeIsrael(closeTime),
      nextEventTime: closeTime,
    };
  }

  // Market is closed but it's a trading day
  if (currentMinutes < marketOpen) {
    // Before market open today
    const openTime = new Date(etNow);
    openTime.setHours(9, 30, 0, 0);

    return {
      isOpen: false,
      isEarlyClose: false,
      statusText: 'closed',
      timeText: formatTimeIsrael(openTime),
      nextEventTime: openTime,
    };
  }

  // After market close - find next trading day
  const nextDay = getNextTradingDay(etNow);
  nextDay.setHours(9, 30, 0, 0);

  return {
    isOpen: false,
    isEarlyClose: false,
    statusText: 'closed',
    timeText: formatTimeIsrael(nextDay),
    nextEventTime: nextDay,
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
        case 'earlyClose': return 'השוק נסגר מוקדם היום';
        case 'closed': return 'השוק סגור';
        default: return 'השוק סגור';
      }
    } else {
      switch (status.statusText) {
        case 'open': return 'Market Open';
        case 'earlyClose': return 'Early Close Today';
        case 'closed': return 'Market Closed';
        default: return 'Market Closed';
      }
    }
  };

  const getTimeLabel = () => {
    if (status.isOpen) {
      return isRTL ? `נסגר ב-${status.timeText}` : `Closes at ${status.timeText}`;
    } else {
      return isRTL ? `נפתח ב-${status.timeText}` : `Opens at ${status.timeText}`;
    }
  };

  const getDotColor = () => {
    if (status.isOpen && !status.isEarlyClose) return 'bg-green-500';
    if (status.isEarlyClose) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (status.isOpen && !status.isEarlyClose) return 'text-green-400';
    if (status.isEarlyClose) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-900/50 rounded-xl border border-gray-700/50">
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
      </div>
    </div>
  );
}
