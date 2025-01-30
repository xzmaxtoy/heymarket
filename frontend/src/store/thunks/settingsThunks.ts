import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { FilterGroup, SavedFilter, FilterOperator } from '@/features/customers/filters/types';
import { GridLogicOperator } from '@mui/x-data-grid';

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

export const loadColumnVisibility = createAsyncThunk(
  'settings/loadColumnVisibility',
  async () => {
    try {
      const { data, error } = await supabase
        .from('sms_app_settings')
        .select('value')
        .eq('key', COLUMN_VISIBILITY_KEY)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No column visibility settings found');
          return null;
        }
        throw error;
      }

      return (data?.value as ColumnVisibilitySettings)?.selectedColumns || null;
    } catch (error) {
      console.error('Error loading column visibility:', error);
      throw error;
    }
  }
);

export const saveColumnVisibility = createAsyncThunk(
  'settings/saveColumnVisibility',
  async (columns: string[]) => {
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

      return columns;
    } catch (error) {
      console.error('Error saving column visibility:', error);
      throw error;
    }
  }
);

export const loadSavedFilters = createAsyncThunk(
  'settings/loadSavedFilters',
  async () => {
    try {
      const { data, error } = await supabase
        .from('sms_app_settings')
        .select('value')
        .eq('key', SAVED_FILTERS_KEY)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No saved filters found');
          return [];
        }
        throw error;
      }

      const settings = data?.value as SavedFiltersSettings;
      if (!settings?.filters) return [];

      // Convert filters from backend format to frontend format
      return settings.filters.map(filter => ({
        id: filter.id,
        name: filter.name,
        filter: {
          conditions: filter.groups.flatMap(group => 
            group.conditions.map(condition => ({
              id: condition.id,
              field: condition.field,
              operator: convertToFrontendOperator(condition.operator),
              value: condition.value,
            }))
          ),
          operator: filter.groups[0]?.logic === 'AND' ? GridLogicOperator.And : GridLogicOperator.Or,
        },
      }));
    } catch (error) {
      console.error('Error loading saved filters:', error);
      throw error;
    }
  }
);

export const saveSavedFilters = createAsyncThunk(
  'settings/saveSavedFilters',
  async (filters: SavedFilter[]) => {
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

      return filters;
    } catch (error) {
      console.error('Error saving filters:', error);
      throw error;
    }
  }
);
