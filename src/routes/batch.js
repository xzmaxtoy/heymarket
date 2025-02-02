import express from 'express';
import { createBatch, getBatch, batches } from '../models/batch.js';
import { requestLogger, getRequestHistory } from '../middleware/requestLogger.js';
import { createBatchRecord, createBatchLogs } from '../services/supabase.js';

const router = express.Router();

// Get aggregate analytics across all batches
router.get('/analytics', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const aggregateMetrics = {
      total_messages: 0,
      completed: 0,
      failed: 0,
      success_rate: 0,
      credits_used: 0,
      error_categories: {},
      error_samples: []
    };

    batches.forEach(batch => {
      const batchDate = new Date(batch.timing.created);
      if (batchDate >= start && batchDate <= end) {
        aggregateMetrics.total_messages += batch.progress.total;
        aggregateMetrics.completed += batch.progress.completed;
        aggregateMetrics.failed += batch.progress.failed;
        aggregateMetrics.credits_used += batch.metrics.credits_used;

        // Aggregate error categories
        Object.entries(batch.errors.categories).forEach(([category, count]) => {
          aggregateMetrics.error_categories[category] = (aggregateMetrics.error_categories[category] || 0) + count;
        });

        // Collect error samples
        if (batch.errors.samples.length > 0) {
          aggregateMetrics.error_samples.push(...batch.errors.samples);
        }
      }
    });

    // Calculate success rate
    if (aggregateMetrics.total_messages > 0) {
      aggregateMetrics.success_rate = (aggregateMetrics.completed / aggregateMetrics.total_messages) * 100;
    }

    // Keep only the most recent error samples
    aggregateMetrics.error_samples = aggregateMetrics.error_samples
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      data: aggregateMetrics
    });
  } catch (error) {
    console.error('Error getting aggregate analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get aggregate analytics',
      message: error.message
    });
  }
});

// Get trend data
router.get('/trends', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Group batches by hour
    const hourlyData = new Map();
    
    batches.forEach(batch => {
      const batchDate = new Date(batch.timing.created);
      if (batchDate >= start && batchDate <= end) {
        const hourKey = batchDate.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        
        if (!hourlyData.has(hourKey)) {
          hourlyData.set(hourKey, {
            timestamp: hourKey + ':00:00Z',
            message_volume: 0,
            success_rate: 0,
            error_rate: 0,
            response_time: 0,
            total_batches: 0
          });
        }
        
        const hourData = hourlyData.get(hourKey);
        hourData.message_volume += batch.progress.total;
        hourData.success_rate += (batch.progress.completed / batch.progress.total) * 100;
        hourData.error_rate += (batch.progress.failed / batch.progress.total) * 100;
        hourData.total_batches++;
      }
    });

    // Average the rates
    const trends = Array.from(hourlyData.values()).map(hour => ({
      ...hour,
      success_rate: hour.success_rate / hour.total_batches,
      error_rate: hour.error_rate / hour.total_batches
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting trend data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend data',
      message: error.message
    });
  }
});

// Get system metrics
router.get('/system/metrics', (req, res) => {
  try {
    const metrics = {
      activeConnections: batches.size,
      queueSize: Array.from(batches.values()).reduce((sum, batch) => 
        sum + (batch.status === 'pending' ? batch.progress.pending : 0), 0),
      avgResponseTime: Array.from(batches.values()).reduce((sum, batch) => 
        sum + (batch.metrics.messages_per_second > 0 ? 1000 / batch.metrics.messages_per_second : 0), 0) / batches.size || 0,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // Convert to MB
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics',
      message: error.message
    });
  }
});

import { supabase } from '../services/supabase.js';

