const express = require('express');
const router = express.Router();
const FormConfiguration = require('../models/FormConfiguration');
const cacheService = require('../services/cacheService');

// GET active form configuration
router.get('/active', async (req, res) => {
  try {
    const config = await cacheService.getOrSet(
      'form-config',
      'active',
      async () => {
        return await FormConfiguration.findOne({ isActive: true })
          .sort({ updatedAt: -1 })
          .lean();
      },
      10 * 60 * 1000 // 10 minute TTL
    );

    if (!config) {
      return res.status(404).json({ message: 'No active form configuration found' });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching active form configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form configuration',
      error: error.message
    });
  }
});

// GET all form configurations (for read-only viewing)
router.get('/all', async (req, res) => {
  try {
    const configs = await cacheService.getOrSet(
      'form-config',
      'all',
      async () => {
        return await FormConfiguration.find()
          .sort({ updatedAt: -1 })
          .select('name version isActive metadata createdAt updatedAt')
          .limit(100) // Safety limit to prevent unbounded queries
          .lean();
      },
      10 * 60 * 1000 // 10 minute TTL
    );

    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error fetching form configurations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form configurations',
      error: error.message
    });
  }
});

// GET specific form configuration by ID (for read-only viewing)
router.get('/:id', async (req, res) => {
  try {
    const config = await cacheService.getOrSet(
      'form-config',
      req.params.id,
      async () => {
        return await FormConfiguration.findById(req.params.id).lean();
      },
      10 * 60 * 1000 // 10 minute TTL
    );

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching form configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form configuration',
      error: error.message
    });
  }
});

module.exports = router;
