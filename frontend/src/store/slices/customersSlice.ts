import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '@/types/customer';
import { FilterGroup, SavedFilter } from '@/features/customers/filters/types';
import { fetchCustomers, selectAllFilteredCustomers } from '../thunks/customerThunks';
import { 
  loadColumnVisibility, 
  saveColumnVisibility,
  loadSavedFilters,
  saveSavedFilters 
} from '../thunks/settingsThunks';
import { AppDispatch } from '@/store';

interface CustomersState {
  selectedCustomers: string[];
  selectedCustomersData: Customer[];
  activeFilters: FilterGroup[];
  savedFilters: SavedFilter[];
  visibleColumns: Set<string>;
  loading: boolean;
  error: string | null;
  total: number;
  pageSize: number;
  currentPage: number;
  data: Customer[];
}

const initialState: CustomersState = {
  selectedCustomers: [],
  selectedCustomersData: [],
  activeFilters: [],
  savedFilters: [],
  visibleColumns: new Set(),
  loading: false,
  error: null,
  total: 0,
  pageSize: 10,
  currentPage: 0,
  data: [],
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSelectedCustomers: (state, action: PayloadAction<string[]>) => {
      state.selectedCustomers = action.payload;
    },
    setSelectedCustomersData: (state, action: PayloadAction<Customer[]>) => {
      state.selectedCustomersData = action.payload;
    },
    addSelectedCustomers: (state, action: PayloadAction<string[]>) => {
      const newSelected = new Set([...state.selectedCustomers, ...action.payload]);
      state.selectedCustomers = Array.from(newSelected);
    },
    removeSelectedCustomers: (state, action: PayloadAction<string[]>) => {
      const removeSet = new Set(action.payload);
      state.selectedCustomers = state.selectedCustomers.filter(id => !removeSet.has(id));
    },
    clearSelectedCustomers: (state) => {
      state.selectedCustomers = [];
      state.selectedCustomersData = [];
    },
    setActiveFilters: (state, action: PayloadAction<FilterGroup[]>) => {
      state.activeFilters = action.payload;
    },
    addSavedFilter: (state, action: PayloadAction<SavedFilter>) => {
      state.savedFilters = [...state.savedFilters, action.payload];
    },
    removeSavedFilter: (state, action: PayloadAction<string>) => {
      state.savedFilters = state.savedFilters.filter(filter => filter.id !== action.payload);
    },
    clearSavedFilters: (state) => {
      state.savedFilters = [];
    },
    setVisibleColumns: (state, action: PayloadAction<string[]>) => {
      state.visibleColumns = new Set(action.payload);
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Handle fetchCustomers
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.customers;
        state.total = action.payload.total;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      // Handle selectAllFilteredCustomers
      .addCase(selectAllFilteredCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(selectAllFilteredCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomers = action.payload.ids;
        state.selectedCustomersData = action.payload.customers;
      })
      .addCase(selectAllFilteredCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to select all customers';
      })
      // Handle loadColumnVisibility
      .addCase(loadColumnVisibility.fulfilled, (state, action) => {
        if (action.payload) {
          state.visibleColumns = new Set(action.payload);
        }
      })
      // Handle saveColumnVisibility
      .addCase(saveColumnVisibility.rejected, (state, action) => {
        state.error = 'Failed to save column visibility';
      })
      // Handle loadSavedFilters
      .addCase(loadSavedFilters.pending, (state) => {
        state.savedFilters = []; // Clear existing filters while loading
      })
      .addCase(loadSavedFilters.fulfilled, (state, action) => {
        state.savedFilters = action.payload;
      })
      .addCase(loadSavedFilters.rejected, (state, action) => {
        state.error = 'Failed to load saved filters';
        state.savedFilters = []; // Clear on error
      })
      // Handle saveSavedFilters
      .addCase(saveSavedFilters.fulfilled, (state, action) => {
        state.savedFilters = action.payload;
      })
      .addCase(saveSavedFilters.rejected, (state, action) => {
        state.error = 'Failed to save filters';
      });
  },
});

// Action creators
export const {
  setSelectedCustomers,
  setSelectedCustomersData,
  addSelectedCustomers,
  removeSelectedCustomers,
  clearSelectedCustomers,
  setActiveFilters,
  addSavedFilter,
  removeSavedFilter,
  clearSavedFilters,
  setVisibleColumns,
  setPageSize,
  setCurrentPage,
} = customersSlice.actions;

// Thunk action to update and persist column visibility
export const updateColumnVisibility = (columns: string[]) => async (dispatch: AppDispatch) => {
  dispatch(setVisibleColumns(columns));
  await dispatch(saveColumnVisibility(columns));
};

// Thunk action creators
export const saveFilter = (filter: SavedFilter) => async (dispatch: AppDispatch, getState: () => { customers: CustomersState }) => {
  const state = getState();
  const newFilters = [...state.customers.savedFilters, filter];
  await dispatch(saveSavedFilters(newFilters));
  dispatch(loadSavedFilters());
};

export const deleteFilter = (filterId: string) => async (dispatch: AppDispatch, getState: () => { customers: CustomersState }) => {
  const state = getState();
  const newFilters = state.customers.savedFilters.filter(f => f.id !== filterId);
  await dispatch(saveSavedFilters(newFilters));
  dispatch(loadSavedFilters());
};

// Selectors
export const selectSelectedCustomers = (state: { customers: CustomersState }) => 
  state.customers.selectedCustomers;

export const selectSelectedCustomersData = (state: { customers: CustomersState }) => 
  state.customers.selectedCustomersData;

export const selectActiveFilters = (state: { customers: CustomersState }) => 
  state.customers.activeFilters;

export const selectSavedFilters = (state: { customers: CustomersState }) => 
  state.customers.savedFilters;

export const selectVisibleColumns = (state: { customers: CustomersState }) => 
  state.customers.visibleColumns;

export const selectCustomersLoading = (state: { customers: CustomersState }) => 
  state.customers.loading;

export const selectCustomersError = (state: { customers: CustomersState }) => 
  state.customers.error;

export const selectCustomersTotal = (state: { customers: CustomersState }) => 
  state.customers.total;

export const selectCustomersPagination = (state: { customers: CustomersState }) => ({
  pageSize: state.customers.pageSize,
  currentPage: state.customers.currentPage,
  total: state.customers.total,
});

export const selectCustomersData = (state: { customers: CustomersState }) =>
  state.customers.data;

export default customersSlice.reducer;
