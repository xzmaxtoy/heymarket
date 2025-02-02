import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getBatchAnalytics,
  getBatchesAnalytics,
  getSystemMetrics,
  getTrendMetrics,
  exportAnalytics
} from '../../services/analytics';
import {
  setLoading,
  setError,
  setBatchAnalytics,
  updateBatchAnalytics,
  setSystemMetrics
} from '../slices/analyticsSlice';
import { AnalyticsFilters } from '../../features/analytics/types';

export const fetchBatchAnalytics = createAsyncThunk(
  'analytics/fetchBatchAnalytics',
  async (batchId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const analytics = await getBatchAnalytics(batchId);
      dispatch(updateBatchAnalytics(analytics));
      dispatch(setError(null));
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchBatchesAnalytics = createAsyncThunk(
  'analytics/fetchBatchesAnalytics',
  async (filters: AnalyticsFilters, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const analytics = await getBatchesAnalytics(filters);
      dispatch(setBatchAnalytics(analytics));
      dispatch(setError(null));
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchSystemMetrics = createAsyncThunk(
  'analytics/fetchSystemMetrics',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const metrics = await getSystemMetrics();
      dispatch(setSystemMetrics(metrics));
      dispatch(setError(null));
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchTrendMetrics = createAsyncThunk(
  'analytics/fetchTrendMetrics',
  async (filters: AnalyticsFilters, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const trends = await getTrendMetrics(filters);
      // Store trends in a format suitable for charts
      return trends;
    } catch (error) {
      dispatch(setError((error as Error).message));
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const downloadAnalyticsReport = createAsyncThunk(
  'analytics/downloadReport',
  async (filters: AnalyticsFilters, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const blob = await exportAnalytics(filters);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      dispatch(setError(null));
    } catch (error) {
      dispatch(setError((error as Error).message));
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Polling function for real-time updates
let metricsPollingInterval: NodeJS.Timeout | null = null;

export const startMetricsPolling = createAsyncThunk(
  'analytics/startMetricsPolling',
  async (_, { dispatch }) => {
    if (metricsPollingInterval) {
      clearInterval(metricsPollingInterval);
    }

    metricsPollingInterval = setInterval(() => {
      dispatch(fetchSystemMetrics());
    }, 30000); // Poll every 30 seconds
  }
);

export const stopMetricsPolling = createAsyncThunk(
  'analytics/stopMetricsPolling',
  async () => {
    if (metricsPollingInterval) {
      clearInterval(metricsPollingInterval);
      metricsPollingInterval = null;
    }
  }
);