// List batches with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    // Calculate pagination range
    const from = (parseInt(page) - 1) * parseInt(pageSize);
    const to = from + parseInt(pageSize) - 1;

    // Fetch batches from Supabase
    let query = supabase
      .from('sms_batches')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data: batches, error, count } = await query;

    if (error) throw error;

    // Map batches to include template and progress info
    const mappedBatches = batches.map(batch => ({
      id: batch.id,
      name: batch.name,
      status: batch.status,
      created_at: batch.created_at,
      template: {
        id: batch.template_id,
      },
      progress: {
        total: batch.total_recipients,
        completed: batch.completed_count,
        failed: batch.failed_count,
        pending: batch.total_recipients - (batch.completed_count + batch.failed_count)
      }
    }));

    // Set cache control headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }).json({
      success: true,
      data: {
        batches: mappedBatches,
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Error listing batches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list batches',
      message: error.message
    });
  }
});

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
    const { name, template, recipients, options = {} } = req.body;

    // Validate request
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Non-empty recipients array is required'
      });
    }

    // Validate template
    if (!template?.text && !template?.id) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Template text or ID is required'
      });
    }

    // Format recipients
    const formattedRecipients = recipients.map(recipient => {
      if (!recipient.phoneNumber || !recipient.variables) {
        throw new Error('Each recipient must have phoneNumber and variables');
      }

      // Format phone number
      let phone = recipient.phoneNumber.replace(/\D/g, '');
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

    // Create batch records in Supabase
    const batchData = {
      name,
      template,
      recipients: formattedRecipients,
      options
    };

    const batchRecord = await createBatchRecord(batchData);
    await createBatchLogs(batchRecord.id, batchData);

    // Create and start batch processing
    const batch = await createBatch(
      template,
      formattedRecipients,
      { ...options, batchId: batchRecord.id },
      req
    );

    // Log batch creation
    console.log('Batch Created:', {
      id: batch.id,
      template: {
        id: template.id,
        text: template.text
      },
      recipientCount: formattedRecipients.length,
      options
    });

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

// Get aggregate analytics across all batches
router.get('/analytics', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const aggregateMetrics = {
      total_messages: 0,
      completed: 0,
      failed: 0,
      success_rate: 0,
      credits_used: 0,
      error_categories: {},
      error_samples: []
    };

    batches.forEach(batch => {
      const batchDate = new Date(batch.timing.created);
      if (batchDate >= start && batchDate <= end) {
        aggregateMetrics.total_messages += batch.progress.total;
        aggregateMetrics.completed += batch.progress.completed;
        aggregateMetrics.failed += batch.progress.failed;
        aggregateMetrics.credits_used += batch.metrics.credits_used;

        // Aggregate error categories
        Object.entries(batch.errors.categories).forEach(([category, count]) => {
          aggregateMetrics.error_categories[category] = (aggregateMetrics.error_categories[category] || 0) + count;
        });

        // Collect error samples
        if (batch.errors.samples.length > 0) {
          aggregateMetrics.error_samples.push(...batch.errors.samples);
        }
      }
    });

    // Calculate success rate
    if (aggregateMetrics.total_messages > 0) {
      aggregateMetrics.success_rate = (aggregateMetrics.completed / aggregateMetrics.total_messages) * 100;
    }

    // Keep only the most recent error samples
    aggregateMetrics.error_samples = aggregateMetrics.error_samples
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      data: aggregateMetrics
    });
  } catch (error) {
    console.error('Error getting aggregate analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get aggregate analytics',
      message: error.message
    });
  }
});

// Get trend data
router.get('/trends', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Group batches by hour
    const hourlyData = new Map();
    
    batches.forEach(batch => {
      const batchDate = new Date(batch.timing.created);
      if (batchDate >= start && batchDate <= end) {
        const hourKey = batchDate.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        
        if (!hourlyData.has(hourKey)) {
          hourlyData.set(hourKey, {
            timestamp: hourKey + ':00:00Z',
            message_volume: 0,
            success_rate: 0,
            error_rate: 0,
            response_time: 0,
            total_batches: 0
          });
        }
        
        const hourData = hourlyData.get(hourKey);
        hourData.message_volume += batch.progress.total;
        hourData.success_rate += (batch.progress.completed / batch.progress.total) * 100;
        hourData.error_rate += (batch.progress.failed / batch.progress.total) * 100;
        hourData.total_batches++;
      }
    });

    // Average the rates
    const trends = Array.from(hourlyData.values()).map(hour => ({
      ...hour,
      success_rate: hour.success_rate / hour.total_batches,
      error_rate: hour.error_rate / hour.total_batches
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting trend data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend data',
      message: error.message
    });
  }
});

