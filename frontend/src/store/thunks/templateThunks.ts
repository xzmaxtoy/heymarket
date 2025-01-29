import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/services/supabase';
import { 
  Template, 
  TemplateFilter, 
  TemplateMutation,
  TemplateStats,
  TemplateListResponse,
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
    filter?: TemplateFilter 
  }): Promise<TemplateListResponse> => {
    try {
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
      }

      // Apply pagination
      query = query
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        templates: data as Template[],
        total: count || 0,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('Error fetching templates:', error);
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
        .insert(template)
        .select()
        .single();

      if (error) throw error;

      return data as Template;
    } catch (error) {
      console.error('Error creating template:', error);
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
        .update(template)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data as Template;
    } catch (error) {
      console.error('Error updating template:', error);
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

      if (error) throw error;

      return id;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }
);

// Fetch template stats
export const fetchTemplateStats = createAsyncThunk(
  'templates/fetchTemplateStats',
  async (templateId: string) => {
    try {
      // This would be replaced with actual stats calculation from batch results
      const { data, error } = await supabase
        .from('sms_batch_log')
        .select('*')
        .eq('template_id', templateId);

      if (error) throw error;

      // Calculate stats from batch logs
      const stats: TemplateStats = {
        id: templateId,
        totalUsage: data.length,
        successRate: data.filter(log => log.status === 'completed').length / data.length * 100,
        averageDeliveryTime: 0, // Would need to calculate from actual delivery times
        lastUsed: data[0]?.created_at,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching template stats:', error);
      throw error;
    }
  }
);