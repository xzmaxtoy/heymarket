import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Batch, 
  BatchCreationState, 
  BatchFilter, 
  BatchStats,
  BATCH_VALIDATION_RULES,
  BATCH_ERROR_MESSAGES,
} from '@/features/batches/types';
import { Template } from '@/features/templates/types';
import { Customer } from '@/types/customer';

interface BatchesState {
  // Batch List
  batches: Batch[];
  loading: boolean;
  error: string | null;
  total: number;
  pageSize: number;
  currentPage: number;
  filter: BatchFilter;
  stats: BatchStats;

  // Batch Creation
  creation: BatchCreationState;
}

const initialCreationState: BatchCreationState = {
  currentStep: 0,
  template: null,
  customers: [],
  variables: {},
  scheduledFor: null,
  name: '',
  isValid: false,
  errors: {},
};

const initialState: BatchesState = {
  // Batch List
  batches: [],
  loading: false,
  error: null,
  total: 0,
  pageSize: 10,
  currentPage: 0,
  filter: {
    sortBy: 'created_at',
    sortOrder: 'desc',
  },
  stats: {
    totalBatches: 0,
    completedBatches: 0,
    failedBatches: 0,
    averageDeliveryTime: 0,
    successRate: 0,
  },

  // Batch Creation
  creation: initialCreationState,
};

// Validation functions
const validateTemplate = (template: Template | null): string | null => {
  if (!template && BATCH_VALIDATION_RULES.template.required) {
    return BATCH_ERROR_MESSAGES.template.required;
  }
  return null;
};

const validateCustomers = (customers: Customer[]): string | null => {
  if (customers.length === 0 && BATCH_VALIDATION_RULES.customers.required) {
    return BATCH_ERROR_MESSAGES.customers.required;
  }
  if (customers.length > BATCH_VALIDATION_RULES.customers.maxCount) {
    return BATCH_ERROR_MESSAGES.customers.maxCount;
  }
  return null;
};

const validateName = (name: string): string | null => {
  if (!name && BATCH_VALIDATION_RULES.name.required) {
    return BATCH_ERROR_MESSAGES.name.required;
  }
  if (name.length > BATCH_VALIDATION_RULES.name.maxLength) {
    return BATCH_ERROR_MESSAGES.name.maxLength;
  }
  return null;
};

const validateScheduledFor = (date: string | null): string | null => {
  if (date && new Date(date) < new Date()) {
    return BATCH_ERROR_MESSAGES.scheduledFor.minDate;
  }
  return null;
};

const batchesSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    // Batch List Actions
    setBatches: (state, action: PayloadAction<Batch[]>) => {
      state.batches = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTotal: (state, action: PayloadAction<number>) => {
      state.total = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 0; // Reset to first page when changing page size
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setFilter: (state, action: PayloadAction<BatchFilter>) => {
      state.filter = action.payload;
      state.currentPage = 0; // Reset to first page when changing filters
    },
    setStats: (state, action: PayloadAction<BatchStats>) => {
      state.stats = action.payload;
    },

    // Batch Creation Actions
    setCreationStep: (state, action: PayloadAction<number>) => {
      state.creation.currentStep = action.payload;
    },
    setTemplate: (state, action: PayloadAction<Template | null>) => {
      state.creation.template = action.payload;
      const error = validateTemplate(action.payload);
      if (error) {
        state.creation.errors.template = error;
      } else {
        delete state.creation.errors.template;
      }
      state.creation.isValid = Object.keys(state.creation.errors).length === 0;
    },
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.creation.customers = action.payload;
      const error = validateCustomers(action.payload);
      if (error) {
        state.creation.errors.customers = error;
      } else {
        delete state.creation.errors.customers;
      }
      state.creation.isValid = Object.keys(state.creation.errors).length === 0;
    },
    setVariables: (state, action: PayloadAction<Record<string, string>>) => {
      state.creation.variables = action.payload;
    },
    setScheduledFor: (state, action: PayloadAction<string | null>) => {
      state.creation.scheduledFor = action.payload;
      const error = validateScheduledFor(action.payload);
      if (error) {
        state.creation.errors.scheduledFor = error;
      } else {
        delete state.creation.errors.scheduledFor;
      }
      state.creation.isValid = Object.keys(state.creation.errors).length === 0;
    },
    setBatchName: (state, action: PayloadAction<string>) => {
      state.creation.name = action.payload;
      const error = validateName(action.payload);
      if (error) {
        state.creation.errors.name = error;
      } else {
        delete state.creation.errors.name;
      }
      state.creation.isValid = Object.keys(state.creation.errors).length === 0;
    },
    resetCreation: (state) => {
      state.creation = initialCreationState;
    },
  },
});

export const {
  // Batch List Actions
  setBatches,
  setLoading,
  setError,
  setTotal,
  setPageSize,
  setCurrentPage,
  setFilter,
  setStats,

  // Batch Creation Actions
  setCreationStep,
  setTemplate,
  setCustomers,
  setVariables,
  setScheduledFor,
  setBatchName,
  resetCreation,
} = batchesSlice.actions;

// Selectors
export const selectBatches = (state: { batches: BatchesState }) => 
  state.batches.batches;

export const selectBatchesLoading = (state: { batches: BatchesState }) => 
  state.batches.loading;

export const selectBatchesError = (state: { batches: BatchesState }) => 
  state.batches.error;

export const selectBatchesPagination = (state: { batches: BatchesState }) => ({
  pageSize: state.batches.pageSize,
  currentPage: state.batches.currentPage,
  total: state.batches.total,
});

export const selectBatchesFilter = (state: { batches: BatchesState }) => 
  state.batches.filter;

export const selectBatchStats = (state: { batches: BatchesState }) => 
  state.batches.stats;

export const selectBatchCreation = (state: { batches: BatchesState }) => 
  state.batches.creation;

export default batchesSlice.reducer;