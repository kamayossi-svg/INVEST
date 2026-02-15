import { useLanguage } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';
import AlertNotification from './AlertNotification';
import MarketStatus from './MarketStatus';
import type { Alert } from '../types';

interface HeaderProps {
  totalEquity: number;
  cash: number;
  unrealizedPL: number;
  alerts: Alert[];
  onMarkAlertRead: (id: number) => void;
  onMarkAllAlertsRead: () => void;
  onRefreshAlerts: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Header({
  totalEquity,
  cash,
  unrealizedPL: _unrealizedPL,
  alerts,
  onMarkAlertRead,
  onMarkAllAlertsRead,
  onRefreshAlerts
}: HeaderProps) {
  void _unrealizedPL; // Used in interface, suppress unused warning
  const { t, isRTL } = useLanguage();
  const initialEquity = 100000;
  const totalReturn = totalEquity - initialEquity;
  const isProfit = totalReturn >= 0;

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Market Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl">
                📈
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{t('appTitle')}</h1>
                <p className="text-xs text-gray-400">{t('appSubtitle')}</p>
              </div>
            </div>

            {/* Market Status Indicator */}
            <MarketStatus />
          </div>

          {/* Portfolio Summary & Language Switcher */}
          <div className="flex items-center gap-6">
            {/* Alert Notification */}
            <AlertNotification
              alerts={alerts}
              onMarkRead={onMarkAlertRead}
              onMarkAllRead={onMarkAllAlertsRead}
              onRefresh={onRefreshAlerts}
            />

            {/* Language Switcher */}
            <LanguageSwitcher />

            <div className="h-10 w-px bg-gray-700" />

            {/* Total Value */}
            <div className={isRTL ? 'text-left' : 'text-right'}>
              <p className="text-xs text-gray-400">{t('navPortfolio')}</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalEquity)}</p>
              <div className={`flex items-center gap-1 text-sm ${isProfit ? 'text-green-400' : 'text-red-400'} ${isRTL ? 'justify-start' : 'justify-end'}`}>
                <span>{isProfit ? '↑' : '↓'}</span>
                <span>{formatCurrency(Math.abs(totalReturn))}</span>
                <span className="text-xs">
                  {isRTL ? (isProfit ? 'רווח' : 'הפסד') : (isProfit ? 'profit' : 'loss')}
                </span>
              </div>
            </div>

            <div className="h-10 w-px bg-gray-700" />

            {/* Cash */}
            <div className={isRTL ? 'text-left' : 'text-right'}>
              <p className="text-xs text-gray-400">{t('cashAvailable')}</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(cash)}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
