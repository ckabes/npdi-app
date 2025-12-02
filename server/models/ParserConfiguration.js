const mongoose = require('mongoose');

/**
 * ParserConfiguration Model
 * Stores knowledge tables for the Quality Specification Natural Language Parser
 * Allows admin users to manage test attributes, methods, and default mappings
 */

const parserEntrySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true,
    lowercase: true  // Always store keys in lowercase for case-insensitive matching
  },
  value: {
    type: String,
    required: true,
    trim: true  // The properly formatted/capitalized version
  },
  category: {
    type: String,
    trim: true,
    // Categories: 'chemical', 'biological', 'microbiological', 'physical', 'thermal', etc.
  },
  description: {
    type: String,
    trim: true  // Optional description/context for admin users
  },
  // Custom flag to identify user-added entries vs seeded defaults
  isCustom: {
    type: Boolean,
    default: false
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const parserConfigurationSchema = new mongoose.Schema({
  configType: {
    type: String,
    required: true,
    unique: true,
    enum: ['testAttribute', 'testMethod', 'defaultMethod'],
    // testAttribute: Normalizes test/attribute names (e.g., 'purity' -> 'Purity')
    // testMethod: Normalizes test method names (e.g., 'hplc' -> 'HPLC')
    // defaultMethod: Maps test attributes to default methods (e.g., 'purity' -> 'HPLC')
  },
  entries: [parserEntrySchema],

  // Version for cache invalidation
  version: {
    type: Number,
    default: 1
  },

  // Metadata
  totalEntries: {
    type: Number,
    default: 0
  },
  customEntriesCount: {
    type: Number,
    default: 0
  },
  lastModifiedBy: {
    type: String,  // Email from profile
    default: 'system'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast lookups
parserConfigurationSchema.index({ configType: 1 });
parserConfigurationSchema.index({ 'entries.key': 1 });
parserConfigurationSchema.index({ 'entries.category': 1 });

// Pre-save hook to update metadata
parserConfigurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Calculate metadata
  this.totalEntries = this.entries.length;
  this.customEntriesCount = this.entries.filter(e => e.isCustom).length;

  // Update timestamps for modified entries
  this.entries.forEach(entry => {
    if (entry.isModified || entry.isNew) {
      entry.updatedAt = Date.now();
    }
  });

  next();
});

// Static method to get configuration by type
parserConfigurationSchema.statics.getConfigByType = async function(configType) {
  let config = await this.findOne({ configType });
  if (!config) {
    // Create empty config if it doesn't exist
    config = await this.create({
      configType,
      entries: []
    });
  }
  return config;
};

// Static method to get all configurations
parserConfigurationSchema.statics.getAllConfigs = async function() {
  const configs = await this.find({});

  // Ensure all three config types exist
  const configTypes = ['testAttribute', 'testMethod', 'defaultMethod'];
  for (const type of configTypes) {
    if (!configs.find(c => c.configType === type)) {
      const newConfig = await this.create({
        configType: type,
        entries: []
      });
      configs.push(newConfig);
    }
  }

  return configs;
};

// Method to add or update an entry
parserConfigurationSchema.methods.upsertEntry = function(key, value, category = '', description = '', isCustom = false) {
  const normalizedKey = key.toLowerCase().trim();
  const existingIndex = this.entries.findIndex(e => e.key === normalizedKey);

  const entry = {
    key: normalizedKey,
    value: value.trim(),
    category: category.trim(),
    description: description.trim(),
    isCustom,
    updatedAt: Date.now()
  };

  if (existingIndex >= 0) {
    // Update existing entry
    this.entries[existingIndex] = {
      ...this.entries[existingIndex],
      ...entry
    };
  } else {
    // Add new entry
    entry.createdAt = Date.now();
    this.entries.push(entry);
  }

  this.version += 1;  // Increment version for cache invalidation
  return this;
};

// Method to remove an entry by key
parserConfigurationSchema.methods.removeEntry = function(key) {
  const normalizedKey = key.toLowerCase().trim();
  const initialLength = this.entries.length;
  this.entries = this.entries.filter(e => e.key !== normalizedKey);

  if (this.entries.length < initialLength) {
    this.version += 1;  // Increment version for cache invalidation
    return true;
  }
  return false;
};

// Method to bulk import entries
parserConfigurationSchema.methods.bulkImport = function(entries, replaceAll = false) {
  if (replaceAll) {
    this.entries = [];
  }

  entries.forEach(entry => {
    this.upsertEntry(
      entry.key,
      entry.value,
      entry.category || '',
      entry.description || '',
      entry.isCustom || false
    );
  });

  return this;
};

const ParserConfiguration = mongoose.model('ParserConfiguration', parserConfigurationSchema);

module.exports = ParserConfiguration;
