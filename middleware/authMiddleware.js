// authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY';

export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(403).json({ 
            success: false,
            message: 'Token has expired' 
          });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ 
            success: false,
            message: 'Invalid token' 
          });
        }
        return res.status(403).json({ 
          success: false,
          message: 'Token verification failed' 
        });
      }
      
      // Attach user data to request
      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email
      };
      
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
}

// Optional: Middleware to authenticate but not require token (for optional auth)
export function authenticateTokenOptional(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = {
          id: decoded.id,
          role: decoded.role,
          email: decoded.email
        };
      }
      next();
    });
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
}