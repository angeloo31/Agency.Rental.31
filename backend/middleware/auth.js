import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/jwtSecret.js';

// Verify JWT and attach user to req
export const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  let token = req.cookies?.token;
  if (!token && authorization) {
    token = authorization.split(' ')[1]; // Format: "Bearer <token>"
  }

  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  try {
    const { _id } = jwt.verify(token, getJwtSecret());
    
    // Find user and attach to request, excluding password hash
    req.user = await User.findById(_id).select('-passwordHash');
    
    if (!req.user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }
    
    next();
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

// Check if authenticated user has Admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required before checking role' });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};

// Check if authenticated user has any of the specified roles (e.g. 'Admin', 'Seller', 'Agent')
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required before checking role' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Access requires one of the following roles: ${allowedRoles.join(', ')}` });
    }

    next();
  };
};

// Check if authenticated user has a specific permission or is an Admin
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required before checking permissions' });
    }

    // Admins bypass granular permission checks
    if (req.user.role === 'Admin') {
      return next();
    }

    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: `Forbidden: Missing required permission '${permission}'` });
    }

    next();
  };
};
