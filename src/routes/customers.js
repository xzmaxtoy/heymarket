import express from 'express';
import { getCustomers, getUniqueCities } from '../utils/customerManager.js';
import { getSetting, saveSetting } from '../utils/smsAppSettings.js';

const router = express.Router();

const COLUMN_SETTINGS_KEY = 'customer_columns';

/**
 * Get customers with advanced filters
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 50, filters } = req.query;

    // Parse filters if they exist
    const parsedFilters = filters ? JSON.parse(decodeURIComponent(filters)) : [];

    const result = await getCustomers(parsedFilters, parseInt(page), parseInt(pageSize));

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: result.count,
        totalPages: Math.ceil(result.count / parseInt(pageSize))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      message: error.message
    });
  }
});

/**
 * Get unique cities for filtering
 */
router.get('/cities', async (req, res) => {
  try {
    const cities = await getUniqueCities();
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities',
      message: error.message
    });
  }
});

// Get column settings
router.get('/settings/columns', async (req, res) => {
  try {
    const settings = await getSetting(COLUMN_SETTINGS_KEY);
    res.json({
      success: true,
      data: settings || {}
    });
  } catch (error) {
    console.error('Error getting column settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get column settings',
      message: error.message
    });
  }
});

// Save column settings
router.post('/settings/columns', async (req, res) => {
  try {
    console.log('Saving column settings:', {
      key: COLUMN_SETTINGS_KEY,
      value: req.body
    });

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      throw new Error('Invalid settings format');
    }

    // Convert to proper format
    const columnSettings = {};
    Object.keys(req.body).forEach(key => {
      columnSettings[key] = Boolean(req.body[key]);
    });

    const success = await saveSetting(COLUMN_SETTINGS_KEY, columnSettings);
    if (!success) {
      console.error('Failed to save settings - saveSetting returned false');
      throw new Error('Failed to save settings');
    }
    
    res.json({
      success: true,
      message: 'Column settings saved successfully',
      data: columnSettings
    });
  } catch (error) {
    console.error('Error saving column settings:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      success: false,
      error: 'Failed to save column settings',
      message: error.message,
      details: error.stack
    });
  }
});

export default router;
