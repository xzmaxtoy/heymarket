import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';
import { 
  Template, 
  TemplateMutation,
  TEMPLATE_VALIDATION_RULES,
  TemplateValidationError
} from '@/features/templates/types';

// Validate template
const validateTemplate = (template: TemplateMutation): TemplateValidationError[] => {
  const errors: TemplateValidationError[] = [];

  // Name validation
  if (!template.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (template.name.length > TEMPLATE_VALIDATION_RULES.name.maxLength) {
    errors.push({ 
      field: 'name', 
      message: `Name must be less than ${TEMPLATE_VALIDATION_RULES.name.maxLength} characters` 
    });
  }

  // Content validation
  if (!template.content) {
    errors.push({ field: 'content', message: 'Content is required' });
  } else if (template.content.length > TEMPLATE_VALIDATION_RULES.content.maxLength) {
    errors.push({ 
      field: 'content', 
      message: `Content must be less than ${TEMPLATE_VALIDATION_RULES.content.maxLength} characters` 
    });
  }

  // Description validation
  if (template.description && 
      template.description.length > TEMPLATE_VALIDATION_RULES.description.maxLength) {
    errors.push({ 
      field: 'description', 
      message: `Description must be less than ${TEMPLATE_VALIDATION_RULES.description.maxLength} characters` 
    });
  }

  return errors;
};

// Fetch templates
export const fetchTemplates = createAsyncThunk(
  'templates/fetchTemplates',
  async ({ 
    page, 
    pageSize, 
    filter 
  }: { 
    page: number; 
    pageSize: number; 
    filter?: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } 
  }) => {
    try {
      console.log('Fetching templates with params:', { page, pageSize, filter });
      
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filter?.search && { search: filter.search }),
        ...(filter?.sortBy && { sortBy: filter.sortBy }),
        ...(filter?.sortOrder && { sortOrder: filter.sortOrder })
      });

      const response = await api.get<{
        templates: Template[];
        total: number;
      }>(`/api/templates?${params.toString()}`);

      console.log('Fetched templates:', response);
      return response;
    } catch (error) {
      console.error('Error in fetchTemplates:', error);
      throw error;
    }
  }
);

// Create template
export const createTemplate = createAsyncThunk(
  'templates/createTemplate',
  async (template: TemplateMutation) => {
    try {
      // Validate template
      const errors = validateTemplate(template);
      if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
      }

      const response = await api.post<Template>('/api/templates', {
        name: template.name,
        content: template.content,
        description: template.description
      });

      console.log('Created template:', response);
      return response;
    } catch (error) {
      console.error('Error in createTemplate:', error);
      throw error;
    }
  }
);

// Update template
export const updateTemplate = createAsyncThunk(
  'templates/updateTemplate',
  async ({ id, template }: { id: string; template: TemplateMutation }) => {
    try {
      // Validate template
      const errors = validateTemplate(template);
      if (errors.length > 0) {
        throw new Error(JSON.stringify(errors));
      }

      const response = await api.patch<Template>(`/api/templates/${id}`, {
        name: template.name,
        content: template.content,
        description: template.description
      });

      console.log('Updated template:', response);
      return response;
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      throw error;
    }
  }
);

// Delete template
export const deleteTemplate = createAsyncThunk(
  'templates/deleteTemplate',
  async (id: string) => {
    try {
      await api.delete(`/api/templates/${id}`);
      return id;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  }
);

// Preview template
export const previewTemplate = createAsyncThunk(
  'templates/previewTemplate',
  async ({ id, variables }: { id: string; variables: Record<string, string> }) => {
    try {
      const response = await api.post<{
        text: string;
        variables: string[];
        error?: string;
      }>(`/api/templates/${id}/preview`, { variables });

      console.log('Template preview:', response);
      return response;
    } catch (error) {
      console.error('Error in previewTemplate:', error);
      throw error;
    }
  }
);
