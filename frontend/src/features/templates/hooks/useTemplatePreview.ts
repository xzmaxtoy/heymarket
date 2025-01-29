import { useState, useCallback } from 'react';
import { Template } from '../types';
import { Customer } from '@/types/customer';

interface PreviewData {
  content: string;
  variables: Record<string, string>;
}

export const useTemplatePreview = (template: Template) => {
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});

  // Substitute variables in template content with actual values
  const substituteVariables = useCallback((content: string, data: Record<string, string>) => {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      return data[variable] || match;
    });
  }, []);

  // Get preview content with substituted variables
  const getPreviewContent = useCallback(() => {
    if (!template) return '';

    // Combine customer data with custom variables
    const data: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(previewCustomer || {}).map(([key, value]) => [
          key,
          String(value)
        ])
      ),
      ...customVariables,
    };

    return substituteVariables(template.content, data);
  }, [template, previewCustomer, customVariables, substituteVariables]);

  // Get list of missing variables
  const getMissingVariables = useCallback(() => {
    if (!template) return [];

    const variables = new Set(template.variables);
    const availableVariables = new Set([
      ...Object.keys(previewCustomer || {}),
      ...Object.keys(customVariables),
    ]);

    return Array.from(variables).filter(
      variable => !availableVariables.has(variable)
    );
  }, [template, previewCustomer, customVariables]);

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
      variables: {
        ...Object.fromEntries(
          Object.entries(previewCustomer || {}).map(([key, value]) => [
            key,
            String(value)
          ])
        ),
        ...customVariables,
      },
    };
  }, [getPreviewContent, previewCustomer, customVariables]);

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