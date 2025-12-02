const ParserConfiguration = require('../models/ParserConfiguration');

// @desc    Get all parser configurations
// @route   GET /api/parser-config
// @access  Admin
const getAllConfigurations = async (req, res) => {
  try {
    const configs = await ParserConfiguration.getAllConfigs();

    // Transform into a more convenient format for the frontend
    const configData = {
      testAttributes: configs.find(c => c.configType === 'testAttribute') || { entries: [], version: 0 },
      testMethods: configs.find(c => c.configType === 'testMethod') || { entries: [], version: 0 },
      defaultMethods: configs.find(c => c.configType === 'defaultMethod') || { entries: [], version: 0 },
      version: Math.max(...configs.map(c => c.version || 0))  // Overall version for cache invalidation
    };

    res.json(configData);
  } catch (error) {
    console.error('Error fetching parser configurations:', error);
    res.status(500).json({ message: 'Failed to fetch parser configurations' });
  }
};

// @desc    Get configuration by type
// @route   GET /api/parser-config/:configType
// @access  Admin
const getConfigurationByType = async (req, res) => {
  try {
    const { configType } = req.params;

    if (!['testAttribute', 'testMethod', 'defaultMethod'].includes(configType)) {
      return res.status(400).json({ message: 'Invalid configuration type' });
    }

    const config = await ParserConfiguration.getConfigByType(configType);

    res.json(config);
  } catch (error) {
    console.error('Error fetching parser configuration:', error);
    res.status(500).json({ message: 'Failed to fetch parser configuration' });
  }
};

// @desc    Get only version numbers for cache checking
// @route   GET /api/parser-config/version
// @access  Public (for cache invalidation checks)
const getVersion = async (req, res) => {
  try {
    const configs = await ParserConfiguration.find({}, { version: 1, configType: 1 });

    const versionData = {
      testAttribute: configs.find(c => c.configType === 'testAttribute')?.version || 0,
      testMethod: configs.find(c => c.configType === 'testMethod')?.version || 0,
      defaultMethod: configs.find(c => c.configType === 'defaultMethod')?.version || 0,
      overall: Math.max(...configs.map(c => c.version || 0))
    };

    res.json(versionData);
  } catch (error) {
    console.error('Error fetching parser config version:', error);
    res.status(500).json({ message: 'Failed to fetch version' });
  }
};

// @desc    Add or update an entry
// @route   POST /api/parser-config/:configType/entry
// @access  Admin
const upsertEntry = async (req, res) => {
  try {
    const { configType } = req.params;
    const { key, value, category, description, isCustom } = req.body;
    const userId = req.user?.email || 'system';

    if (!['testAttribute', 'testMethod', 'defaultMethod'].includes(configType)) {
      return res.status(400).json({ message: 'Invalid configuration type' });
    }

    if (!key || !value) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    const config = await ParserConfiguration.getConfigByType(configType);

    config.upsertEntry(key, value, category, description, isCustom);
    config.lastModifiedBy = userId;

    await config.save();

    res.json({
      message: 'Entry saved successfully',
      config
    });
  } catch (error) {
    console.error('Error saving parser config entry:', error);
    res.status(500).json({ message: 'Failed to save entry' });
  }
};

// @desc    Delete an entry
// @route   DELETE /api/parser-config/:configType/entry/:key
// @access  Admin
const deleteEntry = async (req, res) => {
  try {
    const { configType, key } = req.params;
    const userId = req.user?.email || 'system';

    if (!['testAttribute', 'testMethod', 'defaultMethod'].includes(configType)) {
      return res.status(400).json({ message: 'Invalid configuration type' });
    }

    const config = await ParserConfiguration.getConfigByType(configType);

    const removed = config.removeEntry(key);

    if (!removed) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    config.lastModifiedBy = userId;
    await config.save();

    res.json({
      message: 'Entry deleted successfully',
      config
    });
  } catch (error) {
    console.error('Error deleting parser config entry:', error);
    res.status(500).json({ message: 'Failed to delete entry' });
  }
};

