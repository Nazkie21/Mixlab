// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({ 
      error: 'Duplicate entry. This record already exists.' 
    });
  }

  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({ 
      error: 'Database table not found. Please check database setup.' 
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      error: 'Database connection refused. Please check database configuration.' 
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
};

