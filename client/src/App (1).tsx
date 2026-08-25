import { useState, useEffect, useCallback } from 'react';
import { useMarketScan, usePortfolio, useTrades, useAlerts } from './hooks/useApi';
import { useLanguage } from './i18n';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import Scanner from './components/Scanner';
import Portfolio from './components/Portfolio';
import TradeHistory from './components/TradeHistory';
import Header from './components/Header';
import LoginPage from './components/LoginPage';

type Tab = 'scanner' | 'portfolio';

// Main app content (protected)
function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('scanner');
  const market = useMarketScan();
  const portfolio = usePortfolio();
  const trades = useTrades();
  const alerts = useAlerts();
  const { t, isRTL } = useLanguage();
  const { user, logout } = useAuth();

  // Initial load
  useEffect(() => {
    if (user) {
      market.scan();
      portfolio.refresh();
      trades.refresh();
      alerts.refresh();
    }
  }, [user]);

  // Refresh data after trade
  const handleTradeComplete = useCallback(() => {
    portfolio.refresh();
    trades.refresh();
    market.scan();
    alerts.refresh();
  }, [portfolio, trades, market, alerts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      if (activeTab === 'scanner') {
        market.scan();
      } else {
        portfolio.refresh();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, market, portfolio, user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Error handled by AuthContext
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
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

          {/* User info and logout button - Desktop only */}
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 text-sm transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isRTL ? 'התנתק' : 'Logout'}
            </button>
          </div>
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

          {/* Logout Tab - Mobile only */}
          <button
            onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center min-h-[60px] py-2 transition-colors text-gray-500 active:text-red-400"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="text-xs font-medium">{isRTL ? 'יציאה' : 'Logout'}</span>
          </button>
        </div>
      </nav>

      {/* Bottom spacer for mobile nav */}
      <div className="h-[70px] md:hidden" />
    </div>
  );
}

// App wrapper with authentication
function App() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl animate-pulse">
            📈
          </div>
          <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show main app if authenticated
  return <AppContent />;
}

// Root component with AuthProvider
function AppRoot() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppRoot;
