const Permission = require('../models/Permission');

// Profile-based authentication (profile headers)
const authenticateProfile = async (req, res, next) => {
  try {
    const role = req.header('x-user-role');
    const firstName = req.header('x-user-firstname');
    const lastName = req.header('x-user-lastname');
    const email = req.header('x-user-email');
    const sbu = req.header('x-user-sbu');

    if (!role || !email) {
      return res.status(401).json({ message: 'Access denied. No profile selected.' });
    }

    // Create a user object from headers (no database lookup required)
    req.user = {
      role,
      firstName,
      lastName,
      email,
      sbu,
      isActive: true
    };

    next();
  } catch (error) {
    console.error('Profile authentication error:', error);
    res.status(401).json({ message: 'Invalid profile data.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

const checkSBUAccess = (req, res, next) => {
  if (req.user.role === 'PRODUCT_MANAGER') {
    req.sbuFilter = { sbu: req.user.sbu };
  } else if (req.user.role === 'PM_OPS' || req.user.role === 'ADMIN') {
    req.sbuFilter = {};
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user has specific privilege for a section and action
const checkPermission = (section, action) => {
  return async (req, res, next) => {
    try {
      // Admins bypass all permission checks
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Get privileges for user's role
      const rolePrivileges = await Permission.getPrivilegesForRole(req.user.role);

      if (!rolePrivileges) {
        return res.status(403).json({
          message: 'No privileges defined for your role. Please contact an administrator.'
        });
      }

      // Check if the specific privilege exists and is granted
      if (!rolePrivileges[section] || !rolePrivileges[section][action]) {
        return res.status(403).json({
          message: `You do not have permission to ${action} ${section}.`,
          required: `${section}.${action}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        message: 'Error checking permissions',
        error: error.message
      });
    }
  };
};

// Attach user privileges to request object
const attachPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const rolePrivileges = await Permission.getPrivilegesForRole(req.user.role);
    req.permissions = rolePrivileges || {};
    next();
  } catch (error) {
    console.error('Error attaching privileges:', error);
    next();
  }
};

// Helper function to check privilege in controllers
const hasPermission = (permissions, section, action) => {
  return permissions && permissions[section] && permissions[section][action] === true;
};

module.exports = {
  authenticateProfile,
  authorize,
  checkSBUAccess,
  requireAdmin,
  checkPermission,
  attachPermissions,
  hasPermission,
  // Aliases for convenience
  protect: authenticateProfile,
  adminOnly: requireAdmin
};