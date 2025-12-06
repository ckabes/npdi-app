const express = require('express');
const router = express.Router();
const TicketTemplate = require('../models/TicketTemplate');
const User = require('../models/User');

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

    // Find user and populate their assigned template
    const user = await User.findOne({ email: userEmail }).populate({
      path: 'ticketTemplate',
      populate: { path: 'formConfiguration' }
    });

    let template = null;

    // Check if user has an assigned template and it's active
    if (user?.ticketTemplate && user.ticketTemplate.isActive) {
      template = user.ticketTemplate;
    }

    // If no template found or template is inactive, return default template
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
