import { Customer } from '@/types/customer';
import { Template } from '@/types/template';

export interface BatchWorkspaceState {
  selectedCustomers: Customer[];
  selectedTemplate: Template | null;
  scheduleTime?: string;
  batchName: string;
  priority: 'high' | 'normal' | 'low';
  step: 'template' | 'customers' | 'preview';
  previewData?: {
    messages: {
      phoneNumber: string;
      content: string;
      variables: Record<string, string>;
    }[];
  };
  // Filter state
  filterMode: 'direct' | 'filtered';
  activeFilters?: FilterGroup[];
  searchText?: string;
}

// Import filter types
import { FilterGroup } from '@/features/customers/filters/types';

export interface BatchValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BatchPreviewOptions {
  count?: number;
  includeVariables?: boolean;
  batchId?: string;
}
