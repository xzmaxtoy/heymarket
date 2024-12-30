import express from 'express';
import { createBatch, getBatch, batches } from '../models/batch.js';
import { requestLogger, getRequestHistory } from '../middleware/requestLogger.js';

const router = express.Router();

// Get request history and active batches
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = getRequestHistory(limit);

    // Get all active batches from memory
    const activeBatches = [];
    batches.forEach((batch, id) => {
      activeBatches.push({
        id: id,
        status: batch.status,
        created: batch.timing.created,
        template: {
          id: batch.template.id,
          text: batch.template.text
        },
        progress: batch.progress,
        metrics: batch.metrics
      });
    });

    // Log response for debugging
    const response = {
      success: true,
      data: {
        history: history,
        activeBatches: activeBatches
      }
    };
    console.log('History Response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get history',
      message: error.message
    });
  }
});

// Create batch
router.post('/', async (req, res) => {
  try {
    const { text, recipients, batchId, options = {} } = req.body;

    // Validate request
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Non-empty recipients array is required'
      });
    }

    // Validate text
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Message text is required'
      });
    }

    // Validate and format each recipient's phone number
    const formattedRecipients = recipients.map(recipient => {
      if (!recipient.phoneNumber || !recipient.variables) {
        throw new Error('Each recipient must have phoneNumber and variables');
      }

      // Format phone number by removing non-digits
      let phone = recipient.phoneNumber.replace(/\D/g, '');

      // Validate phone number format
      if (phone.length === 10) {
        phone = '1' + phone;
      } else if (phone.length === 11 && !phone.startsWith('1')) {
        phone = '1' + phone.substring(1);
      } else if (phone.length !== 11 || !phone.startsWith('1')) {
        throw new Error('Phone number must be 10 digits or 11 digits starting with 1');
      }

      return {
        ...recipient,
        phoneNumber: phone
      };
    });

    // Check for duplicate batch ID
    if (batchId) {
      try {
        const existingBatch = getBatch(batchId);
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

    // Log detailed request information
    console.log('Batch Request:', {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'no-request-id',
      auth: {
        hasApiKey: !!req.apiKey,
        keyPrefix: req.apiKey ? req.apiKey.substring(0, 8) + '...' : 'none'
      },
      text: text,
      recipients: {
        count: recipients.length,
        sample: recipients.slice(0, 2).map(r => ({
          phoneNumber: r.phoneNumber,
          variableCount: Object.keys(r.variables || {}).length
        }))
      },
      options: {
        ...options,
        priority: options.priority || 'normal',
        hasSchedule: !!options.scheduleTime
      }
    });

    // Create and start batch
    const batch = await createBatch({ text }, formattedRecipients, { ...options, batchId }, req);
    
    // Log batch creation result
    console.log('Batch Created:', {
      timestamp: new Date().toISOString(),
      batchId: batch.id,
      state: batch.getState(),
      timing: {
        created: batch.timing.created,
        estimatedCompletion: batch.timing.estimated_completion
      },
      progress: batch.progress,
      metrics: batch.metrics
    });

    // Return initial status
    res.status(201).json({
      success: true,
      data: batch.getState()
    });
  } catch (error) {
    console.error('Error creating batch:', error);
    
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
    
    // Log status request
    console.log('Batch Status Request:', {
      timestamp: new Date().toISOString(),
      batchId,
      requestId: req.headers['x-request-id'] || 'no-request-id',
      auth: {
        hasApiKey: !!req.apiKey,
        keyPrefix: req.apiKey ? req.apiKey.substring(0, 8) + '...' : 'none'
      }
    });
    
    const batch = getBatch(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: 'Invalid batch ID or status expired'
      });
    }

    const state = batch.getState();
    
    // Log status response
    console.log('Batch Status Response:', {
      timestamp: new Date().toISOString(),
      batchId,
      status: state.status,
      progress: state.progress,
      metrics: state.metrics,
      timing: {
        created: state.timing.created,
        elapsed: Date.now() - new Date(state.timing.created).getTime()
      }
    });

    res.json({
      success: true,
      data: state
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
