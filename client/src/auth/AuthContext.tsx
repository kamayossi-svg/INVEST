import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';

/**
 * Password-based session, replacing the Firebase email/password login.
 *
 * The password is exchanged once for a signed token that the server issues and
 * verifies; the token lives in localStorage so a refresh doesn't sign you out.
 * The password itself is never stored.
 */

const TOKEN_KEY = 'app-session-token';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Read by fetchApi, which cannot use hooks. */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable - nothing to clear */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(getStoredToken());
    setLoading(false);
  }, []);

  // The server rejects an expired or tampered token with 401; when any request
  // hits that, fetchApi dispatches this so the UI returns to the login screen
  // instead of silently showing empty data.
  useEffect(() => {
    const onUnauthorized = () => {
      clearStoredToken();
      setToken(null);
      setError('Session expired - please sign in again');
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (password: string) => {
    setError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    let body: { success?: boolean; data?: { token?: string }; error?: string } = {};
    try {
      body = await response.json();
    } catch {
      /* fall through to the generic message below */
    }

    if (!response.ok || !body.success || !body.data?.token) {
      const message = body.error || 'Sign in failed';
      setError(message);
      throw new Error(message);
    }

    try {
      localStorage.setItem(TOKEN_KEY, body.data.token);
    } catch {
      /* private mode - the session just won't survive a refresh */
    }
    setToken(body.data.token);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ token, isAuthenticated: !!token, loading, error, login, logout, clearError }),
    [token, loading, error, login, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
