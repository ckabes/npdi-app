const mongoose = require('mongoose');
const encryption = require('../utils/encryption');

const systemSettingsSchema = new mongoose.Schema({
  // General Settings
  general: {
    systemName: { type: String, default: 'NPDI Application' },
    systemDescription: { type: String, default: 'New Product Development & Introduction System' },
    companyName: { type: String, default: 'Company Name' },
    supportEmail: { type: String, default: 'support@company.com' }
  },

  // Ticket Configuration
  tickets: {
    autoTicketNumbers: { type: Boolean, default: true },
    ticketPrefix: { type: String, default: 'NPDI' },
    defaultPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    allowDraftEditing: { type: Boolean, default: true },
    maxDraftAge: { type: Number, default: 30 }, // days
    autoSubmitReminder: { type: Number, default: 7 }, // days
    enableStatusHistory: { type: Boolean, default: true },
    enableComments: { type: Boolean, default: true }
  },

  // Security Policies
  security: {
    sessionTimeout: { type: Number, default: 480 }, // minutes
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 15 }, // minutes
    passwordMinLength: { type: Number, default: 8 },
    requireSpecialCharacters: { type: Boolean, default: true },
    requireNumbers: { type: Boolean, default: true },
    requireUppercase: { type: Boolean, default: true },
    passwordExpiry: { type: Number, default: 90 }, // days
    enableTwoFactor: { type: Boolean, default: false },
    auditLogging: { type: Boolean, default: true }
  },

  // Integrations
  integrations: {
    pubchem: {
      enabled: { type: Boolean, default: true },
      timeout: { type: Number, default: 30 }, // seconds
      cacheTime: { type: Number, default: 24 }, // hours
      autoPopulation: { type: Boolean, default: true }
    },
    teams: {
      enabled: { type: Boolean, default: false },
      webhookUrl: { type: String, default: '' },
      notifyOnStatusChange: { type: Boolean, default: true },
      notifyOnTicketCreated: { type: Boolean, default: false },
      notifyOnCommentAdded: { type: Boolean, default: false },
      notifyOnAssignment: { type: Boolean, default: false }
    },
    webhook: {
      enabled: { type: Boolean, default: false },
      url: { type: String, default: '' },
      secret: { type: String, default: '' },
      events: [{ type: String }] // ['ticket.created', 'ticket.updated', etc.]
    },
    langdock: {
      enabled: { type: Boolean, default: false },
      apiKey: { type: String, default: '' }, // Encrypted at rest using AES-256-GCM
      environment: {
        type: String,
        enum: ['dev', 'test', 'staging', 'prod'],
        default: 'dev'  // dev environment confirmed working via diagnostics
      },
      apiVersion: {
        type: String,
        default: '2024-10-21'
      },
      model: {
        type: String,
        default: 'gpt-4o-mini'
      },
      timeout: { type: Number, default: 30 }, // seconds
      maxTokens: { type: Number, default: 2000 },
      quota: {
        total: { type: Number, default: 2000 },
        used: { type: Number, default: 0 },
        remaining: { type: Number, default: 2000 },
        resetDate: { type: Date },
        expiryDate: { type: Date }
      }
    },
    externalAPI: {
      timeout: { type: Number, default: 10 }, // seconds
      retryAttempts: { type: Number, default: 3 }
    },
    palantir: {
      enabled: { type: Boolean, default: false },
      token: { type: String, default: '' }, // Encrypted at rest using AES-256-GCM
      datasetRID: { type: String, default: '' }, // Resource Identifier for the dataset
      hostname: {
        type: String,
        default: 'merckgroup.palantirfoundry.com' // Default Merck Palantir hostname
      },
      timeout: { type: Number, default: 30 }, // seconds
      lastConnectionTest: { type: Date },
      connectionStatus: {
        type: String,
        enum: ['unknown', 'connected', 'failed'],
        default: 'unknown'
      }
    }
  },

  // AI Content Generation Prompts
  aiPrompts: {
    productDescription: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'You are a marketing content writer for MilliporeSigma. Write a compelling, marketing-focused product description for {productName} that sells the product to research scientists. FOCUS ON: 1) Primary research applications and what researchers can achieve with this product, 2) Quality and reliability messaging (high purity, rigorous testing, consistent results), 3) Availability and convenience (multiple package sizes available, ready to ship, flexible ordering), 4) Benefits to the researcher (accelerate research, reliable results, trusted worldwide). AVOID: Technical specifications, CAS numbers, molecular formulas, physical properties - these belong in specification sections. TONE: Professional yet engaging, benefit-focused, confident. Think marketing copy, not technical datasheet. Use active voice and compelling language. Maximum {maxWords} words. IMPORTANT: Format as HTML with <p> for paragraphs, <strong> for key selling points, and <ul><li> for benefit lists. Return ONLY the HTML content.'
      },
      maxWords: { type: Number, default: 200 },
      temperature: { type: Number, default: 0.7, min: 0, max: 2 }
    },
    websiteTitle: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'Create an SEO-optimized webpage title for {productName}. Include the product name and "MilliporeSigma" brand. Keep it under {maxChars} characters. Make it compelling for search engines while remaining accurate. Return ONLY plain text, no HTML or markdown.'
      },
      maxChars: { type: Number, default: 70 },
      temperature: { type: Number, default: 0.5, min: 0, max: 2 }
    },
    metaDescription: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'Write a compelling meta description for {productName} (CAS: {casNumber}). Highlight key benefits: high purity, research quality, multiple sizes. Target researchers searching for this chemical. Maximum {maxChars} characters. Return ONLY plain text, no HTML or markdown.'
      },
      maxChars: { type: Number, default: 160 },
      temperature: { type: Number, default: 0.6, min: 0, max: 2 }
    },
    keyFeatures: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'Generate {bulletCount} concise bullet points highlighting key features and benefits of {productName} for MilliporeSigma\'s product page. Focus on: quality/purity specifications, packaging and availability, application suitability, reliability and support. Format as bullet points, {wordsPerBullet} words each maximum. IMPORTANT: Format as HTML using <ul><li> tags. Return ONLY the HTML <ul> list with <li> items, no additional text or markdown.'
      },
      bulletCount: { type: Number, default: 5, min: 3, max: 10 },
      wordsPerBullet: { type: Number, default: 10, min: 5, max: 20 },
      temperature: { type: Number, default: 0.6, min: 0, max: 2 }
    },
    applications: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'List {itemCount} specific research or industrial applications for {productName} (Formula: {molecularFormula}). Be specific about the scientific fields or processes. IMPORTANT: Format as HTML using <ul><li> tags. Return ONLY the HTML <ul> list with <li> items, no additional text or markdown.'
      },
      itemCount: { type: Number, default: 4, min: 2, max: 8 },
      temperature: { type: Number, default: 0.6, min: 0, max: 2 }
    },
    targetIndustries: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'Identify {itemCount} primary industries or research sectors that would use {productName} (CAS: {casNumber}). Examples: Pharmaceutical R&D, Biotechnology, Academic Research, Chemical Manufacturing, etc. Return as comma-separated text only, no additional explanation.'
      },
      itemCount: { type: Number, default: 4, min: 2, max: 8 },
      temperature: { type: Number, default: 0.5, min: 0, max: 2 }
    }
  },

  // Performance & System
  performance: {
    cache: {
      enabled: { type: Boolean, default: true },
      timeout: { type: Number, default: 300 } // seconds
    },
    files: {
      maxFileSize: { type: Number, default: 10 }, // MB
      maxFilesPerTicket: { type: Number, default: 10 },
      allowedTypes: [{ type: String }] // ['pdf', 'jpg', 'png', etc.]
    },
    database: {
      backupEnabled: { type: Boolean, default: true },
      backupFrequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly'],
        default: 'daily'
      },
      backupRetention: { type: Number, default: 30 } // days
    },
    logging: {
      logRetention: { type: Number, default: 30 }, // days
      enableDebugMode: { type: Boolean, default: false },
      logLevel: {
        type: String,
        enum: ['error', 'warn', 'info', 'debug'],
        default: 'info'
      }
    }
  },

  // Metadata
  lastUpdatedBy: {
    type: String,  // Email address from profile
    default: 'system'
  },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Pre-save middleware to encrypt sensitive fields
