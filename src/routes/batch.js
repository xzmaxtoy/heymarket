import express from 'express';
import { createBatch, getBatch } from '../models/batch.js';

const router = express.Router();

// Create batch
router.post('/', async (req, res) => {
  try {
    const { template, recipients, options = {} } = req.body;

    // Validate request
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Non-empty recipients array is required'
      });
    }

    // Validate template
    if (!template?.id && !template?.text) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Either template ID or template text is required'
      });
    }

    // Validate each recipient
    for (const recipient of recipients) {
      if (!recipient.phoneNumber || !recipient.variables) {
        return res.status(400).json({
          success: false,
          error: 'Invalid recipient format',
          message: 'Each recipient must have phoneNumber and variables'
        });
      }
    }

    // Check for duplicate batch ID
    if (options.batchId) {
      try {
        const existingBatch = getBatch(options.batchId);
        if (existingBatch) {
          return res.status(409).json({
            success: false,
            error: 'Duplicate batch ID',
            message: 'A batch with this ID already exists'
          });
        }
      } catch (error) {
        // Ignore error if batch not found
      }
    }

    console.log('Creating batch with:', {
      template: template.id ? `templateId: ${template.id}` : `text: ${template.text}`,
      recipientsCount: recipients.length,
      options
    });

    // Create and start batch
    console.log('Template data:', template); // Debug log
    const batch = await createBatch(template, recipients, options, req);
    
    console.log('Batch created:', batch.getState());

    // Return initial status
    res.status(201).json({
      success: true,
      data: batch.getState()
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    
    // Handle specific error cases
    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        message: 'The specified template does not exist'
      });
    }

    if (error.message === 'Duplicate batch ID') {
      return res.status(409).json({
        success: false,
        error: 'Duplicate batch ID',
        message: 'A batch with this ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create batch',
      message: error.message
    });
  }
});

// Get batch status
router.get('/:batchId', (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = getBatch(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: 'Invalid batch ID or status expired'
      });
    }

    res.json({
      success: true,
      data: batch.getState()
    });
  } catch (error) {
    console.error('Error getting batch status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch status',
      message: error.message
    });
  }
});

// Get batch results
router.get('/:batchId/results', (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = getBatch(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: 'Invalid batch ID or status expired'
      });
    }

    res.json({
      success: true,
      data: {
        batchId,
        results: batch.getResults()
      }
    });
  } catch (error) {
    console.error('Error getting batch results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch results',
      message: error.message
    });
  }
});

// Get batch analytics
router.get('/:batchId/analytics', (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = getBatch(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: 'Invalid batch ID or status expired'
      });
    }

    const state = batch.getState();
    const results = batch.getResults();

    // Calculate additional analytics
    const analytics = {
      ...state.metrics,
      timing: state.timing,
      errorBreakdown: state.errors.categories,
      completionRate: (state.progress.completed / state.progress.total) * 100,
      averageAttemptsPerMessage: results.reduce((sum, r) => sum + (r.attempts || 1), 0) / results.length,
      errorSamples: state.errors.samples
    };

    res.json({
      success: true,
      data: {
        batchId,
        analytics
      }
    });
  } catch (error) {
    console.error('Error getting batch analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch analytics',
      message: error.message
    });
  }
});

// Get batch errors
router.get('/:batchId/errors', (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = getBatch(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: 'Invalid batch ID or status expired'
      });
    }

    const results = batch.getResults();
    const errors = results.filter(r => r.status === 'failed');

    res.json({
      success: true,
      data: {
        batchId,
        total: errors.length,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Error getting batch errors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get batch errors',
      message: error.message
    });
  }
});

export default router;
