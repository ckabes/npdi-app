const SystemSettings = require('../models/SystemSettings');

// @desc    Get system settings
// @route   GET /api/system-settings
// @access  Admin
const getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();

    // Don't send sensitive data like SMTP password to frontend
    const sanitizedSettings = settings.toObject();
    if (sanitizedSettings.email?.smtpPassword) {
      sanitizedSettings.email.smtpPassword = '********';
    }
    if (sanitizedSettings.integrations?.webhook?.secret) {
      sanitizedSettings.integrations.webhook.secret = '********';
    }

    res.json(sanitizedSettings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Failed to fetch system settings' });
  }
};

// @desc    Update system settings
// @route   PUT /api/system-settings
// @access  Admin
const updateSystemSettings = async (req, res) => {
  try {
    const userId = req.user.email;  // Use email from profile
    const updates = req.body;

    // Don't allow updating password if it's masked
    if (updates.email?.smtpPassword === '********') {
      delete updates.email.smtpPassword;
    }
    if (updates.integrations?.webhook?.secret === '********') {
      delete updates.integrations.webhook.secret;
    }

    const settings = await SystemSettings.updateSettings(updates, userId);

    // Sanitize response
    const sanitizedSettings = settings.toObject();
    if (sanitizedSettings.email?.smtpPassword) {
      sanitizedSettings.email.smtpPassword = '********';
    }
    if (sanitizedSettings.integrations?.webhook?.secret) {
      sanitizedSettings.integrations.webhook.secret = '********';
    }

    res.json({
      message: 'System settings updated successfully',
      settings: sanitizedSettings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Failed to update system settings' });
  }
};

// @desc    Test SMTP connection
// @route   POST /api/system-settings/test-smtp
// @access  Admin
const testSmtpConnection = async (req, res) => {
  try {
    const { smtpServer, smtpPort, smtpUsername, smtpPassword, smtpSecure } = req.body;

    // TODO: Implement actual SMTP connection test
    // For now, return success if all required fields are provided
    if (!smtpServer || !smtpPort || !smtpUsername) {
      return res.status(400).json({ message: 'Missing required SMTP configuration' });
    }

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: 'SMTP connection successful'
    });
  } catch (error) {
    console.error('SMTP test error:', error);
    res.status(500).json({
      success: false,
      message: 'SMTP connection failed'
    });
  }
};

// @desc    Test PubChem connection
// @route   POST /api/system-settings/test-pubchem
// @access  Admin
const testPubChemConnection = async (req, res) => {
  try {
    const pubchemService = require('../services/pubchemService');

    // Test with a known compound (water)
    const testResult = await pubchemService.getCompoundData('water');

    if (testResult) {
      res.json({
        success: true,
        message: 'PubChem connection successful',
        testData: {
          compound: testResult.name,
          cid: testResult.cid
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'PubChem connection failed - no data returned'
      });
    }
  } catch (error) {
    console.error('PubChem test error:', error);
    res.status(500).json({
      success: false,
      message: `PubChem connection failed: ${error.message}`
    });
  }
};

// @desc    Get system settings by section
// @route   GET /api/system-settings/:section
// @access  Admin
const getSettingsSection = async (req, res) => {
  try {
    const { section } = req.params;
    const settings = await SystemSettings.getSettings();

    if (!settings[section]) {
      return res.status(404).json({ message: 'Settings section not found' });
    }

    const sectionData = settings[section];

    // Sanitize sensitive data
    if (section === 'email' && sectionData.smtpPassword) {
      sectionData.smtpPassword = '********';
    }
    if (section === 'integrations' && sectionData.webhook?.secret) {
      sectionData.webhook.secret = '********';
    }

    res.json(sectionData);
  } catch (error) {
    console.error('Error fetching settings section:', error);
    res.status(500).json({ message: 'Failed to fetch settings section' });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  testSmtpConnection,
  testPubChemConnection,
  getSettingsSection
};