systemSettingsSchema.pre('save', function(next) {
  // Encrypt Azure OpenAI API key if it's being modified and not already encrypted
  if (this.isModified('integrations.langdock.apiKey')) {
    const apiKey = this.integrations?.langdock?.apiKey;
    if (apiKey && apiKey !== '' && !encryption.isEncrypted(apiKey)) {
      console.log('Encrypting Azure OpenAI API key...');
      this.integrations.langdock.apiKey = encryption.encrypt(apiKey);
    }
  }

  // Encrypt webhook secret if modified and not already encrypted
  if (this.isModified('integrations.webhook.secret')) {
    const secret = this.integrations?.webhook?.secret;
    if (secret && secret !== '' && !encryption.isEncrypted(secret)) {
      console.log('Encrypting webhook secret...');
      this.integrations.webhook.secret = encryption.encrypt(secret);
    }
  }

  // Encrypt Palantir token if modified and not already encrypted
  if (this.isModified('integrations.palantir.token')) {
    const token = this.integrations?.palantir?.token;
    if (token && token !== '' && !encryption.isEncrypted(token)) {
      console.log('Encrypting Palantir token...');
      this.integrations.palantir.token = encryption.encrypt(token);
    }
  }

  next();
});

// Method to get decrypted API key (for internal use only)
systemSettingsSchema.methods.getDecryptedApiKey = function() {
  const encryptedKey = this.integrations?.langdock?.apiKey;
  if (!encryptedKey || encryptedKey === '') {
    return '';
  }

  try {
    return encryption.decrypt(encryptedKey);
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return '';
  }
};

