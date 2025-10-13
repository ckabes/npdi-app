const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN']),
  body('sbu').optional().isIn(['Life Science', 'Process Solutions', 'Electronics', 'Healthcare']),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], authController.register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], authController.login);

router.get('/profile', authController.getProfile);

router.put('/profile', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim()
], authController.updateProfile);

module.exports = router;