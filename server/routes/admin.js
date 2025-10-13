const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Get comprehensive admin statistics
router.get('/stats', adminController.getAdminStats);

module.exports = router;
