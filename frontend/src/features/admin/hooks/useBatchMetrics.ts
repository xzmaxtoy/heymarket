import { useState, useEffect } from 'react';
import { BatchAnalytics } from '@/types/batch';

interface UseBatchMetricsOptions {
  timeRange: number; // hours
  refreshInterval?: number; // milliseconds
}

export function useBatchMetrics({ timeRange, refreshInterval = 30000 }: UseBatchMetricsOptions) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<BatchAnalytics | null>(null);

  const loadMetrics = async () => {
    try {
      setError(null);

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (timeRange * 60 * 60 * 1000));

      const response = await fetch(
        `/api/v2/batch/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }

      const data = await response.json();
      setAnalytics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();

    if (refreshInterval > 0) {
      const interval = setInterval(loadMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [timeRange, refreshInterval]);

  const refresh = () => {
    setLoading(true);
    loadMetrics();
  };

  return {
    loading,
    error,
    analytics,
    refresh
  };
}
