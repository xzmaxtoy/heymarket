import express from 'express';
import axios from 'axios';
import config from '../config/config.js';
import { addHeymarketAuth } from '../middleware/auth.js';

// Initialize router
const router = express.Router();

// Route order matters - more specific routes first
router.route('/range')
  .get(async (req, res, next) => {
    try {
      const { startDate, endDate, page = 1, limit = 50 } = req.query;
      
      // Validate date parameters
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing date parameters',
          message: 'Both startDate and endDate are required'
        });
      }

      // Validate date format
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format',
          message: 'Dates should be in YYYY-MM-DD format'
        });
      }

      // Set time to start and end of day
      startDateTime.setUTCHours(0, 0, 0, 0);
      endDateTime.setUTCHours(23, 59, 59, 999);

      // Get messages from Heymarket API
      const requestConfig = {
        ...addHeymarketAuth(req),
        url: `${config.heymarketBaseUrl}/messages/all`,
        method: 'POST',
        data: {
          created_at: startDateTime.toISOString(),
          order: 'created_at',
          ascending: true,
          limit: 50
        }
      };

      const response = await axios(requestConfig);
      const messages = Array.isArray(response.data) ? response.data : [];

      // Filter messages by date range
      const filteredMessages = messages.filter(msg => {
        const messageDate = new Date(msg.created_at || msg.date);
        return messageDate >= startDateTime && messageDate <= endDateTime;
      });

      // Process messages to get counts and last status
      const phoneStats = new Map();
    
    filteredMessages.forEach(msg => {
      const phone = msg.target || msg.contact?.phone_number || msg.to || msg.from;
      if (!phone) return;
      
      // Ensure phone number is 11 digits (1 + 10 digits)
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '1' + cleanPhone;
      } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('1')) {
        cleanPhone = '1' + cleanPhone.substring(1);
      }
      
      if (!phoneStats.has(cleanPhone)) {
        phoneStats.set(cleanPhone, {
          count: 1,
          lastStatus: msg.status,
          lastDate: msg.date || msg.created_at
        });
      } else {
        const stats = phoneStats.get(cleanPhone);
        stats.count++;
        
        const msgDate = new Date(msg.date || msg.created_at);
        const lastDate = new Date(stats.lastDate);
        
        if (msgDate > lastDate) {
          stats.lastStatus = msg.status;
          stats.lastDate = msg.date || msg.created_at;
        }
      }
    });

    // Convert to array and sort by count
    const results = Array.from(phoneStats.entries())
      .map(([phone, stats]) => ({
        phoneNumber: phone,
        messageCount: stats.count,
        lastStatus: stats.lastStatus
      }))
      .sort((a, b) => b.messageCount - a.messageCount);

    // Handle pagination and return simplified response
    const paginationStart = (parseInt(page) - 1) * parseInt(limit);
    const paginationEnd = paginationStart + parseInt(limit);
    const paginatedResults = results.slice(paginationStart, paginationEnd);

    res.json({
      success: true,
      data: {
        phoneNumbers: paginatedResults,
        total: results.length,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: paginationEnd < results.length
      }
    });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch messages',
        message: error.message
      });
    }
  })
  .post(async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing date parameters',
        message: 'Both startDate and endDate are required'
      });
    }

    // Validate date format
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'Dates should be in YYYY-MM-DD format'
      });
    }

    // Set time to start and end of day
    startDateTime.setUTCHours(0, 0, 0, 0);
    endDateTime.setUTCHours(23, 59, 59, 999);

    // Log request details
    console.log('Fetching messages for date range:', {
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      timestamp: new Date().toISOString()
    });

    // Get messages for each day in the range
    const messages = [];
    const currentDate = new Date(startDateTime);
    
    while (currentDate <= endDateTime) {
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`Fetching messages for ${currentDate.toISOString()} page ${page}`);
        
        const requestConfig = {
          ...addHeymarketAuth(req),
          url: `${config.heymarketBaseUrl}/messages/all`,
          method: 'POST',
          data: {
            created_at: currentDate.toISOString(),
            order: 'created_at',
            ascending: true,
            limit: 50
          }
        };

        try {
          const response = await axios(requestConfig);
          const pageMessages = Array.isArray(response.data) ? response.data : [];
          
          console.log(`Found ${pageMessages.length} messages on page ${page}`);
          messages.push(...pageMessages);
          
          hasMore = pageMessages.length === 50;
          page++;
          
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error.message);
          hasMore = false;
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`Total messages found: ${messages.length}`);

    // Filter messages by date range
    const filteredMessages = messages.filter(msg => {
      const messageDate = new Date(msg.created_at || msg.date);
      return messageDate >= startDateTime && messageDate <= endDateTime;
    });

    // Handle no messages in range
    if (filteredMessages.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No messages found in date range',
        dateRange: {
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        }
      });
    }

    // Group messages by phone number
    const phoneNumberMap = new Map();
    
    filteredMessages.forEach(msg => {
      // Extract phone number from message
      const phone = msg.target || msg.contact?.phone_number || msg.to || msg.from;
      if (!phone) return;
      
      // Ensure phone number is 11 digits (1 + 10 digits)
      let cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '1' + cleanPhone;
      } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('1')) {
        cleanPhone = '1' + cleanPhone.substring(1);
      }
      
      const messageDate = new Date(msg.created_at || msg.date);
      // Only process if we don't have this number yet or if this message is newer
      if (!phoneNumberMap.has(cleanPhone) || 
          messageDate > new Date(phoneNumberMap.get(cleanPhone).date)) {
        phoneNumberMap.set(cleanPhone, {
          id: msg.id,
          text: msg.text,
          date: msg.created_at || msg.date,
          sender: msg.sender,
          status: msg.status,
          type: msg.type,
          channel: msg.channel,
          phoneNumber: cleanPhone
        });
      }
    });

    // Convert map to array and sort by date (newest first)
    const results = Array.from(phoneNumberMap.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Extract and sort phone numbers
    const allPhoneNumbers = Array.from(phoneNumberMap.entries())
      .map(([phone, message]) => ({
        phoneNumber: phone,
        lastMessage: message
      }))
      .sort((a, b) => new Date(b.lastMessage.date) - new Date(a.lastMessage.date));

    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const phoneNumbers = allPhoneNumbers.slice(startIndex, endIndex);

    // Return paginated response
    res.json({
      success: true,
      data: {
        phoneNumbers,
        totalPhoneNumbers: allPhoneNumbers.length,
        dateRange: {
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString()
        },
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(allPhoneNumbers.length / limit),
          hasMore: endIndex < allPhoneNumbers.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching messages by date range:', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    });

    // Map error responses
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: error.response.data?.message || error.message,
        details: error.response?.data
      });
    }

    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: error.response.data?.message || error.message
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: error.response.data?.message || error.message
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error.message
    });
  }
});