// Get system metrics
router.get('/system/metrics', (req, res) => {
  try {
    const metrics = {
      activeConnections: batches.size,
      queueSize: Array.from(batches.values()).reduce((sum, batch) => 
        sum + (batch.status === 'pending' ? batch.progress.pending : 0), 0),
      avgResponseTime: Array.from(batches.values()).reduce((sum, batch) => 
        sum + (batch.metrics.messages_per_second > 0 ? 1000 / batch.metrics.messages_per_second : 0), 0) / batches.size || 0,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // Convert to MB
    };

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics',
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

// Resume batch processing
router.post('/:batchId/resume', async (req, res) => {
  try {
    const { batchId } = req.params;
    console.log('Resuming batch:', batchId);

    // Check memory first
    let batch = getBatch(batchId);
    
    // If not in memory, check database
    if (!batch) {
      try {
        console.log('Fetching batch data from Supabase:', batchId);

        // Fetch batch data and logs
        const [batchResponse, logsResponse] = await Promise.all([
          supabase
            .from('sms_batches')
            .select(`
              *,
              template:template_id (
                id,
                content,
                attachments,
                is_private,
                author
              )
            `)
            .eq('id', batchId)
            .single(),
          supabase
            .from('sms_batch_log')
            .select('targets, variables')
            .eq('batch_id', batchId)
        ]);

        console.log('Batch data response:', {
          hasError: !!batchResponse.error,
          data: batchResponse.data ? {
            id: batchResponse.data.id,
            status: batchResponse.data.status,
            hasTemplate: !!batchResponse.data.template,
            templateId: batchResponse.data.template_id
          } : null
        });

        if (batchResponse.error || !batchResponse.data) {
          return res.status(404).json({
            success: false,
            error: 'Batch not found',
            message: 'Invalid batch ID'
          });
        }

        console.log('Batch logs response:', {
          hasError: !!logsResponse.error,
          recipientCount: logsResponse.data?.length
        });

        if (logsResponse.error) {
          throw logsResponse.error;
        }

        const batchData = batchResponse.data;

        if (batchData.status !== 'pending') {
          return res.status(400).json({
            success: false,
            error: 'Invalid batch status',
            message: 'Only pending batches can be resumed'
          });
        }

        // Map logs to recipients format
        const recipients = logsResponse.data.map(log => ({
          phoneNumber: log.targets,
          variables: log.variables || {}
        }));

        console.log('Creating new batch instance:', {
          templateId: batchData.template_id,
          hasTemplateContent: !!batchData.template?.content,
          recipientCount: recipients.length,
          priority: batchData.priority || 'normal',
          hasScheduledTime: !!batchData.scheduled_for
        });

        // Create new batch instance
        batch = await createBatch(
          { 
            id: batchData.template_id,
            text: batchData.template?.content,
            attachments: batchData.template?.attachments,
            isPrivate: batchData.template?.is_private,
            author: batchData.template?.author
          },
          recipients,
          { 
            batchId,
            priority: batchData.priority || 'normal',
            scheduleTime: batchData.scheduled_for,
            autoStart: false
          },
          req
        );
      } catch (error) {
        console.error('Error recreating batch:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to recreate batch',
          message: error.message
        });
      }
    }

    // Start batch processing
    batch.start({
      apiKey: req.apiKey,
      headers: req.headers
    }).catch(error => {
      console.error('Batch processing error:', error);
      batch.state.fail(error);
    });

    // Log resume request
    console.log('Batch resumed:', {
      timestamp: new Date().toISOString(),
      batchId,
      requestId: req.headers['x-request-id'] || 'no-request-id',
      auth: {
        hasApiKey: !!req.apiKey,
        keyPrefix: req.apiKey ? req.apiKey.substring(0, 8) + '...' : 'none'
      }
    });

    res.json({
      success: true,
      data: batch.getState()
    });
  } catch (error) {
    console.error('Error resuming batch:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume batch',
      message: error.message
    });
  }
});

export default router;
