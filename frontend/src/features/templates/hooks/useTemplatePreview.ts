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
      // Map customer fields to variable names (removing curly braces)
      const customerData = Object.entries(previewCustomer).reduce((acc, [key, value]) => {
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

      console.log('Customer data mapped to variables:', customerData); // Debug log

      setCustomVariables(prev => ({
        ...customerData,
        ...prev, // Keep any manually set values
      }));
    }
  }, [previewCustomer]);

  // Update when initialCustomer changes
  useEffect(() => {
    if (initialCustomer) {
      console.log('Initial customer updated:', initialCustomer); // Debug log
      setPreviewCustomer(initialCustomer);
    }
  }, [initialCustomer]);

  // Substitute variables in template content with actual values
  const substituteVariables = useCallback((content: string, data: Record<string, string>) => {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const trimmedVar = variable.trim();
      const value = data[trimmedVar];
      console.log('Substituting variable:', { variable: trimmedVar, value, match }); // Debug log
      return value !== undefined ? value : match;
    });
  }, []);

  // Get preview content with substituted variables
  const getPreviewContent = useCallback(() => {
    if (!template) return '';

    const content = substituteVariables(template.content, customVariables);
    console.log('Generated preview content:', { 
      template: template.content,
      variables: customVariables,
      result: content 
    }); // Debug log
    return content;
  }, [template, customVariables, substituteVariables]);

  // Get list of missing variables
  const getMissingVariables = useCallback(() => {
    if (!template) return [];

    // Extract variables without curly braces
    const variables = template.content.match(/\{\{([^}]+)\}\}/g)?.map(v => v.slice(2, -2).trim()) || [];
    const availableVariables = new Set(Object.keys(customVariables));

    const missing = variables.filter(
      variable => !availableVariables.has(variable) || !customVariables[variable]
    );

    console.log('Missing variables check:', {
      variables,
      available: Array.from(availableVariables),
      missing
    }); // Debug log

    return missing;
  }, [template, customVariables]);

  // Update custom variable value
  const setVariableValue = useCallback((variable: string, value: string) => {
    console.log('Setting variable value:', { variable, value }); // Debug log
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