// Method to get decrypted webhook secret (for internal use only)
systemSettingsSchema.methods.getDecryptedWebhookSecret = function() {
  const encryptedSecret = this.integrations?.webhook?.secret;
  if (!encryptedSecret || encryptedSecret === '') {
    return '';
  }

  try {
    return encryption.decrypt(encryptedSecret);
  } catch (error) {
    console.error('Error decrypting webhook secret:', error);
    return '';
  }
};

// Method to get decrypted Palantir token (for internal use only)
systemSettingsSchema.methods.getDecryptedPalantirToken = function() {
  const encryptedToken = this.integrations?.palantir?.token;
  if (!encryptedToken || encryptedToken === '') {
    return '';
  }

  try {
    return encryption.decrypt(encryptedToken);
  } catch (error) {
    console.error('Error decrypting Palantir token:', error);
    return '';
  }
};

// Ensure only one settings document exists
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Update settings
systemSettingsSchema.statics.updateSettings = async function(updates, userId) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this(updates);
  } else {
    // Deep merge function to properly merge nested objects
    const deepMerge = (target, source) => {
      Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // If target doesn't have this key, create it
          if (!target[key]) {
            target[key] = {};
          }
          // Recursively merge nested objects
          deepMerge(target[key], source[key]);
        } else {
          // For primitives, arrays, and null values, directly assign
          target[key] = source[key];
        }
      });
    };

    // Deep merge updates into existing settings
    deepMerge(settings, updates);
  }

  settings.lastUpdatedBy = userId;
  settings.version += 1;

  // Mark nested paths as modified to trigger pre-save hooks
  if (updates.integrations?.langdock?.apiKey) {
    settings.markModified('integrations.langdock.apiKey');
  }
  if (updates.integrations?.webhook?.secret) {
    settings.markModified('integrations.webhook.secret');
  }
  if (updates.integrations?.palantir?.token) {
    settings.markModified('integrations.palantir.token');
  }

  await settings.save();

  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
