import { useState, useCallback } from 'react';
import type { ApiResponse, StockAnalysis, Portfolio, Trade, Quote, Alert } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
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
