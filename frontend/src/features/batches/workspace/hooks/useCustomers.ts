import { useState, useEffect } from 'react';
import { Customer } from '@/types/customer';
import { supabase } from '@/services/supabase';

interface UseCustomersOptions {
  pageSize?: number;
  filters?: Record<string, any>;
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
        
        // Get total count
        const countQuery = supabase
          .from('customer')
          .select('id', { count: 'exact' });

        if (search) {
          countQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              countQuery.eq(key, value);
            }
          });
        }

        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        setTotalCount(count || 0);

        // Fetch customers
        const startIndex = (page - 1) * pageSize;
        const query = supabase
          .from('customer')
          .select('*')
          .range(startIndex, startIndex + pageSize - 1)
          .order('date_create', { ascending: false });

        if (search) {
          query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              query.eq(key, value);
            }
          });
        }

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
  }, [page, pageSize, search, JSON.stringify(options.filters)]);

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
