import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { FilterGroup, SavedFilter, FilterOperator } from '@/features/customers/filters/types';
import { GridLogicOperator, GridColDef } from '@mui/x-data-grid';
import { ALL_COLUMNS, DEFAULT_COLUMNS } from '@/types/customer';
import { showNotification } from '../slices/notificationsSlice';
import { AppDispatch } from '../index';

const COLUMN_VISIBILITY_KEY = 'sms_column_visibility';
const SAVED_FILTERS_KEY = 'sms_saved_filters';

interface ColumnVisibilitySettings {
  selectedColumns: string[];
  lastUpdated: string;
}

interface FilterConditionSupabase {
  id: string;
  field: string;
  value: any;
  value2?: any; // Add value2 support
  operator: string;
}

interface FilterGroupSupabase {
  id: string;
  logic: 'AND' | 'OR';
  conditions: FilterConditionSupabase[];
}

interface SavedFilterSupabase {
  id: string;
  name: string;
  groups: FilterGroupSupabase[];
}

interface SavedFiltersSettings {
  filters: SavedFilterSupabase[];
  lastUpdated: string;
}

const convertToFrontendOperator = (operator: string): FilterOperator => {
  switch (operator) {
    case 'greater_than': return 'greaterThan';
    case 'less_than': return 'lessThan';
    case 'starts_with': return 'startsWith';
    case 'ends_with': return 'endsWith';
    case 'equals': return 'equals';
    case 'contains': return 'contains';
    case 'in_list': return 'in_list';
    case 'is_empty': return 'is_empty';
    case 'is_not_empty': return 'is_not_empty';
    case 'between': return 'between';
    default: return 'equals';
  }
};

const convertToBackendOperator = (operator: string): string => {
  switch (operator) {
    case 'greaterThan': return 'greater_than';
    case 'lessThan': return 'less_than';
    case 'startsWith': return 'starts_with';
    case 'endsWith': return 'ends_with';
    default: return operator;
  }
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const validateColumnVisibility = (columns: string[]): boolean => {
  if (!Array.isArray(columns)) return false;
  return columns.every(col => typeof col === 'string' && ALL_COLUMNS.some(c => c.field === col));
};

export const loadColumnVisibility = createAsyncThunk(
  'settings/loadColumnVisibility',
  async (_, { rejectWithValue, dispatch }) => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const { data, error } = await supabase
          .from('sms_app_settings')
          .select('value')
          .eq('key', COLUMN_VISIBILITY_KEY)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No column visibility settings found, using defaults');
            const defaultColumns = DEFAULT_COLUMNS.map(col => col.field);
            dispatch(showNotification({
              type: 'info',
              message: 'Using default column settings',
              duration: 3000
            }));
            return defaultColumns;
          }
          throw error;
        }

        const settings = data?.value as ColumnVisibilitySettings;
        const columns = settings?.selectedColumns;

        if (!validateColumnVisibility(columns)) {
          console.warn('Invalid column visibility settings, using defaults');
          const defaultColumns = DEFAULT_COLUMNS.map(col => col.field);
          dispatch(showNotification({
            type: 'warning',
            message: 'Invalid saved column settings, using defaults',
            duration: 3000
          }));
          return defaultColumns;
        }

        dispatch(showNotification({
          type: 'success',
          message: 'Column settings loaded successfully',
          duration: 3000
        }));
        return columns;
      } catch (error) {
        console.error(`Error loading column visibility (attempt ${retries + 1}):`, error);
        if (retries === MAX_RETRIES - 1) {
          return rejectWithValue(`Failed to load column visibility after ${MAX_RETRIES} attempts`);
        }
        await delay(RETRY_DELAY);
        retries++;
      }
    }
    const defaultColumns = DEFAULT_COLUMNS.map(col => col.field);
    dispatch(showNotification({
      type: 'error',
      message: 'Failed to load column settings, using defaults',
      duration: 5000
    }));
    return defaultColumns;
  }
);

