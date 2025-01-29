import { useState, useCallback, useEffect } from 'react';
import { Template } from '../types';
import { Customer } from '@/types/customer';

interface PreviewData {
  content: string;
  variables: Record<string, string>;
}

export const useTemplatePreview = (template: Template, initialCustomer?: Customer) => {
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(initialCustomer || null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  // Initialize customVariables with customer data when available
  useEffect(() => {
    if (previewCustomer) {
      const customerData = Object.entries(previewCustomer).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: String(value || ''),
      }), {});
      setCustomVariables(prev => ({
        ...customerData,
        ...prev, // Keep any manually set values
      }));
    }
  }, [previewCustomer]);

  // Update when initialCustomer changes
  useEffect(() => {
    if (initialCustomer) {
      setPreviewCustomer(initialCustomer);
    }
  }, [initialCustomer]);

  // Substitute variables in template content with actual values
  const substituteVariables = useCallback((content: string, data: Record<string, string>) => {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const value = data[variable];
      return value !== undefined ? value : match;
    });
  }, []);

  // Get preview content with substituted variables
  const getPreviewContent = useCallback(() => {
    if (!template) return '';

    return substituteVariables(template.content, customVariables);
  }, [template, customVariables, substituteVariables]);

  // Get list of missing variables
  const getMissingVariables = useCallback(() => {
    if (!template) return [];

    const variables = new Set(template.variables);
    const availableVariables = new Set(Object.keys(customVariables));

    return Array.from(variables).filter(
      variable => !availableVariables.has(variable) || !customVariables[variable]
    );
  }, [template, customVariables]);

  // Update custom variable value
  const setVariableValue = useCallback((variable: string, value: string) => {
    setCustomVariables(prev => ({
      ...prev,
      [variable]: value,
    }));
  }, []);

  // Reset preview data
  const resetPreview = useCallback(() => {
    setPreviewCustomer(null);
    setCustomVariables({});
  }, []);

  // Get preview data for saving
  const getPreviewData = useCallback((): PreviewData => {
    return {
      content: getPreviewContent(),
      variables: customVariables,
    };
  }, [getPreviewContent, customVariables]);

  // Debug logging
  useEffect(() => {
    console.log('Template Preview State:', {
      template,
      initialCustomer,
      previewCustomer,
      customVariables,
      previewContent: getPreviewContent(),
      missingVariables: getMissingVariables(),
    });
  }, [template, initialCustomer, previewCustomer, customVariables, getPreviewContent, getMissingVariables]);

  return {
    // State
    previewCustomer,
    customVariables,
    
    // Computed
    previewContent: getPreviewContent(),
    missingVariables: getMissingVariables(),
    
    // Actions
    setPreviewCustomer,
    setVariableValue,
    resetPreview,
    getPreviewData,
  };
};

export default useTemplatePreview;