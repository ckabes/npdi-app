const express = require('express');
const router = express.Router();
const TicketTemplate = require('../models/TicketTemplate');
const User = require('../models/User');
const cacheService = require('../services/cacheService');

// Get all templates
router.get('/', async (req, res) => {
  try {
    // Try to get from cache first
    const templates = await cacheService.getOrSet(
      'templates',
      'all',
      async () => {
        const templatesData = await TicketTemplate.find({ isActive: true })
          .populate('formConfiguration')
          .sort({ isDefault: -1, name: 1 })
          .limit(50) // Safety limit to prevent unbounded queries
          .lean();

        return templatesData;
      },
      10 * 60 * 1000 // 10 minute TTL
    );

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  try {
    const template = await cacheService.getOrSet(
      'templates',
      req.params.id,
      async () => {
        const tmpl = await TicketTemplate.findById(req.params.id)
          .populate('formConfiguration')
          .lean();

        if (!tmpl) {
          return null;
        }
        return tmpl;
      },
      10 * 60 * 1000 // 10 minute TTL
    );

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

    // Use cache for user templates
    const template = await cacheService.getOrSet(
      'user-templates',
      userEmail,
      async () => {
        // Find user and populate their assigned template
        const user = await User.findOne({ email: userEmail }).populate({
          path: 'ticketTemplate',
          populate: { path: 'formConfiguration' }
        }).lean();

        let tmpl = null;

        // Check if user has an assigned template and it's active
        if (user?.ticketTemplate && user.ticketTemplate.isActive) {
          tmpl = user.ticketTemplate;
        }

        // If no template found or template is inactive, return default template
        if (!tmpl) {
          tmpl = await TicketTemplate.findOne({
            isDefault: true,
            isActive: true
          }).populate('formConfiguration').lean();
        }

        return tmpl;
      },
      10 * 60 * 1000 // 10 minute TTL
    );

    if (!template) {
      return res.status(404).json({ message: 'No template found for user' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching user template:', error);
    res.status(500).json({ message: 'Failed to fetch user template', error: error.message });
  }
});


// Update submission requirements for a template
router.patch('/:id/requirements', async (req, res) => {
  try {
    const templateId = req.params.id;
    const { submissionRequirements } = req.body;

    if (!Array.isArray(submissionRequirements)) {
      return res.status(400).json({ message: 'submissionRequirements must be an array of field keys' });
    }

    // Find the template and update submission requirements
    const template = await TicketTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    template.submissionRequirements = submissionRequirements;
    template.updatedBy = req.body.updatedBy || 'system';
    await template.save();

    // Invalidate cache
    await cacheService.invalidate('templates', 'all');
    await cacheService.invalidate('templates', 'all-with-users');
    await cacheService.invalidate('templates', templateId);

    res.json({
      message: 'Submission requirements updated successfully',
      template: await TicketTemplate.findById(templateId).populate('formConfiguration').lean()
    });
  } catch (error) {
    console.error('Error updating submission requirements:', error);
    res.status(500).json({ message: 'Failed to update submission requirements', error: error.message });
  }
});

module.exports = router;
