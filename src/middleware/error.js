/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.response) {
    // Log detailed error for debugging
    console.error('API Error Response:', {
      status: err.response.status,
      data: err.response.data,
      headers: err.response.headers
    });
    
    // Forward Heymarket API errors
    return res.status(err.response.status).json(err.response.data);
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

/**
 * Not found middleware
 */
export const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};
