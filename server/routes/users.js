const express = require('express');
const { body } = require('express-validator');
const devProfileController = require('../controllers/devProfileController');

const router = express.Router();

// All routes work with development profiles (no authentication required for testing)

// Get all users/profiles
router.get('/', devProfileController.getAllProfiles);

// Get single user/profile
router.get('/:id', devProfileController.getProfileById);

// Create new user/profile (password not required for dev profiles)
router.post('/', [
  body('email').isEmail().normalizeEmail(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN']),
  body('sbu').optional().isIn(['Life Science', 'Process Solutions', 'Electronics', 'Healthcare']),
  body('isActive').optional().isBoolean()
], devProfileController.createProfile);

// Update user/profile
router.put('/:id', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN']),
  body('sbu').optional().isIn(['Life Science', 'Process Solutions', 'Electronics', 'Healthcare']),
  body('isActive').optional().isBoolean()
], devProfileController.updateProfile);

// Toggle user/profile active status
router.patch('/:id/toggle-status', devProfileController.toggleProfileStatus);

// Delete user/profile
router.delete('/:id', devProfileController.deleteProfile);

module.exports = router;
