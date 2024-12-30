import express from 'express';
import { employeeList } from '../utils/employeeList.js';
import { getMessageHistory } from '../utils/messageHistory.js';

const router = express.Router();

// Get employee list status
router.get('/employee-list/status', (req, res) => {
  const status = employeeList.getStatus();
  res.json({
    success: true,
    data: status
  });
});

// Force sync employee list
router.post('/employee-list/sync', async (req, res) => {
  try {
    await employeeList.sync();
    const status = employeeList.getStatus();
    res.json({
      success: true,
      data: {
        message: 'Employee list synced successfully',
        status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error.message
    });
  }
});

// Get employee details
router.get('/employee-list/lookup/:phoneNumber', (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const employee = employeeList.getEmployee(phoneNumber);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Phone number does not belong to an employee'
      });
    }
    
    res.json({
      success: true,
      data: {
        phoneNumber,
        ...employee
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid request',
      message: error.message
    });
  }
});

// Get message history for a phone number
router.get('/message-history/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const history = await getMessageHistory(phoneNumber);
    
    res.json({
      success: true,
      data: {
        phoneNumber,
        messages: history
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid request',
      message: error.message
    });
  }
});

export default router;
