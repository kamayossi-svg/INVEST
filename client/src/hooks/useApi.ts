import { useState, useCallback } from 'react';
import { getStoredToken } from '../auth/AuthContext';
import type { ApiResponse, StockAnalysis, Portfolio, Trade, Quote, Alert } from '../types';

export const API_BASE = '/api';

/**
 * Every API call carries the session token. The server verifies it; without
 * this header the request is rejected with 401.
 */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const token = getStoredToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    });

    // An expired or rejected session must return the user to the login screen
    // rather than leaving the app showing stale or empty data.
    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    // A non-JSON body (an HTML error page, a proxy timeout) used to surface as
    // a raw "SyntaxError: Unexpected token <" in the UI.
    const body = await response.text();
    let parsed: ApiResponse<T> | null = null;
    try {
      parsed = body ? JSON.parse(body) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      return {
        success: false,
        error: parsed?.error || `Request failed (${response.status})`,
      };
    }
    if (!parsed) {
      return { success: false, error: 'Unexpected response from server' };
    }
    return parsed;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export function useMarketScan() {
  const [data, setData] = useState<StockAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchApi<StockAnalysis[]>('/market/scan');
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Failed to scan market');
    }
    setLoading(false);
  }, []);

  return { data, loading, error, scan };
}

export function usePortfolio() {
  const [data, setData] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchApi<Portfolio>('/portfolio');
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Failed to load portfolio');
    }
    setLoading(false);
  }, []);

  const reset = useCallback(async () => {
    setLoading(true);
    const result = await fetchApi<Portfolio>('/portfolio/reset', { method: 'POST' });
    if (result.success) {
      await refresh();
    } else {
      setError(result.error || 'Failed to reset portfolio');
    }
    setLoading(false);
  }, [refresh]);

  return { data, loading, error, refresh, reset };
}

export function useTrades() {
  const [data, setData] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchApi<Trade[]>('/portfolio/trades');
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  }, []);

  return { data, loading, refresh };
}

export function useTrading() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(async (symbol: string, shares: number) => {
    setLoading(true);
    setError(null);
    const result = await fetchApi<{ trade: Trade; message: string }>('/trade/buy', {
      method: 'POST',
      body: JSON.stringify({ symbol, shares }),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Trade failed');
      return null;
    }
    return result.data;
  }, []);

  const sell = useCallback(async (symbol: string, shares: number) => {
    setLoading(true);
    setError(null);
    const result = await fetchApi<{ trade: Trade; message: string }>('/trade/sell', {
      method: 'POST',
      body: JSON.stringify({ symbol, shares }),
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Trade failed');
      return null;
    }
    return result.data;
  }, []);

  const getQuote = useCallback(async (symbol: string) => {
    const result = await fetchApi<Quote>(`/market/quote/${symbol}`);
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  }, []);

  return { buy, sell, getQuote, loading, error };
}

export function useAlerts() {
  const [data, setData] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchApi<Alert[]>('/alerts');
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  }, []);

  const markRead = useCallback(async (alertId: number) => {
    await fetchApi(`/alerts/${alertId}/read`, { method: 'POST' });
    await refresh();
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    await fetchApi('/alerts/read-all', { method: 'POST' });
    await refresh();
  }, [refresh]);

  return { data, loading, refresh, markRead, markAllRead };
}

export function useStockAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (symbol: string): Promise<StockAnalysis | null> => {
    setLoading(true);
    setError(null);
    const result = await fetchApi<StockAnalysis>(`/market/analyze/${symbol}`);
    setLoading(false);
    if (result.success && result.data) {
      return result.data;
    }
    setError(result.error || 'Failed to analyze stock');
    return null;
  }, []);

  return { analyze, loading, error };
}

export interface PerformanceBucket {
  count: number;
  targetHitRate: number | null;
  stopHitRate: number | null;
  unresolvedRate: number | null;
  avgForwardReturnPct: number | null;
  avgRMultiple: number | null;
}

export interface RecommendationStats {
  horizonDays: number;
  evaluated: number;
  pending: number;
  overall: PerformanceBucket;
  byVerdict: Record<string, PerformanceBucket>;
  byConfidence: Record<string, PerformanceBucket>;
  /** Keyed by ruleset version, so calls made under different entry rules stay separate. */
  byRuleset?: Record<string, PerformanceBucket>;
}

/** Whether the scanner's own past calls actually worked. */
export function useRecommendationStats() {
  const [data, setData] = useState<RecommendationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchApi<RecommendationStats>('/recommendations/stats');
    setLoading(false);
    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || 'Failed to load recommendation stats');
    }
  }, []);

  return { data, loading, error, refresh };
}

export interface CompanyProfile {
  name: string;
  description: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  country: string | null;
  exchange: string | null;
  ipo: string | null;
  logo: string | null;
  weburl: string | null;
  ticker: string;
}

export interface CompanyNewsItem {
  headline: string;
  summary: string | null;
  source: string;
  url: string;
  datetime: number;
  image: string | null;
}

export interface CompanyInfo {
  symbol: string;
  profile: CompanyProfile | null;
  news: CompanyNewsItem[];
}

export function useCompanyInfo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async (symbol: string): Promise<CompanyInfo | null> => {
    setLoading(true);
    setError(null);
    const result = await fetchApi<CompanyInfo>(`/market/company/${symbol}`);
    setLoading(false);
    if (result.success && result.data) {
      return result.data;
    }
    setError(result.error || 'Failed to fetch company info');
    return null;
  }, []);

  return { fetchInfo, loading, error };
}
