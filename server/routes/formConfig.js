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

// PUT update form configuration (save as draft)
router.put('/:id', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    // If this is a published config being converted to a draft for the first time,
    // save the current sections as lastPublishedSections so we can rollback later
    if (!config.isDraft && config.publishedVersion) {
      config.lastPublishedSections = JSON.parse(JSON.stringify(config.sections));
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy') {
        config[key] = req.body[key];
      }
    });

    // Mark as draft when saving
    config.isDraft = true;
    config.updatedBy = req.headers['x-user-email'] || 'system';
    config.updatedAt = Date.now();

    await config.save();

    res.json({
      success: true,
      message: 'Form configuration saved as draft',
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

// POST publish form configuration (increment version and cascade to users)
router.post('/:id/publish', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    // Save the currently published version to lastPublishedSections for rollback
    // We need to check if there's a previously published version to save
    // The key is: we want to save what's CURRENTLY published, not what we're about to publish

    if (config.lastPublishedSections && config.lastPublishedSections.length > 0 && config.isDraft) {
      // We have a draft with saved lastPublishedSections
      // Keep the existing lastPublishedSections (the last published version before draft was made)
      // Don't overwrite it - it contains the version we want to be able to roll back to
    } else if (config.publishedVersion) {
      // This is not the first publish, so save the current sections before publishing
      // This will be either:
      // 1. A published config being republished (save current published state)
      // 2. A draft being published for the first time after a publish (should already have lastPublishedSections)
      config.lastPublishedSections = JSON.parse(JSON.stringify(config.sections));
    }
    // If no publishedVersion exists, this is the first publish - don't save anything

    // Increment version number
    const versionParts = config.version.split('.').map(Number);
    versionParts[1]++; // Increment minor version (e.g., 1.0.0 -> 1.1.0)
    const newVersion = versionParts.join('.');

    // Update configuration
    config.version = newVersion;
    config.publishedVersion = newVersion;
    config.isDraft = false;
    config.lastPublishedAt = Date.now();
    config.updatedBy = req.headers['x-user-email'] || 'system';
    config.updatedAt = Date.now();

    await config.save();

    res.json({
      success: true,
      message: `Form configuration published successfully as version ${newVersion}`,
      data: config
    });
  } catch (error) {
    console.error('Error publishing form configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish form configuration',
      error: error.message
    });
  }
});

// POST discard draft and revert to published version
router.post('/:id/discard-draft', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    if (!config.isDraft) {
      return res.status(400).json({ message: 'No draft to discard' });
    }

    // If we have lastPublishedSections, restore them
    if (config.lastPublishedSections && config.lastPublishedSections.length > 0) {
      config.sections = JSON.parse(JSON.stringify(config.lastPublishedSections));
      config.version = config.publishedVersion;
      config.isDraft = false;
      config.updatedBy = req.headers['x-user-email'] || 'system';
      config.updatedAt = Date.now();

      await config.save();

      res.json({
        success: true,
        message: 'Draft discarded successfully. Reverted to last published version.',
        data: config
      });
    } else {
      return res.status(400).json({
        message: 'Cannot discard draft: No published version available to restore'
      });
    }
  } catch (error) {
    console.error('Error discarding draft:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discard draft',
      error: error.message
    });
  }
});

