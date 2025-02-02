import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AnalyticsState, BatchAnalytics, SystemMetrics, TrendMetrics, AnalyticsFilters } from '../../features/analytics/types';

const initialState: AnalyticsState = {
  batchAnalytics: [],
  systemMetrics: {
    activeConnections: 0,
    queueSize: 0,
    avgResponseTime: 0,
    cpuUsage: 0,
    memoryUsage: 0
  },
  filters: {
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      end: new Date().toISOString()
    }
  },
  isLoading: false,
  error: null
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setBatchAnalytics: (state, action: PayloadAction<BatchAnalytics[]>) => {
      state.batchAnalytics = action.payload;
    },
    updateBatchAnalytics: (state, action: PayloadAction<BatchAnalytics>) => {
      const index = state.batchAnalytics.findIndex(b => b.batchId === action.payload.batchId);
      if (index !== -1) {
        state.batchAnalytics[index] = action.payload;
      } else {
        state.batchAnalytics.push(action.payload);
      }
    },
    setSystemMetrics: (state, action: PayloadAction<SystemMetrics>) => {
      state.systemMetrics = action.payload;
    },
    setFilters: (state, action: PayloadAction<AnalyticsFilters>) => {
      state.filters = action.payload;
    },
    clearAnalytics: (state) => {
      state.batchAnalytics = [];
      state.error = null;
    }
  }
});

export const {
  setLoading,
  setError,
  setBatchAnalytics,
  updateBatchAnalytics,
  setSystemMetrics,
  setFilters,
  clearAnalytics
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
