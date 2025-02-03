import { useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { BatchPreviewOptions } from '../types';
import { Template, TemplatePreview } from '@/types/template';
import { Customer } from '@/types/customer';

interface UseBatchPreviewResult {
  messages: TemplatePreview[];
  loading: boolean;
  error: string | null;
  generatePreview: (template: Template, customers: Customer[], options?: BatchPreviewOptions) => Promise<void>;
}

export function useBatchPreview(): UseBatchPreviewResult {
  const [messages, setMessages] = useState<TemplatePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert customer data to string values
  const mapCustomerData = useCallback((customer: Customer): Record<string, string> => {
    return Object.entries(customer).reduce((acc, [key, value]) => {
      // Convert boolean and number values to strings
      const stringValue = value === null || value === undefined 
        ? '' 
        : typeof value === 'boolean'
          ? value ? 'Yes' : 'No'
          : String(value);
          
      return {
        ...acc,
        [key]: stringValue,
      };
    }, {});
  }, []);

  // Substitute variables in template content
  const substituteVariables = useCallback((content: string, variables: Record<string, string>) => {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const trimmedVar = variable.trim();
      const value = variables[trimmedVar];
      console.log('Substituting variable:', { variable: trimmedVar, value, match }); // Debug log
      return value !== undefined ? value : match;
    });
  }, []);

  const generatePreview = useCallback(async (
    template: Template,
    customers: Customer[],
    options: BatchPreviewOptions = {}
  ) => {
    try {
      setLoading(true);
      setError(null);

      const previewCount = options.count || 5;
      const selectedCustomers = customers.slice(0, previewCount);
      const batchId = options.batchId || `preview-${Date.now()}`;

      // Generate preview messages
      const previewMessages = selectedCustomers.map(customer => {
        // Map all customer data to string values
        const customerData = mapCustomerData(customer);
        console.log('Mapped customer data:', customerData); // Debug log

        // Extract variables used in template
        const variables = template.content.match(/\{\{([^}]+)\}\}/g)?.map(v => v.slice(2, -2).trim()) || [];
        console.log('Template variables:', variables); // Debug log

        // Create variables object with only used fields
        const usedVariables = variables.reduce((acc, variable) => ({
          ...acc,
          [variable]: customerData[variable] || '',
        }), {});
        console.log('Used variables:', usedVariables); // Debug log

        // Generate preview content
        const content = substituteVariables(template.content, customerData);
        console.log('Generated preview:', { original: template.content, result: content }); // Debug log

        return {
          phoneNumber: customer.phone,
          content,
          variables: usedVariables,
        };
      });

      // Store preview in cache if enabled
      if (template.id) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

        // First, delete any existing cache entries for this batch
        await supabase
          .from('sms_batch_preview_cache')
          .delete()
          .eq('batch_id', batchId);

        // Then insert new cache entries
        for (const [index, customer] of selectedCustomers.entries()) {
          const { error: cacheError } = await supabase
            .from('sms_batch_preview_cache')
            .insert({
              batch_id: batchId,
              template_id: template.id,
              customer_id: customer.id,
              preview_text: previewMessages[index].content,
              variables: previewMessages[index].variables,
              character_count: previewMessages[index].content.length,
              segments: Math.ceil(previewMessages[index].content.length / 160),
              expires_at: expiresAt.toISOString()
            });

          if (cacheError) {
            console.warn('Failed to cache preview for customer:', customer.id, cacheError);
          }
        }
      }

      setMessages(previewMessages);
    } catch (err) {
      console.error('Error generating preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [mapCustomerData, substituteVariables]);

  return {
    messages,
    loading,
    error,
    generatePreview,
  };
}
