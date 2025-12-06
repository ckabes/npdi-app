const express = require('express');
const router = express.Router();
const TicketTemplate = require('../models/TicketTemplate');

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await TicketTemplate.find({ isActive: true })
      .populate('formConfiguration')
      .sort({ isDefault: -1, name: 1 });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await TicketTemplate.findById(req.params.id)
      .populate('formConfiguration');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template', error: error.message });
  }
});

// Get user's assigned template
router.get('/user/:email', async (req, res) => {
  try {
    const userEmail = req.params.email;
    const userRole = req.query.role; // Pass role as query parameter

    // PM Ops users don't have assigned templates
    if (userRole === 'PM_OPS') {
      return res.json({ message: 'PM Ops users do not have assigned templates', template: null });
    }

    // Find template assigned to this user
    let template = await TicketTemplate.findOne({
      assignedUsers: userEmail,
      isActive: true
    }).populate('formConfiguration');

    // If no template found, return default template
    if (!template) {
      template = await TicketTemplate.findOne({
        isDefault: true,
        isActive: true
      }).populate('formConfiguration');
    }

    if (!template) {
      return res.status(404).json({ message: 'No template found for user' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching user template:', error);
    res.status(500).json({ message: 'Failed to fetch user template', error: error.message });
  }
});

module.exports = router;