// Get all messages for a phone number
router.get('/:phoneNumber/all', async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format',
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Format phone number by adding "1" prefix
    const formattedPhone = `1${phoneNumber}`;

    // Get messages config
    const messagesConfig = {
      ...addHeymarketAuth(req),
      url: `${config.heymarketBaseUrl}/messages`,
      method: 'GET',
      params: {
        phoneNumber: formattedPhone,
        limit: 100
      },
      timeout: 10000
    };
    
    // Get messages data
    const messagesResponse = await axios(messagesConfig);
    
    // Handle empty messages response
    if (!messagesResponse.data || !Array.isArray(messagesResponse.data)) {
      return res.status(404).json({
        success: false,
        error: 'No messages found for this number'
      });
    }

    const messages = messagesResponse.data.map(msg => ({
      id: msg.id,
      text: msg.text,
      date: msg.date || msg.created_at,
      sender: msg.sender,
      status: msg.status,
      type: msg.type,
      channel: msg.channel,
      direction: msg.direction,
      attachments: msg.attachments
    }));

    res.json({
      success: true,
      data: {
        messages,
        totalMessages: messages.length,
        phoneNumber: formattedPhone
      }
    });
  } catch (error) {
    console.error('Error fetching all messages:', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    });

    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'No messages found for this number'
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded'
      });
    }

    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch messages'
    });
  }
});

// Get last message and customer ID for a phone number
router.get('/:phoneNumber', async (req, res, next) => {
  try {
    const { phoneNumber } = req.params;
    
    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format',
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Format phone number by adding "1" prefix
    const formattedPhone = `1${phoneNumber}`;

    // Get messages config
    const messagesConfig = {
      ...addHeymarketAuth(req),
      url: `${config.heymarketBaseUrl}/messages`,
      method: 'GET',
      params: {
        phoneNumber: formattedPhone
      },
      timeout: 5000
    };
    
    // Log request details
    console.log('Request configuration:', {
      phoneNumber: formattedPhone,
      messagesUrl: messagesConfig.url,
      timestamp: new Date().toISOString()
    });
    
    // Get messages data
    const messagesResponse = await axios(messagesConfig);
    
    // Handle empty messages response
    if (!messagesResponse.data || !Array.isArray(messagesResponse.data)) {
      return res.status(404).json({
        success: false,
        error: 'No messages found for this number'
      });
    }

    const messages = messagesResponse.data;
    const lastMessage = messages[0] || null;
    const totalCount = messages.length;

    // Try to get customer ID
    let customerId = null;
    try {
      const customerConfig = {
        ...addHeymarketAuth(req),
        url: `${config.heymarketBaseUrl}/customers/search`,
        method: 'GET',
        params: {
          query: formattedPhone
        },
        timeout: 5000
      };

      const customerResponse = await axios(customerConfig);
      if (customerResponse.data && Array.isArray(customerResponse.data)) {
        const customer = customerResponse.data.find(c => c.phone === formattedPhone);
        if (customer) {
          customerId = customer.id;
        }
      }
    } catch (error) {
      console.log('Customer lookup failed:', error.message);
      // Continue without customer ID
    }

    // Return formatted response
    const result = {
      success: true,
      data: {
        customerId,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          text: lastMessage.text,
          date: lastMessage.date,
          sender: lastMessage.sender,
          status: lastMessage.status,
          type: lastMessage.type,
          channel: lastMessage.channel
        } : null,
        messageStatus: lastMessage?.status || null,
        totalMessages: totalCount,
        phoneNumber: formattedPhone
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error details:', {
      error: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params,
        headers: {
          ...error.config?.headers,
          'Authorization': '***'
        }
      },
      timestamp: new Date().toISOString()
    });

    // Map specific error cases to match frontend expectations
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'No messages found for this number'
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Handle rate limiting errors
    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded'
      });
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'Request timed out'
      });
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable'
      });
    }

    // Handle other API errors
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Failed to fetch messages',
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
    });
  }
});

export default router;
