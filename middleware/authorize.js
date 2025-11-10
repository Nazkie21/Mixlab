// authorize.js
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

// Additional authorization checks for specific operations
export const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

export const authorizeInstructor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Instructor or admin access required',
    });
  }

  next();
};

export const authorizeStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Student or admin access required',
    });
  }

  next();
};

// Validate input for admin operations
export const validateCreateLesson = (req, res, next) => {
  const { title, instrument, difficulty_level } = req.body;

  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }

  const validInstruments = ['piano', 'guitar'];
  if (!instrument || !validInstruments.includes(instrument)) {
    errors.push(`Instrument must be one of: ${validInstruments.join(', ')}`);
  }

  const validLevels = ['beginner', 'intermediate', 'advanced'];
  if (!difficulty_level || !validLevels.includes(difficulty_level)) {
    errors.push(`Difficulty level must be one of: ${validLevels.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors,
    });
  }

  next();
};

export const validateUpdateUser = (req, res, next) => {
  const { name, email, role } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  const validRoles = ['student', 'instructor', 'admin'];
  if (!role || !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors,
    });
  }

  next();
};

export const validateAddInstructor = (req, res, next) => {
  const { name, email, password, specialization } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  const validSpecializations = ['piano', 'guitar', 'music_theory', 'composition'];
  if (!specialization || !validSpecializations.includes(specialization)) {
    errors.push(`Specialization must be one of: ${validSpecializations.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors,
    });
  }

  next();
};

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate pagination parameters
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive integer',
      });
    }
  }

  if (limit) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
      });
    }
  }

  next();
};

// Validate date range for reports
export const validateDateRange = (req, res, next) => {
  const { start_date, end_date } = req.query;

  if (start_date && !isValidDate(start_date)) {
    return res.status(400).json({
      success: false,
      message: 'start_date must be in YYYY-MM-DD format',
    });
  }

  if (end_date && !isValidDate(end_date)) {
    return res.status(400).json({
      success: false,
      message: 'end_date must be in YYYY-MM-DD format',
    });
  }

  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'start_date must be before end_date',
      });
    }
  }

  next();
};

// Helper function to validate date format
function isValidDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

// Rate limiting middleware
export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const userRequests = requests.get(userId) || [];

    // Clean old requests outside the time window
    const recentRequests = userRequests.filter(time => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
      });
    }

    recentRequests.push(now);
    requests.set(userId, recentRequests);
    next();
  };
};