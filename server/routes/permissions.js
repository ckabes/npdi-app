const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');

// Get all permissions
router.get('/', async (req, res) => {
  try {
    const permissions = await Permission.find();

    // If no permissions exist, initialize defaults
    if (permissions.length === 0) {
      await Permission.initializeDefaultPermissions();
      const defaultPermissions = await Permission.find();
      return res.json(defaultPermissions);
    }

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      message: 'Failed to fetch permissions',
      error: error.message
    });
  }
});

// Get permissions for a specific role
router.get('/:role', async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    const validRoles = ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let permissions = await Permission.findOne({ role });

    // If permissions don't exist for this role, initialize defaults
    if (!permissions) {
      await Permission.initializeDefaultPermissions();
      permissions = await Permission.findOne({ role });
    }

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({
      message: 'Failed to fetch role permissions',
      error: error.message
    });
  }
});

// Update privileges for a role
router.put('/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { privileges } = req.body;

    // Validate role
    const validRoles = ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate privileges structure
    if (!privileges || typeof privileges !== 'object') {
      return res.status(400).json({ message: 'Invalid privileges format' });
    }

    // Update or create privileges
    const updatedPermissions = await Permission.findOneAndUpdate(
      { role },
      { role, privileges, updatedAt: Date.now() },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: 'Privileges updated successfully',
      permissions: updatedPermissions
    });
  } catch (error) {
    console.error('Error updating privileges:', error);
    res.status(500).json({
      message: 'Failed to update privileges',
      error: error.message
    });
  }
});

// Update a specific privilege for a role
router.patch('/:role/:section/:privilege', async (req, res) => {
  try {
    const { role, section, privilege } = req.params;
    const { value } = req.body;

    // Validate role
    const validRoles = ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate privilege type
    const validPrivileges = ['view', 'edit'];
    if (!validPrivileges.includes(privilege)) {
      return res.status(400).json({ message: 'Invalid privilege type. Must be "view" or "edit"' });
    }

    // Validate value is boolean
    if (typeof value !== 'boolean') {
      return res.status(400).json({ message: 'Privilege value must be boolean' });
    }

    // Build update path
    const updatePath = `privileges.${section}.${privilege}`;

    // Update the specific privilege
    const updatedPermissions = await Permission.findOneAndUpdate(
      { role },
      { $set: { [updatePath]: value, updatedAt: Date.now() } },
      { new: true, upsert: true }
    );

    if (!updatedPermissions) {
      return res.status(404).json({ message: 'Privileges not found' });
    }

    res.json({
      message: 'Privilege updated successfully',
      permissions: updatedPermissions
    });
  } catch (error) {
    console.error('Error updating privilege:', error);
    res.status(500).json({
      message: 'Failed to update privilege',
      error: error.message
    });
  }
});

// Initialize default permissions (can be called manually if needed)
router.post('/initialize', async (req, res) => {
  try {
    await Permission.initializeDefaultPermissions();
    const permissions = await Permission.find();

    res.json({
      message: 'Default permissions initialized successfully',
      permissions
    });
  } catch (error) {
    console.error('Error initializing permissions:', error);
    res.status(500).json({
      message: 'Failed to initialize permissions',
      error: error.message
    });
  }
});

// Get permissions for current user's role
router.get('/user/me', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    let permissions = await Permission.findOne({ role: userRole });

    // If permissions don't exist, initialize defaults
    if (!permissions) {
      await Permission.initializeDefaultPermissions();
      permissions = await Permission.findOne({ role: userRole });
    }

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      message: 'Failed to fetch user permissions',
      error: error.message
    });
  }
});

module.exports = router;
