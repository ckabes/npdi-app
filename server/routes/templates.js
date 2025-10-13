const express = require('express');
const router = express.Router();
const TicketTemplate = require('../models/TicketTemplate');
const FormConfiguration = require('../models/FormConfiguration');

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

// Create new template
router.post('/', async (req, res) => {
  try {
    const { name, description, formConfiguration, assignedUsers, createdBy } = req.body;

    // Validate required fields
    if (!name || !formConfiguration) {
      return res.status(400).json({ message: 'Name and form configuration are required' });
    }

    // Check if template name already exists
    const existingTemplate = await TicketTemplate.findOne({ name });
    if (existingTemplate) {
      return res.status(400).json({ message: 'Template with this name already exists' });
    }

    // Verify form configuration exists
    const formConfig = await FormConfiguration.findById(formConfiguration);
    if (!formConfig) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    const template = new TicketTemplate({
      name,
      description: description || '',
      formConfiguration,
      assignedUsers: assignedUsers || [],
      createdBy: createdBy || 'system',
      updatedBy: createdBy || 'system'
    });

    await template.save();

    const populatedTemplate = await TicketTemplate.findById(template._id)
      .populate('formConfiguration');

    res.status(201).json(populatedTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template', error: error.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const { name, description, formConfiguration, isDefault, assignedUsers, updatedBy } = req.body;

    const template = await TicketTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if name is being changed and if new name already exists
    if (name && name !== template.name) {
      const existingTemplate = await TicketTemplate.findOne({ name, _id: { $ne: req.params.id } });
      if (existingTemplate) {
        return res.status(400).json({ message: 'Template with this name already exists' });
      }
    }

    // Verify form configuration exists if being updated
    if (formConfiguration) {
      const formConfig = await FormConfiguration.findById(formConfiguration);
      if (!formConfig) {
        return res.status(404).json({ message: 'Form configuration not found' });
      }
    }

    // Update fields
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (formConfiguration) template.formConfiguration = formConfiguration;
    if (isDefault !== undefined) template.isDefault = isDefault;
    if (assignedUsers !== undefined) template.assignedUsers = assignedUsers;
    if (updatedBy) template.updatedBy = updatedBy;

    await template.save();

    const populatedTemplate = await TicketTemplate.findById(template._id)
      .populate('formConfiguration');

    res.json(populatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Failed to update template', error: error.message });
  }
});

// Delete template (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const template = await TicketTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Don't allow deleting the default template
    if (template.isDefault) {
      return res.status(400).json({ message: 'Cannot delete the default template' });
    }

    // Soft delete by marking as inactive
    template.isActive = false;
    await template.save();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template', error: error.message });
  }
});

// Assign template to users
router.patch('/:id/assign', async (req, res) => {
  try {
    const { userEmails, updatedBy } = req.body;

    if (!userEmails || !Array.isArray(userEmails)) {
      return res.status(400).json({ message: 'User emails array is required' });
    }

    const template = await TicketTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Remove these users from other templates first
    await TicketTemplate.updateMany(
      { _id: { $ne: req.params.id } },
      { $pull: { assignedUsers: { $in: userEmails } } }
    );

    // Add users to this template (avoid duplicates)
    const uniqueEmails = [...new Set([...template.assignedUsers, ...userEmails])];
    template.assignedUsers = uniqueEmails;

    if (updatedBy) {
      template.updatedBy = updatedBy;
    }

    await template.save();

    const populatedTemplate = await TicketTemplate.findById(template._id)
      .populate('formConfiguration');

    res.json(populatedTemplate);
  } catch (error) {
    console.error('Error assigning template:', error);
    res.status(500).json({ message: 'Failed to assign template', error: error.message });
  }
});

// Unassign users from template
router.patch('/:id/unassign', async (req, res) => {
  try {
    const { userEmails, updatedBy } = req.body;

    if (!userEmails || !Array.isArray(userEmails)) {
      return res.status(400).json({ message: 'User emails array is required' });
    }

    const template = await TicketTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Remove users from this template
    template.assignedUsers = template.assignedUsers.filter(
      email => !userEmails.includes(email)
    );

    if (updatedBy) {
      template.updatedBy = updatedBy;
    }

    await template.save();

    const populatedTemplate = await TicketTemplate.findById(template._id)
      .populate('formConfiguration');

    res.json(populatedTemplate);
  } catch (error) {
    console.error('Error unassigning template:', error);
    res.status(500).json({ message: 'Failed to unassign template', error: error.message });
  }
});

module.exports = router;
