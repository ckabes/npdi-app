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

// GET all form configurations
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

// GET specific form configuration by ID
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

// POST create new form configuration
router.post('/', async (req, res) => {
  try {
    const config = new FormConfiguration({
      ...req.body,
      createdBy: req.headers['x-user-email'] || 'system',
      updatedBy: req.headers['x-user-email'] || 'system'
    });

    await config.save();

    res.status(201).json({
      success: true,
      message: 'Form configuration created successfully',
      data: config
    });
  } catch (error) {
    console.error('Error creating form configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create form configuration',
      error: error.message
    });
  }
});

// PUT update form configuration
router.put('/:id', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy') {
        config[key] = req.body[key];
      }
    });

    config.updatedBy = req.headers['x-user-email'] || 'system';
    config.updatedAt = Date.now();

    await config.save();

    res.json({
      success: true,
      message: 'Form configuration updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating form configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update form configuration',
      error: error.message
    });
  }
});

// PATCH update section order
router.patch('/:id/sections/reorder', async (req, res) => {
  try {
    const { sectionOrders } = req.body; // Array of { sectionKey, order }

    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    // Update section orders
    sectionOrders.forEach(({ sectionKey, order }) => {
      const section = config.sections.find(s => s.sectionKey === sectionKey);
      if (section) {
        section.order = order;
      }
    });

    // Sort sections by order
    config.sections.sort((a, b) => a.order - b.order);

    config.updatedBy = req.headers['x-user-email'] || 'system';
    await config.save();

    res.json({
      success: true,
      message: 'Section order updated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error updating section order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update section order',
      error: error.message
    });
  }
});

// POST add custom section
router.post('/:id/sections', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    const newSection = {
      ...req.body,
      isCustom: true,
      order: config.sections.length
    };

    config.sections.push(newSection);
    config.updatedBy = req.headers['x-user-email'] || 'system';

    await config.save();

    res.json({
      success: true,
      message: 'Section added successfully',
      data: config
    });
  } catch (error) {
    console.error('Error adding section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add section',
      error: error.message
    });
  }
});

// POST add custom field to section
router.post('/:id/sections/:sectionKey/fields', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    const section = config.sections.find(s => s.sectionKey === req.params.sectionKey);

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const newField = {
      ...req.body,
      isCustom: true,
      order: section.fields.length
    };

    section.fields.push(newField);
    config.updatedBy = req.headers['x-user-email'] || 'system';

    await config.save();

    res.json({
      success: true,
      message: 'Field added successfully',
      data: config
    });
  } catch (error) {
    console.error('Error adding field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add field',
      error: error.message
    });
  }
});

// DELETE remove custom section
router.delete('/:id/sections/:sectionKey', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    const sectionIndex = config.sections.findIndex(s => s.sectionKey === req.params.sectionKey);

    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const section = config.sections[sectionIndex];

    if (!section.isCustom) {
      return res.status(403).json({ message: 'Cannot delete built-in sections' });
    }

    config.sections.splice(sectionIndex, 1);
    config.updatedBy = req.headers['x-user-email'] || 'system';

    await config.save();

    res.json({
      success: true,
      message: 'Section deleted successfully',
      data: config
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete section',
      error: error.message
    });
  }
});

// DELETE remove custom field
router.delete('/:id/sections/:sectionKey/fields/:fieldKey', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    const section = config.sections.find(s => s.sectionKey === req.params.sectionKey);

    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const fieldIndex = section.fields.findIndex(f => f.fieldKey === req.params.fieldKey);

    if (fieldIndex === -1) {
      return res.status(404).json({ message: 'Field not found' });
    }

    const field = section.fields[fieldIndex];

    if (!field.isCustom) {
      return res.status(403).json({ message: 'Cannot delete built-in fields' });
    }

    section.fields.splice(fieldIndex, 1);
    config.updatedBy = req.headers['x-user-email'] || 'system';

    await config.save();

    res.json({
      success: true,
      message: 'Field deleted successfully',
      data: config
    });
  } catch (error) {
    console.error('Error deleting field:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete field',
      error: error.message
    });
  }
});

// PATCH set active form configuration
router.patch('/:id/activate', async (req, res) => {
  try {
    // Deactivate all configs
    await FormConfiguration.updateMany({}, { isActive: false });

    // Activate the specified config
    const config = await FormConfiguration.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.headers['x-user-email'] || 'system' },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    res.json({
      success: true,
      message: 'Form configuration activated successfully',
      data: config
    });
  } catch (error) {
    console.error('Error activating form configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate form configuration',
      error: error.message
    });
  }
});

module.exports = router;