// @desc    Bulk import entries
// @route   POST /api/parser-config/:configType/bulk
// @access  Admin
const bulkImport = async (req, res) => {
  try {
    const { configType } = req.params;
    const { entries, replaceAll } = req.body;
    const userId = req.user?.email || 'system';

    if (!['testAttribute', 'testMethod', 'defaultMethod'].includes(configType)) {
      return res.status(400).json({ message: 'Invalid configuration type' });
    }

    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: 'Entries must be an array' });
    }

    const config = await ParserConfiguration.getConfigByType(configType);

    config.bulkImport(entries, replaceAll);
    config.lastModifiedBy = userId;

    await config.save();

    res.json({
      message: `Bulk import successful - ${entries.length} entries processed`,
      config
    });
  } catch (error) {
    console.error('Error bulk importing parser config:', error);
    res.status(500).json({ message: 'Failed to bulk import entries' });
  }
};

// @desc    Export configuration as JSON
// @route   GET /api/parser-config/:configType/export
// @access  Admin
const exportConfiguration = async (req, res) => {
  try {
    const { configType } = req.params;
    const { format } = req.query;  // json or csv

    if (!['testAttribute', 'testMethod', 'defaultMethod'].includes(configType)) {
      return res.status(400).json({ message: 'Invalid configuration type' });
    }

    const config = await ParserConfiguration.getConfigByType(configType);

    if (format === 'csv') {
      // CSV export
      const headers = 'Key,Value,Category,Description,Custom\n';
      const rows = config.entries.map(e =>
        `"${e.key}","${e.value}","${e.category || ''}","${e.description || ''}","${e.isCustom}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${configType}-export.csv"`);
      res.send(headers + rows);
    } else {
      // JSON export (default)
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${configType}-export.json"`);
      res.json({
        configType,
        exportedAt: new Date().toISOString(),
        totalEntries: config.totalEntries,
        entries: config.entries
      });
    }
  } catch (error) {
    console.error('Error exporting parser config:', error);
    res.status(500).json({ message: 'Failed to export configuration' });
  }
};

// @desc    Reset configuration to defaults (from seed data)
// @route   POST /api/parser-config/:configType/reset
// @access  Admin
const resetToDefaults = async (req, res) => {
  try {
    const { configType } = req.params;
    const userId = req.user?.email || 'system';

    if (!['testAttribute', 'testMethod', 'defaultMethod'].includes(configType)) {
      return res.status(400).json({ message: 'Invalid configuration type' });
    }

    // This will be called manually or trigger re-seeding
    // For now, just delete all custom entries
    const config = await ParserConfiguration.getConfigByType(configType);

    config.entries = config.entries.filter(e => !e.isCustom);
    config.lastModifiedBy = userId;
    config.version += 1;

    await config.save();

    res.json({
      message: 'Configuration reset to defaults (custom entries removed)',
      config
    });
  } catch (error) {
    console.error('Error resetting parser config:', error);
    res.status(500).json({ message: 'Failed to reset configuration' });
  }
};

// @desc    Search entries
// @route   GET /api/parser-config/:configType/search
// @access  Admin
const searchEntries = async (req, res) => {
  try {
    const { configType } = req.params;
    const { q, category } = req.query;

    if (!['testAttribute', 'testMethod', 'defaultMethod'].includes(configType)) {
      return res.status(400).json({ message: 'Invalid configuration type' });
    }

    const config = await ParserConfiguration.getConfigByType(configType);

    let results = config.entries;

    // Filter by search query
    if (q) {
      const searchTerm = q.toLowerCase();
      results = results.filter(e =>
        e.key.includes(searchTerm) ||
        e.value.toLowerCase().includes(searchTerm) ||
        (e.description && e.description.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by category
    if (category) {
      results = results.filter(e => e.category === category);
    }

    res.json({
      query: q,
      category,
      totalResults: results.length,
      results
    });
  } catch (error) {
    console.error('Error searching parser config:', error);
    res.status(500).json({ message: 'Failed to search entries' });
  }
};

module.exports = {
  getAllConfigurations,
  getConfigurationByType,
  getVersion,
  upsertEntry,
  deleteEntry,
  bulkImport,
  exportConfiguration,
  resetToDefaults,
  searchEntries
};
