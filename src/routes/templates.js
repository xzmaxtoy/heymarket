import express from 'express';
import { Template } from '../models/template.js';
import supabaseService from '../services/supabase.js';
const { supabase } = supabaseService;

const router = express.Router();

// Validate template
const validateTemplate = (template) => {
  const errors = [];

  if (!template.name) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!template.content) {
    errors.push({ field: 'content', message: 'Content is required' });
  }

  return errors;
};

// Create template
router.post('/', async (req, res) => {
  try {
    const { name, content, description } = req.body;

    // Validate request
    const errors = validateTemplate({ name, content });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: errors
      });
    }

    // Create template instance to extract variables
    const templateInstance = new Template(
      'temp',
      content,
      [],
      false,
      null
    );

    // Create in Supabase
    const { data, error } = await supabase
      .from('sms_templates')
      .insert({
        name,
        content,
        description,
        variables: templateInstance.variables,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error.message
    });
  }
});

// List templates
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search, sortBy, sortOrder = 'desc' } = req.query;

    let query = supabase
      .from('sms_templates')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,content.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    // Apply pagination
    const from = (parseInt(page) - 1) * parseInt(pageSize);
    const to = from + parseInt(pageSize) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: {
        templates: data,
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list templates',
      message: error.message
    });
  }
});

// Get template
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const { data, error } = await supabase
      .from('sms_templates')
      .select()
      .eq('id', templateId)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template',
      message: error.message
    });
  }
});

// Get template preview
router.post('/:templateId/preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables } = req.body;

    // Get template from Supabase
    const { data: templateData, error } = await supabase
      .from('sms_templates')
      .select()
      .eq('id', templateId)
      .single();

    if (error) throw error;
    if (!templateData) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    // Create template instance for preview
    const template = new Template(
      templateData.id,
      templateData.content,
      [],
      false,
      null
    );

    const preview = template.preview(variables);
    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview template',
      message: error.message
    });
  }
});

// Update template
router.patch('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, content, description } = req.body;

    // Validate request
    const errors = validateTemplate({ name, content });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: errors
      });
    }

    // Create template instance to extract variables
    const templateInstance = new Template(
      'temp',
      content,
      [],
      false,
      null
    );

    const { data, error } = await supabase
      .from('sms_templates')
      .update({
        name,
        content,
        description,
        variables: templateInstance.variables,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
      message: error.message
    });
  }
});

// Delete template
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    const { error } = await supabase
      .from('sms_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      message: error.message
    });
  }
});

export default router;
