const User = require('../models/User');

// Middleware to check if user has specific permission
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasPermission = await User.hasPermission(req.user.id, permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required_permission: permissionName
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Middleware to check if user has any of the specified permissions
const requireAnyPermission = (permissionNames) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      for (const permission of permissionNames) {
        const hasPermission = await User.hasPermission(req.user.id, permission);
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required_permissions: permissionNames
      });
    } catch (error) {
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Middleware to check if user has specific role
const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findWithRole(req.user.id);
      
      if (!user || user.role_name !== roleName) {
        return res.status(403).json({ 
          error: 'Insufficient role',
          required_role: roleName
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole('admin');

// Middleware to check if user can access resource (owner or admin)
const requireOwnershipOrAdmin = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Check if user is admin
      const hasAdminPermission = await User.hasPermission(userId, 'manage_users');
      if (hasAdminPermission) {
        return next();
      }

      // Check if user owns the resource
      if (parseInt(resourceId) === parseInt(userId)) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Access denied - insufficient permissions'
      });
    } catch (error) {
      res.status(500).json({ error: 'Access check failed' });
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireAdmin,
  requireOwnershipOrAdmin
};
