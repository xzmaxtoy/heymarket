import { useState, useEffect } from 'react';
import { Customer } from '@/types/customer';
import { Template } from '@/features/templates/types';
import { useTemplatePreview } from '@/features/templates/hooks/useTemplatePreview';

export const useBatchPreview = (
  template: Template,
  customer: Customer,
  variables: Record<string, string>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { previewContent, setVariableValue } = useTemplatePreview(template, customer);

  useEffect(() => {
    const updatePreview = async () => {
      setLoading(true);
      setError(null);
      try {
        // Set all custom variables
        Object.entries(variables).forEach(([key, value]) => {
          setVariableValue(key, value);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate preview');
      } finally {
        setLoading(false);
      }
    };

    updatePreview();
  }, [template, customer, variables, setVariableValue]);

  return {
    loading,
    error,
    previewContent,
  };
};

export default useBatchPreview;