// POST rollback to last published version
router.post('/:id/rollback', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    // Check if we have a previous version to rollback to
    if (!config.lastPublishedSections || config.lastPublishedSections.length === 0) {
      return res.status(400).json({
        message: 'No previous version available for rollback'
      });
    }

    console.log('=== ROLLBACK DEBUG ===');
    console.log('Current version:', config.version);
    console.log('Current sections count:', config.sections.length);
    console.log('LastPublishedSections count:', config.lastPublishedSections.length);
    console.log('First section in current:', config.sections[0]?.sectionKey);
    console.log('First section in lastPublished:', config.lastPublishedSections[0]?.sectionKey);

    // Restore the last published sections
    config.sections = JSON.parse(JSON.stringify(config.lastPublishedSections));

    console.log('After restoration - sections count:', config.sections.length);
    console.log('First section after restore:', config.sections[0]?.sectionKey);

    // Decrement version number to reflect rollback
    const versionParts = config.version.split('.').map(Number);
    versionParts[1]--; // Decrement minor version
    if (versionParts[1] < 0) versionParts[1] = 0;
    const rolledBackVersion = versionParts.join('.');

    config.version = rolledBackVersion;
    config.publishedVersion = rolledBackVersion;
    config.isDraft = false;
    config.lastPublishedAt = Date.now();
    config.updatedBy = req.headers['x-user-email'] || 'system';
    config.updatedAt = Date.now();

    // Clear lastPublishedSections since we've rolled back
    config.lastPublishedSections = undefined;

    await config.save();

    res.json({
      success: true,
      message: `Successfully rolled back to version ${rolledBackVersion}`,
      data: config
    });
  } catch (error) {
    console.error('Error rolling back form configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rollback form configuration',
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

// POST restore configuration to default
router.post('/:id/restore-default', async (req, res) => {
  try {
    const config = await FormConfiguration.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ message: 'Form configuration not found' });
    }

    // If this is a published config being converted to a draft,
    // save the current sections as lastPublishedSections so we can rollback later
    if (!config.isDraft && config.publishedVersion) {
      config.lastPublishedSections = JSON.parse(JSON.stringify(config.sections));
    }

    // Default form configuration structure (same as seed file)
    const defaultSections = [
      {
        sectionKey: 'productionType',
        name: 'Production Type',
        description: 'Select whether this product is produced internally or procured from external suppliers',
        visible: true,
        collapsible: false,
        defaultExpanded: true,
        order: 0,
        isCustom: false,
        fields: [
          {
            fieldKey: 'productionType',
            label: 'Production Type',
            type: 'radio',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'Produced',
            helpText: 'Select whether this product is produced internally or procured from external suppliers',
            gridColumn: 'full',
            order: 1,
            isCustom: false,
            options: [
              { value: 'Produced', label: 'Produced' },
              { value: 'Procured', label: 'Procured' }
            ]
          }
        ]
      },
      {
        sectionKey: 'basic',
        name: 'Basic Information',
        description: 'Essential product information and categorization',
        visible: true,
        collapsible: true,
        defaultExpanded: true,
        order: 1,
        isCustom: false,
        fields: [
          {
            fieldKey: 'productName',
            label: 'Product Name',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Enter product name',
            helpText: 'The commercial name of the product',
            gridColumn: 'full',
            order: 1,
            isCustom: false
          },
          {
            fieldKey: 'productLine',
            label: 'Product Line',
            type: 'text',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'Chemical Products',
            placeholder: 'Enter product line',
            helpText: 'Product category or line',
            gridColumn: 'half',
            order: 2,
            isCustom: false
          },
          {
            fieldKey: 'sbu',
            label: 'Strategic Business Unit (SBU)',
            type: 'select',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'P90',
            helpText: 'Business unit responsible for this product',
            gridColumn: 'half',
            order: 3,
            isCustom: false,
            options: [
              { value: '775', label: 'SBU 775' },
              { value: 'P90', label: 'SBU P90' },
              { value: '440', label: 'SBU 440' },
              { value: 'P87', label: 'SBU P87' },
              { value: 'P89', label: 'SBU P89' },
              { value: 'P85', label: 'SBU P85' }
            ]
          },
          {
            fieldKey: 'priority',
            label: 'Priority',
            type: 'select',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'MEDIUM',
            helpText: 'Priority level for development',
            gridColumn: 'half',
            order: 4,
            isCustom: false,
            options: [
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' }
            ]
          },
          {
            fieldKey: 'primaryPlant',
            label: 'Primary Plant',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Enter primary manufacturing plant',
            helpText: 'Primary manufacturing location',
            gridColumn: 'half',
            order: 5,
            isCustom: false
          },
          {
            fieldKey: 'brand',
            label: 'Brand',
            type: 'select',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Select brand...',
            helpText: 'Product brand',
            gridColumn: 'half',
            order: 6,
            isCustom: false,
            options: [
              { value: 'Sigma-Aldrich', label: 'Sigma-Aldrich' },
              { value: 'SAFC', label: 'SAFC' },
              { value: 'Supelco', label: 'Supelco' },
              { value: 'Milli-Q', label: 'Milli-Q' },
              { value: 'Millipore', label: 'Millipore' },
              { value: 'BioReliance', label: 'BioReliance' },
              { value: 'Calbiochem', label: 'Calbiochem' },
              { value: 'Merck', label: 'Merck' }
            ]
          }
        ]
      },
      {
        sectionKey: 'vendor',
        name: 'Vendor Information',
        description: 'External supplier and vendor details (shown only for procured products)',
        visible: true,
        collapsible: true,
        defaultExpanded: true,
        order: 2,
        isCustom: false,
        fields: [
          {
            fieldKey: 'vendorName',
            label: 'Vendor Name',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Enter vendor name',
            helpText: 'Name of the external supplier',
            gridColumn: 'half',
            order: 1,
            isCustom: false,
            visibleWhen: {
              fieldKey: 'productionType',
              value: 'Procured'
            }
          },
          {
            fieldKey: 'vendorProductName',
            label: 'Vendor Product Name',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Enter vendor product name',
            helpText: 'Product name as listed by vendor',
            gridColumn: 'half',
            order: 2,
            isCustom: false,
            visibleWhen: {
              fieldKey: 'productionType',
              value: 'Procured'
            }
          },
          {
            fieldKey: 'vendorSAPNumber',
            label: 'Vendor SAP Number',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Enter vendor SAP number',
            helpText: 'SAP vendor identification number',
            gridColumn: 'half',
            order: 3,
            isCustom: false,
            visibleWhen: {
              fieldKey: 'productionType',
              value: 'Procured'
            }
          },
          {
            fieldKey: 'vendorProductNumber',
            label: 'Vendor Product Number',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Enter vendor product number',
            helpText: 'Vendor\'s product catalog number',
            gridColumn: 'half',
            order: 4,
            isCustom: false,
            visibleWhen: {
              fieldKey: 'productionType',
              value: 'Procured'
            }
          }
        ]
      },
      {
        sectionKey: 'chemical',
        name: 'Chemical Properties',
        description: 'Chemical composition and physical properties',
        visible: true,
        collapsible: true,
        defaultExpanded: false,
        order: 3,
        isCustom: false,
        fields: [
          {
            fieldKey: 'casNumber',
            label: 'CAS Number',
            type: 'text',
            required: true,
            visible: true,
            editable: true,
            placeholder: 'e.g., 64-17-5',
            helpText: 'Chemical Abstracts Service registry number',
            gridColumn: 'half',
            order: 1,
            isCustom: false,
            validation: {
              pattern: '^\\d{1,7}-\\d{2}-\\d$'
            }
          },
          {
            fieldKey: 'molecularFormula',
            label: 'Molecular Formula',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'e.g., C2H6O',
            helpText: 'Chemical formula of the compound',
            gridColumn: 'half',
            order: 2,
            isCustom: false
          },
          {
            fieldKey: 'molecularWeight',
            label: 'Molecular Weight',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'e.g., 46.07',
            helpText: 'Molecular weight in g/mol',
            gridColumn: 'half',
            order: 3,
            isCustom: false,
            validation: {
              min: 0,
              step: 0.01
            }
          },
          {
            fieldKey: 'iupacName',
            label: 'IUPAC Name',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'IUPAC systematic name',
            helpText: 'International Union of Pure and Applied Chemistry name',
            gridColumn: 'full',
            order: 4,
            isCustom: false
          },
          {
            fieldKey: 'physicalState',
            label: 'Physical State',
            type: 'select',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 'Solid',
            helpText: 'Physical state at room temperature',
            gridColumn: 'half',
            order: 5,
            isCustom: false,
            options: [
              { value: 'Solid', label: 'Solid' },
              { value: 'Liquid', label: 'Liquid' },
              { value: 'Gas', label: 'Gas' },
              { value: 'Powder', label: 'Powder' },
              { value: 'Crystal', label: 'Crystal' }
            ]
          }
        ]
      },
      {
        sectionKey: 'pricing',
        name: 'Pricing & Margins',
        description: 'Cost structure and pricing calculations',
        visible: true,
        collapsible: true,
        defaultExpanded: false,
        order: 4,
        isCustom: false,
        fields: [
          {
            fieldKey: 'baseUnit',
            label: 'Base Costing Unit',
            type: 'select',
            required: true,
            visible: true,
            editable: true,
            defaultValue: 'g',
            helpText: 'Base unit for cost calculations',
            gridColumn: 'half',
            order: 1,
            isCustom: false,
            options: [
              { value: 'mg', label: 'mg (milligram)' },
              { value: 'g', label: 'g (gram)' },
              { value: 'kg', label: 'kg (kilogram)' },
              { value: 'mL', label: 'mL (milliliter)' },
              { value: 'L', label: 'L (liter)' },
              { value: 'units', label: 'units' },
              { value: 'vials', label: 'vials' },
              { value: 'plates', label: 'plates' }
            ]
          },
          {
            fieldKey: 'rawMaterialCostPerUnit',
            label: 'Raw Material Cost ($/unit)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 0.50,
            helpText: 'Cost of raw materials per base unit',
            gridColumn: 'third',
            order: 2,
            isCustom: false,
            validation: {
              min: 0,
              step: 0.01
            }
          },
          {
            fieldKey: 'packagingCost',
            label: 'Packaging Cost ($/unit)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 2.50,
            helpText: 'Packaging cost per base unit',
            gridColumn: 'third',
            order: 3,
            isCustom: false,
            validation: {
              min: 0,
              step: 0.01
            }
          },
          {
            fieldKey: 'laborOverheadCost',
            label: 'Labor & Overhead ($/unit)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 5.00,
            helpText: 'Labor and overhead costs per base unit',
            gridColumn: 'third',
            order: 4,
            isCustom: false,
            validation: {
              min: 0,
              step: 0.01
            }
          },
          {
            fieldKey: 'targetMargin',
            label: 'Target Margin (%)',
            type: 'number',
            required: false,
            visible: true,
            editable: true,
            defaultValue: 50,
            helpText: 'Target profit margin percentage',
            gridColumn: 'half',
            order: 5,
            isCustom: false,
            validation: {
              min: 0,
              max: 100,
              step: 1
            }
          }
        ]
      },
      {
        sectionKey: 'composition',
        name: 'Product Composition',
        description: 'Define the chemical components that make up this product',
        visible: true,
        collapsible: true,
        defaultExpanded: false,
        order: 5,
        isCustom: false,
        fields: [
          {
            fieldKey: 'composition',
            label: 'Composition Components',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Add composition components',
            helpText: 'This section uses a specialized component for managing product composition',
            gridColumn: 'full',
            order: 1,
            isCustom: false
          }
        ]
      },
      {
        sectionKey: 'quality',
        name: 'Quality Specifications',
        description: 'Define quality attributes and specifications for the product',
        visible: true,
        collapsible: true,
        defaultExpanded: false,
        order: 6,
        isCustom: false,
        fields: [
          {
            fieldKey: 'qualityAttributes',
            label: 'Quality Attributes',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Add quality attributes',
            helpText: 'This section uses a specialized component for managing quality specifications',
            gridColumn: 'full',
            order: 1,
            isCustom: false
          }
        ]
      },
      {
        sectionKey: 'corpbase',
        name: 'CorpBase Website Information',
        description: 'Product information for corporate website and marketing',
        visible: true,
        collapsible: true,
        defaultExpanded: false,
        order: 7,
        isCustom: false,
        fields: [
          {
            fieldKey: 'productDescription',
            label: 'Product Description',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Detailed product description...',
            helpText: 'Comprehensive product description for website',
            gridColumn: 'full',
            order: 1,
            isCustom: false
          },
          {
            fieldKey: 'websiteTitle',
            label: 'Website Title',
            type: 'text',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'SEO-optimized title',
            helpText: 'SEO-optimized title for website',
            gridColumn: 'full',
            order: 2,
            isCustom: false
          },
          {
            fieldKey: 'metaDescription',
            label: 'Meta Description',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'Brief description for search engines (150-160 characters)',
            helpText: 'Meta description for search engine optimization',
            gridColumn: 'full',
            order: 3,
            isCustom: false,
            validation: {
              maxLength: 160
            }
          },
          {
            fieldKey: 'keyFeatures',
            label: 'Key Features & Benefits',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            placeholder: '• High purity and quality\\n• Suitable for research applications',
            helpText: 'Key product features and benefits',
            gridColumn: 'full',
            order: 4,
            isCustom: false
          },
          {
            fieldKey: 'applications',
            label: 'Applications',
            type: 'textarea',
            required: false,
            visible: true,
            editable: true,
            placeholder: 'List key applications...',
            helpText: 'Primary applications for the product',
            gridColumn: 'full',
            order: 5,
            isCustom: false
          }
        ]
      }
    ];

    // Restore sections to default
    config.sections = defaultSections;
    config.updatedBy = req.headers['x-user-email'] || 'system';
    config.updatedAt = Date.now();
    // Mark as draft since we're making changes
    config.isDraft = true;

    await config.save();

    res.json({
      success: true,
      message: 'Configuration restored to default successfully',
      data: config
    });
  } catch (error) {
    console.error('Error restoring default configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore default configuration',
      error: error.message
    });
  }
});

module.exports = router;
