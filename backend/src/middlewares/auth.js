const jwt = require('jsonwebtoken');
const db = require('../config/db');

const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users')
      .select('users.id', 'users.username', 'users.email', 'roles.name as role', 'users.is_active', 'users.team_id')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('users.id', decoded.userId)
      .first();
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid token or inactive user.' });
    }

    // Get user permissions
    const permissions = await db('user_permissions')
      .select('permission')
      .where('user_id', user.id);
    
    user.permissions = permissions.map(p => p.permission);
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions. Required role: ' + allowedRoles.join(' or ') });
    }
    
    next();
  };
};

const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    // Admin role has all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: `Insufficient permissions. Required: ${requiredPermission}` });
    }
    
    next();
  };
};

const requireAnyPermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    
    // Admin role has all permissions
    if (req.user.role === 'admin') {
      return next();
    }
    
    const hasPermission = requiredPermissions.some(perm => req.user.permissions.includes(perm));
    if (!hasPermission) {
      return res.status(403).json({ error: `Insufficient permissions. Required one of: ${requiredPermissions.join(', ')}` });
    }
    
    next();
  };
};

// Legacy export for backwards compatibility
const auth = requireAuth;

module.exports = {
  auth,
  requireAuth,
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireOwnershipOrAdmin: () => {
    return async (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userId = parseInt(req.params.id);
      
      // Allow if user is accessing their own data or is an admin
      if (req.user.id === userId || req.user.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ error: 'Access denied. Can only access own data.' });
    };
  }
};
