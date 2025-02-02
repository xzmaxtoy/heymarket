import { api } from './api';
import { BatchAnalytics, SystemMetrics, TrendMetrics, AnalyticsFilters } from '../features/analytics/types';

interface ErrorResponse {
  message: string;
}

/**
 * Fetch analytics data for a specific batch
 */
export const getBatchAnalytics = async (batchId: string): Promise<BatchAnalytics> => {
  try {
    return await api.get<BatchAnalytics>(`${import.meta.env.VITE_API_URL}/api/batch/${batchId}/analytics`);
  } catch (error) {
    const message = (error as ErrorResponse).message || 'Failed to fetch batch analytics';
    throw new Error(message);
  }
};

/**
 * Fetch analytics data for multiple batches within a date range
 */
export const getBatchesAnalytics = async (filters: AnalyticsFilters): Promise<BatchAnalytics[]> => {
  try {
    const params = new URLSearchParams({
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end
    });
    if (filters.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters.errorTypes?.length) {
      params.append('errorTypes', filters.errorTypes.join(','));
    }
    const response = await api.get<{ success: boolean; data: BatchAnalytics[] }>(`${import.meta.env.VITE_API_URL}/api/batch/analytics?${params}`);
    return response.data;
  } catch (error) {
    const message = (error as ErrorResponse).message || 'Failed to fetch batches analytics';
    throw new Error(message);
  }
};

/**
 * Fetch system performance metrics
 */
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    const response = await api.get<{ success: boolean; data: SystemMetrics }>(`${import.meta.env.VITE_API_URL}/api/batch/system/metrics`);
    return response.data;
  } catch (error) {
    const message = (error as ErrorResponse).message || 'Failed to fetch system metrics';
    throw new Error(message);
  }
};

/**
 * Fetch trend metrics for the analytics dashboard
 */
export const getTrendMetrics = async (filters: AnalyticsFilters): Promise<TrendMetrics> => {
  try {
    const params = new URLSearchParams({
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end
    });
    const response = await api.get<{ success: boolean; data: TrendMetrics }>(`${import.meta.env.VITE_API_URL}/api/batch/trends?${params}`);
    return response.data;
  } catch (error) {
    const message = (error as ErrorResponse).message || 'Failed to fetch trend metrics';
    throw new Error(message);
  }
};

/**
 * Export analytics data as CSV
 */
export const exportAnalytics = async (filters: AnalyticsFilters): Promise<Blob> => {
  try {
    return await api.get<Blob>(`${import.meta.env.VITE_API_URL}/api/batch/analytics/export`);
  } catch (error) {
    const message = (error as ErrorResponse).message || 'Failed to export analytics';
    throw new Error(message);
  }
};
