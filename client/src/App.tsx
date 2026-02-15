import { useState, useEffect, useCallback } from 'react';
import { useMarketScan, usePortfolio, useTrades, useAlerts } from './hooks/useApi';
import { useLanguage } from './i18n';
import Scanner from './components/Scanner';
import Portfolio from './components/Portfolio';
import TradeHistory from './components/TradeHistory';
import Header from './components/Header';

type Tab = 'scanner' | 'portfolio';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scanner');
  const market = useMarketScan();
  const portfolio = usePortfolio();
  const trades = useTrades();
  const alerts = useAlerts();
  const { t, isRTL } = useLanguage();

  // Initial load
  useEffect(() => {
    market.scan();
    portfolio.refresh();
    trades.refresh();
    alerts.refresh();
  }, []);

  // Refresh data after trade
  const handleTradeComplete = useCallback(() => {
    portfolio.refresh();
    trades.refresh();
    market.scan();
    alerts.refresh();
  }, [portfolio, trades, market, alerts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'scanner') {
        market.scan();
      } else {
        portfolio.refresh();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, market, portfolio]);

  return (
    <div className={`min-h-screen bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header
        totalEquity={portfolio.data?.totalEquity || 100000}
        cash={portfolio.data?.cash || 100000}
        unrealizedPL={portfolio.data?.totalUnrealizedPL || 0}
        alerts={alerts.data}
        onMarkAlertRead={alerts.markRead}
        onMarkAllAlertsRead={alerts.markAllRead}
        onRefreshAlerts={alerts.refresh}
      />

      {/* Desktop Tab Navigation - Hidden on mobile */}
      <div className="hidden md:block border-b border-gray-700 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`py-4 px-6 font-medium text-sm transition-colors relative ${
                activeTab === 'scanner'
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                {t('navScanner')}
              </span>
              {activeTab === 'scanner' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-4 px-6 font-medium text-sm transition-colors relative ${
                activeTab === 'portfolio'
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-lg">💼</span>
                {t('navPortfolio')}
                {(portfolio.data?.holdings.length || 0) > 0 && (
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs">
                    {portfolio.data?.holdings.length}
                  </span>
                )}
              </span>
              {activeTab === 'portfolio' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'scanner' ? (
          <Scanner
            data={market.data}
            loading={market.loading}
            error={market.error}
            onRefresh={market.scan}
            onTradeComplete={handleTradeComplete}
            cash={portfolio.data?.cash || 100000}
            ownedSymbols={portfolio.data?.holdings.map(h => h.symbol) || []}
          />
        ) : (
          <div className="space-y-6">
            <Portfolio
              data={portfolio.data}
              loading={portfolio.loading}
              error={portfolio.error}
              onRefresh={portfolio.refresh}
              onReset={portfolio.reset}
              onTradeComplete={handleTradeComplete}
            />
            <TradeHistory
              trades={trades.data}
              loading={trades.loading}
              onRefresh={trades.refresh}
            />
          </div>
        )}
      </main>

      {/* Footer - Hidden on mobile to make room for bottom nav */}
      <footer className="hidden md:block border-t border-gray-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>
            {isRTL ? (
              <>זהו <strong className="text-gray-400">סימולטור לתרגול</strong> עם כסף וירטואלי. אין כסף אמיתי מעורב. למד להשקיע בלי סיכון!</>
            ) : (
              <>This is a <strong className="text-gray-400">practice simulator</strong> using virtual money. No real money is involved. Learn investing without any risk!</>
            )}
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar - iOS/Android native feel */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700 z-50 safe-area-bottom">
        <div className="flex items-stretch justify-around">
          {/* Scanner Tab */}
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 flex flex-col items-center justify-center min-h-[60px] py-2 transition-colors ${
              activeTab === 'scanner'
                ? 'text-blue-400'
                : 'text-gray-500 active:text-gray-300'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs font-medium">{t('navScanner')}</span>
            {activeTab === 'scanner' && (
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>

          {/* Portfolio Tab */}
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`flex-1 flex flex-col items-center justify-center min-h-[60px] py-2 transition-colors relative ${
              activeTab === 'portfolio'
                ? 'text-blue-400'
                : 'text-gray-500 active:text-gray-300'
            }`}
          >
            <div className="relative">
              <svg
                className="w-6 h-6 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {/* Holdings Badge */}
              {(portfolio.data?.holdings.length || 0) > 0 && (
                <span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                  {portfolio.data?.holdings.length}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">{t('navPortfolio')}</span>
            {activeTab === 'portfolio' && (
              <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>
      </nav>

      {/* Bottom spacer for mobile nav */}
      <div className="h-[70px] md:hidden" />
    </div>
  );
}

export default App;
