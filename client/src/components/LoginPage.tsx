import { useState } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { useLanguage } from '../i18n';

type AuthMode = 'login' | 'signup' | 'reset';

export default function LoginPage() {
  const { login, signup, resetPassword, error, clearError, loading } = useAuth();
  const { isRTL } = useLanguage();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validation
    if (!email.trim()) {
      setLocalError(isRTL ? 'נא להזין אימייל' : 'Please enter email');
      return;
    }

    if (mode !== 'reset' && !password) {
      setLocalError(isRTL ? 'נא להזין סיסמה' : 'Please enter password');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError(isRTL ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : 'Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError(isRTL ? 'הסיסמאות אינן תואמות' : 'Passwords do not match');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'signup') {
        await signup(email, password);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    clearError();
    setResetSent(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-gray-400">{isRTL ? 'טוען...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg shadow-blue-500/25">
          📈
        </div>
        <h1 className="text-3xl font-bold text-white">Smart Stock Trader</h1>
        <p className="text-gray-400 mt-2">
          {isRTL ? 'סוכן מסחר חכם למניות' : 'AI-Powered Trading Agent'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-gray-800 rounded-2xl border border-gray-700 p-6 md:p-8 shadow-xl">
        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {mode === 'login' && (isRTL ? 'התחברות' : 'Login')}
          {mode === 'signup' && (isRTL ? 'הרשמה' : 'Sign Up')}
          {mode === 'reset' && (isRTL ? 'איפוס סיסמה' : 'Reset Password')}
        </h2>

        {/* Reset Success Message */}
        {resetSent && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
            <p className="text-green-400 text-center">
              {isRTL
                ? 'קישור לאיפוס סיסמה נשלח לאימייל שלך'
                : 'Password reset link sent to your email'}
            </p>
          </div>
        )}

        {/* Error Display */}
        {(error || localError) && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-center">{localError || error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              {isRTL ? 'אימייל' : 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[48px] px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder={isRTL ? 'הזן אימייל' : 'Enter your email'}
              autoComplete="email"
            />
          </div>

          {/* Password (not shown for reset mode) */}
          {mode !== 'reset' && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                {isRTL ? 'סיסמה' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder={isRTL ? 'הזן סיסמה' : 'Enter your password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {/* Confirm Password (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                {isRTL ? 'אשר סיסמה' : 'Confirm Password'}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full min-h-[48px] px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder={isRTL ? 'הזן סיסמה שוב' : 'Confirm your password'}
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full min-h-[48px] py-3 rounded-xl font-semibold text-white transition-all active:scale-[0.98] ${
              isSubmitting
                ? 'bg-blue-600/50 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isRTL ? 'מעבד...' : 'Processing...'}</span>
              </div>
            ) : (
              <>
                {mode === 'login' && (isRTL ? 'התחבר' : 'Login')}
                {mode === 'signup' && (isRTL ? 'הירשם' : 'Sign Up')}
                {mode === 'reset' && (isRTL ? 'שלח קישור איפוס' : 'Send Reset Link')}
              </>
            )}
          </button>
        </form>

        {/* Mode Switchers */}
        <div className="mt-6 pt-6 border-t border-gray-700 text-center space-y-3">
          {mode === 'login' && (
            <>
              <button
                onClick={() => switchMode('reset')}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                {isRTL ? 'שכחת סיסמה?' : 'Forgot password?'}
              </button>
              <p className="text-gray-400 text-sm">
                {isRTL ? 'אין לך חשבון?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {isRTL ? 'הירשם' : 'Sign up'}
                </button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p className="text-gray-400 text-sm">
              {isRTL ? 'כבר יש לך חשבון?' : 'Already have an account?'}{' '}
              <button
                onClick={() => switchMode('login')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {isRTL ? 'התחבר' : 'Login'}
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => switchMode('login')}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              {isRTL ? 'חזור להתחברות' : 'Back to login'}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-gray-500 text-sm text-center">
        {isRTL ? 'מניות ארה"ב בלבד. אינו ייעוץ פיננסי.' : 'US Stocks only. Not financial advice.'}
      </p>
    </div>
  );
}
