import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error handler caught:', err);

  // Stellar SDK errors
  if (err.response && err.response.data) {
    return res.status(400).json({
      error: 'Blockchain error',
      message: err.response.data.extras?.result_codes || err.message,
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Database constraint violation',
      message: err.detail || err.message,
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
