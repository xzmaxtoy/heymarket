import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { Customer } from '@/types/customer';
import { FilterGroup, FieldType, FIELD_TYPES } from '@/features/customers/filters/types';
import { setSelectionProgress } from '@/store/slices/customersSlice';

interface FetchCustomersParams {
  page: number;
  pageSize: number;
  filters: FilterGroup[];
  searchText?: string;
}

// Convert our filter groups to Supabase filters
interface SupabaseFilter {
  column: string;
  operator: string;
  value: string | number | boolean | string[] | null;
}

const convertFiltersToSupabase = (groups: FilterGroup[]): SupabaseFilter[] => {
  const filters = groups.flatMap(group => 
    group.conditions.map(condition => {
      const operator = (() => {
        switch (condition.operator) {
          case 'equals': return 'eq';
          case 'contains': return 'ilike';
          case 'not_contains': return 'not.ilike';
          case 'startsWith': return 'like';
          case 'endsWith': return 'like';
          case 'greaterThan': return 'gt';
          case 'lessThan': return 'lt';
          case 'between': return 'gte'; // Handled specially below
          case 'in_list': return 'in';
          case 'is_empty': return 'is';
          case 'is_not_empty': return 'is not';
          default: return 'eq';
        }
      })();

      // Special cases
      if (condition.operator === 'between' && condition.value2) {
        return [
          { column: condition.field, operator: 'gte', value: condition.value },
          { column: condition.field, operator: 'lte', value: condition.value2 }
        ] as SupabaseFilter[];
      }

      if (condition.operator === 'startsWith') {
        return {
          column: condition.field,
          operator,
          value: `${condition.value}%`
        } as SupabaseFilter;
      }

      if (condition.operator === 'endsWith') {
        return {
          column: condition.field,
          operator,
          value: `%${condition.value}`
        } as SupabaseFilter;
      }

      if (condition.operator === 'contains') {
        return {
          column: condition.field,
          operator,
          value: `%${condition.value}%`
        } as SupabaseFilter;
      }

      if (condition.operator === 'not_contains') {
        // Handle different field types for not_contains
        const fieldType = FIELD_TYPES[condition.field];
        switch (fieldType) {
          case 'string':
            // For string fields: include null, empty string, and non-matching values
            return {
              column: condition.field,
              operator: 'or',
              value: `${condition.field}.is.null,${condition.field}.eq.'',${condition.field}.not.ilike.%${condition.value}%`
            } as SupabaseFilter;
          case 'number':
            // For number fields: include null and non-matching values
            return {
              column: condition.field,
              operator: 'or',
              value: `${condition.field}.is.null,${condition.field}.neq.${condition.value}`
            } as SupabaseFilter;
          case 'date': {
            // For date fields: include null and non-matching dates
            if (typeof condition.value === 'string' || typeof condition.value === 'number') {
              const date = new Date(condition.value);
              if (!isNaN(date.getTime())) {
                const dateStr = date.toISOString().split('T')[0];
                return {
                  column: condition.field,
                  operator: 'or',
                  value: `${condition.field}.is.null,${condition.field}.neq.${dateStr}`
                } as SupabaseFilter;
              }
            }
            return {
              column: condition.field,
              operator: 'not.ilike',
              value: `%${condition.value}%`
            } as SupabaseFilter;
          }
          case 'boolean':
            // For boolean fields: include null and opposite value
            return {
              column: condition.field,
              operator: 'or',
              value: `${condition.field}.is.null,${condition.field}.eq.${!condition.value}`
            } as SupabaseFilter;
          default:
            return {
              column: condition.field,
              operator: 'not.ilike',
              value: `%${condition.value}%`
            } as SupabaseFilter;
        }
      }

      if (condition.operator === 'in_list') {
        return {
          column: condition.field,
          operator,
          value: condition.value?.toString().split('\n').map(v => v.trim()).filter(Boolean)
        } as SupabaseFilter;
      }

      if (condition.operator === 'is_empty') {
        return {
          column: condition.field,
          operator,
          value: null
        } as SupabaseFilter;
      }

      if (condition.operator === 'is_not_empty') {
        return {
          column: condition.field,
          operator,
          value: null
        } as SupabaseFilter;
      }

      // Handle other operators
      return condition.value !== null ? {
        column: condition.field,
        operator,
        value: condition.value
      } as SupabaseFilter : null;
    })
  ).filter((filter): filter is SupabaseFilter => filter !== null);

  return filters.flat();
};

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async ({ page, pageSize, filters, searchText }: FetchCustomersParams) => {
    try {
      let query = supabase
        .from('customer')
        .select('*', { count: 'exact' })
        .order('date_active', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      const supabaseFilters = convertFiltersToSupabase(filters);
      supabaseFilters.forEach(filter => {
        if (filter.operator === 'or' && typeof filter.value === 'string') {
          query = query.or(filter.value);
        } else {
          query = query.filter(filter.column, filter.operator, filter.value);
        }
      });

      // Apply search if provided
      if (searchText) {
        query = query.or(`name.ilike.%${searchText}%,phone.ilike.%${searchText}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        customers: data as Customer[],
        total: count || 0,
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }
);

interface SelectAllFilteredResult {
  ids: string[];
  customers: Customer[];
}

export const selectAllFilteredCustomers = createAsyncThunk(
  'customers/selectAllFiltered',
  async (
    { filters, searchText }: Omit<FetchCustomersParams, 'page' | 'pageSize'>,
    { dispatch }
  ): Promise<SelectAllFilteredResult> => {
    try {
      // First, get total count
      let countQuery = supabase
        .from('customer')
        .select('id', { count: 'exact' });

      // Apply filters
      const supabaseFilters = convertFiltersToSupabase(filters);
      supabaseFilters.forEach(filter => {
        if (filter.operator === 'or' && typeof filter.value === 'string') {
          countQuery = countQuery.or(filter.value);
        } else {
          countQuery = countQuery.filter(filter.column, filter.operator, filter.value);
        }
      });

      // Apply search if provided
      if (searchText) {
        countQuery = countQuery.or(`name.ilike.%${searchText}%,phone.ilike.%${searchText}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      const total = count || 0;
      const batchSize = 1000; // Supabase's limit
      const batches = Math.ceil(total / batchSize);
      let allCustomers: Customer[] = [];

      // Fetch customers in batches
      for (let batch = 0; batch < batches; batch++) {
        const start = batch * batchSize;
        const end = start + batchSize - 1;

        let query = supabase
          .from('customer')
          .select('*')
          .order('date_active', { ascending: false })
          .range(start, end);

        // Apply filters
        supabaseFilters.forEach(filter => {
          if (filter.operator === 'or' && typeof filter.value === 'string') {
            query = query.or(filter.value);
          } else {
            query = query.filter(filter.column, filter.operator, filter.value);
          }
        });

        // Apply search if provided
        if (searchText) {
          query = query.or(`name.ilike.%${searchText}%,phone.ilike.%${searchText}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        allCustomers = [...allCustomers, ...(data as Customer[])];

        // Update progress
        dispatch(setSelectionProgress({
          loaded: allCustomers.length,
          total
        }));
      }

      return {
        ids: allCustomers.map(customer => customer.id),
        customers: allCustomers
      };
    } catch (error) {
      console.error('Error selecting all filtered customers:', error);
      throw error;
    }
  }
);
