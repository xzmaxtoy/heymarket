export interface Template {
  id: string;
  name: string;
  content: string;
  description?: string;
  variables: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface TemplatePreview {
  content: string;
  variables: Record<string, string>;
}

export interface TemplateFilter {
  search?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

export interface TemplateStats {
  id: string;
  totalUsage: number;
  successRate: number;
  averageDeliveryTime: number;
  lastUsed?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  templates: string[]; // Template IDs
}

// Template validation errors
export interface TemplateValidationError {
  field: string;
  message: string;
}

// Template creation/update payload
export interface TemplateMutation {
  name: string;
  content: string;
  description?: string;
  variables?: string[];
}

// Template list response
export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  pageSize: number;
}

// Variable mapping for customer fields
export interface VariableMapping {
  templateVariable: string;
  customerField: string;
  transform?: (value: any) => string;
}

// Constants
export const TEMPLATE_VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

export const DEFAULT_TEMPLATE_SORT = {
  sortBy: 'updated_at' as const,
  sortOrder: 'desc' as const,
};

export const TEMPLATE_PAGE_SIZES = [10, 25, 50, 100];

export const MAX_TEMPLATE_NAME_LENGTH = 100;
export const MAX_TEMPLATE_CONTENT_LENGTH = 1000;
export const MAX_TEMPLATE_DESCRIPTION_LENGTH = 500;

export const TEMPLATE_VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 1,
    maxLength: MAX_TEMPLATE_NAME_LENGTH,
  },
  content: {
    required: true,
    minLength: 1,
    maxLength: MAX_TEMPLATE_CONTENT_LENGTH,
  },
  description: {
    required: false,
    maxLength: MAX_TEMPLATE_DESCRIPTION_LENGTH,
  },
};