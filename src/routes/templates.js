import express from 'express';
import { createTemplate, getTemplate, listTemplates, deleteTemplate } from '../models/template.js';

const router = express.Router();

// Create template
router.post('/', async (req, res) => {
  try {
    const { text, attachments, isPrivate, author } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Template text is required'
      });
    }

    const template = await createTemplate(text, attachments, isPrivate, author);

    res.status(201).json({
      success: true,
      data: template.toJSON()
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

// Get template preview
router.post('/:templateId/preview', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { variables } = req.body;

    const template = await getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

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

// List templates
router.get('/', async (req, res) => {
  try {
    const templates = await listTemplates();
    res.json({
      success: true,
      data: templates
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
    const template = await getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template.toJSON()
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

// Delete template
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const deleted = await deleteTemplate(templateId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

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