export const saveColumnVisibility = createAsyncThunk(
  'settings/saveColumnVisibility',
  async (columns: string[], { rejectWithValue, dispatch }) => {
    if (!validateColumnVisibility(columns)) {
      return rejectWithValue('Invalid column selection');
    }

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const settings: ColumnVisibilitySettings = {
          selectedColumns: columns,
          lastUpdated: new Date().toISOString()
        };

        // First try to update
        const { data: existingData, error: checkError } = await supabase
          .from('sms_app_settings')
          .select('key')
          .eq('key', COLUMN_VISIBILITY_KEY)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        let result;
        if (!existingData) {
          // Insert new record
          result = await supabase
            .from('sms_app_settings')
            .insert({
              key: COLUMN_VISIBILITY_KEY,
              value: settings
            });
        } else {
          // Update existing record
          result = await supabase
            .from('sms_app_settings')
            .update({ value: settings })
            .eq('key', COLUMN_VISIBILITY_KEY);
        }

        if (result.error) {
          throw result.error;
        }

        dispatch(showNotification({
          type: 'success',
          message: 'Column visibility settings saved successfully',
          duration: 3000
        }));
        return columns;
      } catch (error) {
        console.error(`Error saving column visibility (attempt ${retries + 1}):`, error);
        if (retries === MAX_RETRIES - 1) {
          dispatch(showNotification({
            type: 'error',
            message: `Failed to save column visibility after ${MAX_RETRIES} attempts`,
            duration: 5000
          }));
          return rejectWithValue(`Failed to save column visibility after ${MAX_RETRIES} attempts`);
        }
        await delay(RETRY_DELAY);
        retries++;
      }
    }
    dispatch(showNotification({
      type: 'error',
      message: 'Failed to save column visibility',
      duration: 5000
    }));
    return rejectWithValue('Failed to save column visibility');
  }
);

export const loadSavedFilters = createAsyncThunk(
  'settings/loadSavedFilters',
  async (_, { dispatch }) => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const { data, error } = await supabase
          .from('sms_app_settings')
          .select('value')
          .eq('key', SAVED_FILTERS_KEY)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No saved filters found');
            dispatch(showNotification({
              type: 'info',
              message: 'No saved filters found',
              duration: 3000
            }));
            return [];
          }
          throw error;
        }

        const settings = data?.value as SavedFiltersSettings;
        if (!settings?.filters) return [];

        // Convert filters from backend format to frontend format
        const filters = settings.filters.map(filter => ({
          id: filter.id,
          name: filter.name,
          filter: {
            conditions: filter.groups.flatMap(group => 
              group.conditions.map(condition => ({
                id: condition.id,
                field: condition.field,
                operator: convertToFrontendOperator(condition.operator),
                value: condition.value,
                value2: condition.value2 || null, // Include value2 when loading
              }))
            ),
            operator: filter.groups[0]?.logic === 'AND' ? GridLogicOperator.And : GridLogicOperator.Or,
          },
        }));

        dispatch(showNotification({
          type: 'success',
          message: 'Filters loaded successfully',
          duration: 3000
        }));

        return filters;
      } catch (error) {
        console.error(`Error loading saved filters (attempt ${retries + 1}):`, error);
        if (retries === MAX_RETRIES - 1) {
          dispatch(showNotification({
            type: 'error',
            message: `Failed to load filters after ${MAX_RETRIES} attempts`,
            duration: 5000
          }));
          throw error;
        }
        await delay(RETRY_DELAY);
        retries++;
      }
    }
    return [];
  }
);

export const saveSavedFilters = createAsyncThunk(
  'settings/saveSavedFilters',
  async (filters: SavedFilter[], { dispatch }) => {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        // Convert filters to backend format
        const convertedFilters: SavedFilterSupabase[] = filters.map(filter => ({
          id: filter.id,
          name: filter.name,
          groups: [
            {
              id: crypto.randomUUID(),
              logic: filter.filter.operator === GridLogicOperator.And ? 'AND' : 'OR',
              conditions: filter.filter.conditions.map(condition => ({
                id: condition.id || crypto.randomUUID(),
                field: condition.field,
                value: condition.value,
                value2: condition.value2, // Include value2 when saving
                operator: convertToBackendOperator(condition.operator),
              })),
            },
          ],
        }));

        const settings: SavedFiltersSettings = {
          filters: convertedFilters,
          lastUpdated: new Date().toISOString()
        };

        // First try to update
        const { data: existingData, error: checkError } = await supabase
          .from('sms_app_settings')
          .select('key')
          .eq('key', SAVED_FILTERS_KEY)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        let result;
        if (!existingData) {
          // Insert new record
          result = await supabase
            .from('sms_app_settings')
            .insert({
              key: SAVED_FILTERS_KEY,
              value: settings
            });
        } else {
          // Update existing record
          result = await supabase
            .from('sms_app_settings')
            .update({ value: settings })
            .eq('key', SAVED_FILTERS_KEY);
        }

        if (result.error) {
          throw result.error;
        }

        dispatch(showNotification({
          type: 'success',
          message: 'Filters saved successfully',
          duration: 3000
        }));

        return filters;
      } catch (error) {
        console.error(`Error saving filters (attempt ${retries + 1}):`, error);
        if (retries === MAX_RETRIES - 1) {
          dispatch(showNotification({
            type: 'error',
            message: `Failed to save filters after ${MAX_RETRIES} attempts`,
            duration: 5000
          }));
          throw error;
        }
        await delay(RETRY_DELAY);
        retries++;
      }
    }
    dispatch(showNotification({
      type: 'error',
      message: 'Failed to save filters',
      duration: 5000
    }));
    throw new Error('Failed to save filters');
  }
);
