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

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = {
  authenticateProfile,
  requireAdmin,
  // Aliases for convenience
  protect: authenticateProfile,
  adminOnly: requireAdmin
};