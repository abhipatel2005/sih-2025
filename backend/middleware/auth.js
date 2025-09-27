const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Check if user is inactive (only if status field exists)
    // Check if user is inactive (only if status field exists)
    if (user.status === 'inactive') {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      status: user.status || 'active', // Default to active if status is missing
      school_id: user.school_id
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Server error in authentication' });
  }
};

// Middleware to check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
};

// Middleware to check if user is admin or teacher (replaces adminOrMentorMiddleware)
const adminOrTeacherMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'teacher' || req.user.role === 'principal')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin, Teacher, or Principal role required.' });
  }
};

// Legacy middleware for backward compatibility
const adminOrMentorMiddleware = adminOrTeacherMiddleware;

// Middleware to check if user is teacher only
const teacherOnlyMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Teacher role required.' });
  }
};

// Middleware to check if user is teacher or principal
const teacherOrPrincipalMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'principal')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Teacher or Principal role required.' });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.status !== 'inactive') {
        req.user = {
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
          status: user.status,
          school_id: user.school_id
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  adminOrMentorMiddleware,
  adminOrTeacherMiddleware,
  teacherOnlyMiddleware,
  teacherOrPrincipalMiddleware,
  optionalAuthMiddleware
};
