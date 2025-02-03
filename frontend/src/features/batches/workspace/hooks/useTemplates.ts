import { useState, useEffect } from 'react';
import { Template } from '@/types/template';
import { supabase } from '@/services/supabase';

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const query = supabase
          .from('sms_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (search) {
          query.or(`name.ilike.%${search}%,content.ilike.%${search}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setTemplates(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch templates');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [search]);

  const refreshTemplates = () => {
    setSearch(search); // Trigger re-fetch
  };

  return {
    templates,
    loading,
    error,
    search,
    setSearch,
    refreshTemplates,
  };
}
