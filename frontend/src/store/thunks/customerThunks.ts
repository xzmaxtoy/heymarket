import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { Customer } from '@/types/customer';
import { FilterGroup } from '@/features/customers/filters/types';

interface FetchCustomersParams {
  page: number;
  pageSize: number;
  filters: FilterGroup[];
  searchText?: string;
}

// Convert our filter groups to Supabase filters
const convertFiltersToSupabase = (groups: FilterGroup[]) => {
  return groups.flatMap(group => 
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
        ];
      }

      if (condition.operator === 'startsWith') {
        return {
          column: condition.field,
          operator,
          value: `${condition.value}%`
        };
      }

      if (condition.operator === 'endsWith') {
        return {
          column: condition.field,
          operator,
          value: `%${condition.value}`
        };
      }

      if (condition.operator === 'contains' || condition.operator === 'not_contains') {
        return {
          column: condition.field,
          operator,
          value: `%${condition.value}%`
        };
      }

      if (condition.operator === 'in_list') {
        return {
          column: condition.field,
          operator,
          value: condition.value?.toString().split('\n').map(v => v.trim()).filter(Boolean)
        };
      }

      if (condition.operator === 'is_empty') {
        return {
          column: condition.field,
          operator,
          value: null
        };
      }

      if (condition.operator === 'is_not_empty') {
        return {
          column: condition.field,
          operator,
          value: null
        };
      }

      return {
        column: condition.field,
        operator,
        value: condition.value
      };
    })
  ).flat();
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
        query = query.filter(filter.column, filter.operator, filter.value);
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

export const selectAllFilteredCustomers = createAsyncThunk(
  'customers/selectAllFiltered',
  async ({ filters, searchText }: Omit<FetchCustomersParams, 'page' | 'pageSize'>) => {
    try {
      let query = supabase
        .from('customer')
        .select('id')
        .order('date_active', { ascending: false });

      // Apply filters
      const supabaseFilters = convertFiltersToSupabase(filters);
      supabaseFilters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value);
      });

      // Apply search if provided
      if (searchText) {
        query = query.or(`name.ilike.%${searchText}%,phone.ilike.%${searchText}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.map(customer => customer.id);
    } catch (error) {
      console.error('Error selecting all filtered customers:', error);
      throw error;
    }
  }
);
