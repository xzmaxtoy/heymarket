import express from 'express';
import { asyncHandler } from '../../middleware/error.js';
import * as analytics from '../../models/v2/notification_analytics.js';

const router = express.Router();

// Get notification metrics
router.get('/analytics/metrics', asyncHandler(async (req, res) => {
  const metrics = await analytics.getMetrics();
  res.json({
    success: true,
    data: metrics,
  });
}));

// Get channel distribution
router.get('/analytics/channels', asyncHandler(async (req, res) => {
  const channels = await analytics.getChannelDistribution();
  res.json({
    success: true,
    data: channels,
  });
}));

// Get daily volume
router.get('/analytics/volume', asyncHandler(async (req, res) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days by default
  const volume = await analytics.getDailyVolume(startDate);
  res.json({
    success: true,
    data: volume,
  });
}));

// Get notification trends
router.get('/analytics/trends', asyncHandler(async (req, res) => {
  const daysBack = parseInt(req.query.days) || 30;
  const trends = await analytics.getTrends(daysBack);
  res.json({
    success: true,
    data: trends,
  });
}));

// Setup analytics functions
router.post('/analytics/setup', asyncHandler(async (req, res) => {
  await analytics.setupAnalytics();
  res.json({
    success: true,
    message: 'Analytics functions created successfully',
  });
}));

export default router;
