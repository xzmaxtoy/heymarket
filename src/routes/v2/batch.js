import express from 'express';
import { batchManager } from '../../models/v2/BatchManager.js';
import { batchValidator } from '../../models/v2/BatchValidator.js';
import { batchPreview } from '../../models/v2/BatchPreview.js';
import { messageQueue } from '../../utils/messageQueue.js';
import { supabase } from '../../services/supabase.js';

const router = express.Router();

/**
 * Initialize batch processing
 */
router.post('/', async (req, res) => {
  try {
    const { batchId, options } = req.body;

    // Get batch and logs in parallel
    const [batchResult, logsResult] = await Promise.all([
      supabase
        .from('sms_batches')
        .select('*')
        .eq('id', batchId)
        .single(),
      supabase
        .from('sms_batch_log')
        .select('*')
        .eq('batch_id', batchId)
    ]);

    if (batchResult.error) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found',
        message: batchResult.error.message
      });
    }

    if (logsResult.error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get batch logs',
        message: logsResult.error.message
      });
    }

    const batch = batchResult.data;
    const logs = logsResult.data;

    // Create messages from logs
    const messages = logs.map(log => ({
      batchId,
      messageId: log.id,
      phoneNumber: log.targets,
      variables: log.variables,
      retryStrategy: options?.retryStrategy || {
        maxAttempts: 3,
        backoffMinutes: 5
      }
    }));

    // Add messages to queue with auto-start if requested
    const auth = {
      apiKey: req.apiKey,
      headers: req.headers
    };
    await messageQueue.addBatch(messages, {
      autoStart: options?.autoStart,
      auth
    });

    // Update batch status if needed
    if (options?.scheduleTime) {
      await supabase
        .from('sms_batches')
        .update({ scheduled_for: options.scheduleTime })
        .eq('id', batchId);
    }

    return res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Batch initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize batch',
      message: error.message
    });
  }
});

/**
 * Resume/start batch processing
 */
router.post('/:batchId/resume', async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchValidator.isValidBatchId(batchId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch ID'
      });
    }

    // Get batch
    const batch = await batchManager.getBatch(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    // Update status to processing
    await batchManager.updateStatus(batchId, 'processing');

    // Start processing with auth
    const auth = {
      apiKey: req.apiKey,
      headers: req.headers
    };
    await messageQueue.processBatch(batchId, auth);

    return res.json({
      success: true,
      message: 'Batch processing started'
    });
  } catch (error) {
    console.error('Error starting batch:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start batch',
      message: error.message
    });
  }
});

/**
 * Get batch status
 */
router.get('/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchValidator.isValidBatchId(batchId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch ID'
      });
    }

    const batch = await batchManager.getBatch(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Batch not found'
      });
    }

    return res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    console.error('Error getting batch:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get batch',
      message: error.message
    });
  }
});

/**
 * Get batch preview
 */
router.get('/:batchId/preview', async (req, res) => {
  try {
    const validation = batchValidator.validatePreviewParams({
      batchId: req.params.batchId,
      previewCount: req.query.previewCount
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const preview = await batchPreview.getPreview(
      req.params.batchId,
      parseInt(req.query.previewCount) || 5
    );

    return res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Error getting preview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get preview',
      message: error.message
    });
  }
});

/**
 * Update batch status
 */
router.patch('/:batchId/status', async (req, res) => {
  try {
    const validation = batchValidator.validateStatusUpdate({
      batchId: req.params.batchId,
      status: req.body.status
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    await batchManager.updateStatus(req.params.batchId, req.body.status, req.body.metadata);

    return res.json({
      success: true
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update status',
      message: error.message
    });
  }
});

/**
 * Get batch analytics
 */
router.get('/:batchId/analytics', async (req, res) => {
  try {
    if (!batchValidator.isValidBatchId(req.params.batchId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch ID'
      });
    }

    const analytics = await batchManager.getAnalytics(req.params.batchId);

    return res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

/**
 * Clear preview cache
 */
router.post('/preview/cache/clear', async (req, res) => {
  try {
    const { batchId } = req.body;
    batchPreview.clearCache(batchId);

    return res.json({
      success: true,
      message: batchId ? `Cache cleared for batch ${batchId}` : 'All cache cleared'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * Get preview cache stats
 */
router.get('/preview/cache/stats', async (req, res) => {
  try {
    const stats = batchPreview.getCacheStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

export default router;
