import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
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
      
      let query = supabase
        .from('sms_templates')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%,content.ilike.%${filter.search}%`);
      }

      // Apply sorting
      if (filter?.sortBy) {
        query = query.order(filter.sortBy, { 
          ascending: filter.sortOrder === 'asc' 
        });
      } else {
        // Default sorting by updated_at desc
        query = query.order('updated_at', { ascending: false });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }

      console.log('Fetched templates:', data, 'count:', count);

      return {
        templates: data as Template[],
        total: count || 0,
      };
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

      const { data, error } = await supabase
        .from('sms_templates')
        .insert({
          name: template.name,
          content: template.content,
          description: template.description,
          variables: template.variables,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating template:', error);
        throw error;
      }

      console.log('Created template:', data);
      return data as Template;
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

      const { data, error } = await supabase
        .from('sms_templates')
        .update({
          name: template.name,
          content: template.content,
          description: template.description,
          variables: template.variables,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        throw error;
      }

      console.log('Updated template:', data);
      return data as Template;
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
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting template:', error);
        throw error;
      }

      return id;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      throw error;
    }
  }
);