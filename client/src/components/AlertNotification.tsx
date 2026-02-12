import { useState, useEffect } from 'react';
import type { Alert } from '../types';
import { useLanguage } from '../i18n';

interface AlertNotificationProps {
  alerts: Alert[];
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

export default function AlertNotification({
  alerts,
  onMarkRead,
  onMarkAllRead,
  onRefresh
}: AlertNotificationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const { t, isRTL } = useLanguage();

  // Track new alerts for animation
  useEffect(() => {
    if (alerts.length > 0) {
      setHasNewAlert(true);
      const timer = setTimeout(() => setHasNewAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [alerts.length]);

  // Auto-refresh alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(onRefresh, 30000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          unreadCount > 0
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
            : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
        } ${hasNewAlert ? 'animate-bounce' : ''}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div
            className={`absolute z-50 mt-2 w-80 max-h-96 overflow-y-auto bg-gray-800 rounded-xl shadow-2xl border border-gray-700 ${
              isRTL ? 'left-0' : 'right-0'
            }`}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <span>🔔</span> {t('alerts')}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>

            {/* Alerts List */}
            <div className="p-2">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-3xl block mb-2">🔕</span>
                  {t('noNewAlerts')}
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => onMarkRead(alert.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        alert.read
                          ? 'bg-gray-700/30 opacity-60'
                          : alert.type === 'TAKE_PROFIT'
                          ? 'bg-green-500/10 border border-green-500/30 hover:bg-green-500/20'
                          : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {alert.type === 'TAKE_PROFIT' ? '🎯' : '🛑'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white">
                              {alert.symbol}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                alert.type === 'TAKE_PROFIT'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {alert.type === 'TAKE_PROFIT'
                                ? t('takeProfitExecuted')
                                : t('stopLossExecuted')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">
                            {alert.shares} {t('shares')} @ ${alert.exit_price.toFixed(2)}
                          </p>
                          <p
                            className={`text-sm font-semibold ${
                              alert.realized_pl >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {alert.realized_pl >= 0 ? t('profit') : t('loss')}:{' '}
                            {alert.realized_pl >= 0 ? '+' : ''}$
                            {alert.realized_pl.toFixed(2)} (
                            {alert.realized_pl_percent >= 0 ? '+' : ''}
                            {alert.realized_pl_percent.toFixed(2)}%)
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!alert.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
