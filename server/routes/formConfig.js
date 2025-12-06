const express = require('express');
const router = express.Router();
const FormConfiguration = require('../models/FormConfiguration');

// GET active form configuration
router.get('/active', async (req, res) => {
  try {
    const config = await FormConfiguration.findOne({ isActive: true })
      .sort({ updatedAt: -1 });

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
    const configs = await FormConfiguration.find()
      .sort({ updatedAt: -1 })
      .select('name version isActive metadata createdAt updatedAt');

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
    const config = await FormConfiguration.findById(req.params.id);

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
