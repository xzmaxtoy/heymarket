import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { Template } from '@/features/templates/types';
import { Batch, BatchFilter, BatchStats, BatchPagination } from '@/features/batches/types';
import dayjs from 'dayjs';

interface BatchesState {
  items: Batch[];
  total: number;
  loading: boolean;
  error: string | null;
  stats: BatchStats;
  pagination: BatchPagination;
  filter: BatchFilter;
  creation: {
    name: string;
    template: Template | null;
    scheduledFor: string | null;  // ISO string format
  };
}

const initialState: BatchesState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  stats: {
    totalBatches: 0,
    completedBatches: 0,
    failedBatches: 0,
    successRate: 0,
    averageDeliveryTime: 0,
  },
  pagination: {
    currentPage: 0,
    pageSize: 10,
    total: 0,
  },
  filter: {
    search: '',
    status: [],
    dateRange: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  creation: {
    name: '',
    template: null,
    scheduledFor: null,
  },
};

const batchesSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    setBatches: (state, action: PayloadAction<Batch[]>) => {
      state.items = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTotal: (state, action: PayloadAction<number>) => {
      state.total = action.payload;
      state.pagination.total = action.payload;
    },
    setStats: (state, action: PayloadAction<BatchStats>) => {
      state.stats = action.payload;
    },
    // Pagination actions
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.currentPage = 0; // Reset to first page when changing page size
    },
    // Filter actions
    setFilter: (state, action: PayloadAction<Partial<BatchFilter>>) => {
      state.filter = { ...state.filter, ...action.payload };
      state.pagination.currentPage = 0; // Reset to first page when changing filters
    },
    resetFilter: (state) => {
      state.filter = initialState.filter;
      state.pagination.currentPage = 0;
    },
    // Creation actions
    setName: (state, action: PayloadAction<string>) => {
      state.creation.name = action.payload;
    },
    setTemplate: (state, action: PayloadAction<Template | null>) => {
      state.creation.template = action.payload;
    },
    setScheduledFor: (state, action: PayloadAction<string | null>) => {
      state.creation.scheduledFor = action.payload;
    },
    resetCreation: (state) => {
      state.creation = initialState.creation;
    },
    // WebSocket update action
    updateBatch: (state, action: PayloadAction<{ id: string; changes: Partial<Batch> }>) => {
      const { id, changes } = action.payload;
      const batchIndex = state.items.findIndex(batch => batch.id === id);
      if (batchIndex !== -1) {
        state.items[batchIndex] = { ...state.items[batchIndex], ...changes };
      }
    },
  },
});

// Selectors
export const selectBatches = (state: RootState) => state.batches.items;
export const selectBatchesLoading = (state: RootState) => state.batches.loading;
export const selectBatchesError = (state: RootState) => state.batches.error;
export const selectBatchesPagination = (state: RootState) => state.batches.pagination;
export const selectBatchesFilter = (state: RootState) => state.batches.filter;
export const selectBatchStats = (state: RootState) => state.batches.stats;
export const selectBatchCreation = (state: RootState) => state.batches.creation;

export const {
  setBatches,
  setLoading,
  setError,
  setTotal,
  setStats,
  setCurrentPage,
  setPageSize,
  setFilter,
  resetFilter,
  setName,
  setTemplate,
  setScheduledFor,
  resetCreation,
  updateBatch,
} = batchesSlice.actions;

export default batchesSlice.reducer;
