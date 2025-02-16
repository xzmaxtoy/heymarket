import { useState, useEffect } from 'react';
import { Customer } from '@/types/customer';
import { supabase } from '@/services/supabase';
import dayjs from 'dayjs';
import { FilterGroup, FieldType } from '@/features/customers/filters/types';
import { convertToGridFilterModel } from '@/features/customers/filters/types';
import { FIELD_TYPES } from '@/features/customers/filters/types';

interface UseCustomersOptions {
  pageSize?: number;
  activeFilters?: FilterGroup[];
  searchText?: string;
  filterMode?: 'direct' | 'filtered';
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const pageSize = options.pageSize || 10;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        
        const startIndex = (page - 1) * pageSize;
        
        // Build query with filters
        const countQuery = supabase.from('customer').select('id', { count: 'exact' });
        const query = supabase
          .from('customer')
          .select('*')
          .range(startIndex, startIndex + pageSize - 1)
          .order('date_create', { ascending: false });

        // Apply search filter
        const searchText = options.searchText || search;
        if (searchText) {
          const searchFilter = `name.ilike.%${searchText}%,phone.ilike.%${searchText}%,email.ilike.%${searchText}%`;
          countQuery.or(searchFilter);
          query.or(searchFilter);
        }

        // Apply advanced filters
        if (options.activeFilters && options.activeFilters.length > 0) {
          const filterModel = convertToGridFilterModel(options.activeFilters);
          filterModel.items.forEach(item => {
            if (item.value !== undefined && item.value !== null) {
              const fieldType = FIELD_TYPES[item.field];
              
              // Handle date fields specially
              if (fieldType === 'date') {
                switch (item.operator) {
                  case 'equals': {
                    const date = dayjs(item.value);
                    if (date.isValid()) {
                      // Use YYYY-MM-DD format
                      const dateStr = date.format('YYYY-MM-DD');
                      countQuery.eq(item.field, dateStr);
                      query.eq(item.field, dateStr);
                    }
                    break;
                  }
                  case 'greaterThan': {
                    const date = dayjs(item.value);
                    if (date.isValid()) {
                      const dateStr = date.format('YYYY-MM-DD');
                      countQuery.gt(item.field, dateStr);
                      query.gt(item.field, dateStr);
                    }
                    break;
                  }
                  case 'lessThan': {
                    const date = dayjs(item.value);
                    if (date.isValid()) {
                      const dateStr = date.format('YYYY-MM-DD');
                      countQuery.lt(item.field, dateStr);
                      query.lt(item.field, dateStr);
                    }
                    break;
                  }
                  case 'between': {
                    if (Array.isArray(item.value) && item.value.length === 2) {
                      const startDate = dayjs(item.value[0]);
                      const endDate = dayjs(item.value[1]);
                      
                      if (startDate.isValid() && endDate.isValid()) {
                        // Use YYYY-MM-DD format
                        const start = startDate.format('YYYY-MM-DD');
                        const end = endDate.format('YYYY-MM-DD');
                        countQuery
                          .gte(item.field, start)
                          .lte(item.field, end);
                        query
                          .gte(item.field, start)
                          .lte(item.field, end);
                      }
                    }
                    break;
                  }
                }
              } else {
                // Handle non-date fields
                switch (item.operator) {
                  case 'equals':
                    countQuery.eq(item.field, item.value);
                    query.eq(item.field, item.value);
                    break;
                  case 'contains':
                    countQuery.ilike(item.field, `%${item.value}%`);
                    query.ilike(item.field, `%${item.value}%`);
                    break;
                  case 'not_contains': {
                    // Handle different field types for not_contains
                    switch (fieldType as FieldType) {
                      case 'string': {
                        // For string fields: include null, empty string, and non-matching values
                        const filter = `${item.field}.is.null,${item.field}.eq.'',${item.field}.not.ilike.%${item.value}%`;
                        countQuery.or(filter);
                        query.or(filter);
                        break;
                      }
                      case 'number': {
                        // For number fields: include null and non-matching values
                        const filter = `${item.field}.is.null,${item.field}.neq.${item.value}`;
                        countQuery.or(filter);
                        query.or(filter);
                        break;
                      }
                      case 'date': {
                        // For date fields: include null and non-matching dates
                        const date = dayjs(item.value);
                        if (date.isValid()) {
                          const dateStr = date.format('YYYY-MM-DD');
                          const filter = `${item.field}.is.null,${item.field}.neq.${dateStr}`;
                          countQuery.or(filter);
                          query.or(filter);
                        }
                        break;
                      }
                      case 'boolean': {
                        // For boolean fields: include null and opposite value
                        const filter = `${item.field}.is.null,${item.field}.eq.${!item.value}`;
                        countQuery.or(filter);
                        query.or(filter);
                        break;
                      }
                    }
                    break;
                  }
                  case 'startsWith':
                    countQuery.ilike(item.field, `${item.value}%`);
                    query.ilike(item.field, `${item.value}%`);
                    break;
                  case 'endsWith':
                    countQuery.ilike(item.field, `%${item.value}`);
                    query.ilike(item.field, `%${item.value}`);
                    break;
                  case 'greaterThan':
                    countQuery.gt(item.field, item.value);
                    query.gt(item.field, item.value);
                    break;
                  case 'lessThan':
                    countQuery.lt(item.field, item.value);
                    query.lt(item.field, item.value);
                    break;
                  case 'between':
                    if (Array.isArray(item.value) && item.value.length === 2) {
                      countQuery
                        .gte(item.field, item.value[0])
                        .lte(item.field, item.value[1]);
                      query
                        .gte(item.field, item.value[0])
                        .lte(item.field, item.value[1]);
                    }
                    break;
                }
              }
            }
          });
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        setTotalCount(count || 0);

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        setCustomers(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch customers');
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [page, pageSize, search, options.searchText, JSON.stringify(options.activeFilters)]);

  const refreshCustomers = () => {
    setPage(1);
    setSearch(search); // Trigger re-fetch
  };

  return {
    customers,
    loading,
    error,
    totalCount,
    page,
    setPage,
    search,
    setSearch,
    refreshCustomers,
    pageSize,
  };
}
