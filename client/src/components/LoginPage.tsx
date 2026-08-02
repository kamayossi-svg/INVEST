import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n';

/**
 * Single password gate.
 *
 * Replaces the previous email/password/signup/reset flow, which was more
 * account machinery than a single-user tool needs.
 */
export default function LoginPage() {
  const { login, error, clearError } = useAuth();
  const { isRTL } = useLanguage();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!password) {
      setLocalError(isRTL ? 'נא להזין סיסמה' : 'Please enter the password');
      return;
    }

    setSubmitting(true);
    try {
      await login(password);
    } catch {
      // AuthContext has already set the user-facing error
    } finally {
      setSubmitting(false);
      setPassword('');
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-8"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-blue-500/25">
          <span aria-hidden="true">📈</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Smart Stock Trader</h1>
        <p className="text-gray-400 mt-2">
          {isRTL ? 'סוכן מסחר חכם למניות' : 'AI-Powered Trading Agent'}
        </p>
      </div>

      <div className="w-full max-w-md bg-gray-800 rounded-2xl border border-gray-700 p-6 md:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isRTL ? 'כניסה' : 'Enter Password'}
        </h2>

        {(error || localError) && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl" role="alert">
            <p className="text-red-400 text-center">{localError || error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="app-password" className="block text-sm text-gray-400 mb-2">
              {isRTL ? 'סיסמה' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="app-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                disabled={submitting}
                className={`w-full min-h-[48px] bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 ${isRTL ? 'pl-16' : 'pr-16'}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className={`absolute top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white px-2 ${isRTL ? 'left-2' : 'right-2'}`}
                aria-label={
                  showPassword
                    ? (isRTL ? 'הסתר סיסמה' : 'Hide password')
                    : (isRTL ? 'הצג סיסמה' : 'Show password')
                }
              >
                {showPassword ? (isRTL ? 'הסתר' : 'Hide') : (isRTL ? 'הצג' : 'Show')}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors active:scale-[0.99]"
          >
            {submitting
              ? (isRTL ? 'מתחבר...' : 'Signing in...')
              : (isRTL ? 'כניסה' : 'Enter')}
          </button>
        </form>
      </div>

      <p className="text-gray-600 text-xs mt-6 text-center max-w-md">
        {isRTL
          ? 'מניות אמריקאיות בלבד. אינו ייעוץ השקעות.'
          : 'US Stocks only. Not financial advice.'}
      </p>
    </div>
  );
}
