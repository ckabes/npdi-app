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
    }
  },

  // AI Content Generation Prompts
  aiPrompts: {
    productDescription: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'You are a technical content writer for MilliporeSigma, a leading life science company. Generate a professional, informative product description for {productName} (CAS: {casNumber}, Formula: {molecularFormula}). Include: brief introduction of the compound, key chemical properties and characteristics, primary applications in research/industry, quality and purity highlights, and mention of available package sizes. Tone: Professional, scientific, but accessible. Target audience: Research scientists and laboratory professionals. Maximum {maxWords} words.'
      },
      maxWords: { type: Number, default: 200 },
      temperature: { type: Number, default: 0.7, min: 0, max: 2 }
    },
    websiteTitle: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'Create an SEO-optimized webpage title for {productName}. Include the product name and "MilliporeSigma" brand. Keep it under {maxChars} characters. Make it compelling for search engines while remaining accurate.'
      },
      maxChars: { type: Number, default: 70 },
      temperature: { type: Number, default: 0.5, min: 0, max: 2 }
    },
    metaDescription: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'Write a compelling meta description for {productName} (CAS: {casNumber}). Highlight key benefits: high purity, research quality, multiple sizes. Target researchers searching for this chemical. Maximum {maxChars} characters.'
      },
      maxChars: { type: Number, default: 160 },
      temperature: { type: Number, default: 0.6, min: 0, max: 2 }
    },
    keyFeatures: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'Generate {bulletCount} concise bullet points highlighting key features and benefits of {productName} for MilliporeSigma\'s product page. Focus on: quality/purity specifications, packaging and availability, application suitability, reliability and support. Format as bullet points, {wordsPerBullet} words each maximum. Return as newline-separated list with bullet points (•).'
      },
      bulletCount: { type: Number, default: 5, min: 3, max: 10 },
      wordsPerBullet: { type: Number, default: 10, min: 5, max: 20 },
      temperature: { type: Number, default: 0.6, min: 0, max: 2 }
    },
    applications: {
      enabled: { type: Boolean, default: true },
      prompt: {
        type: String,
        default: 'List {itemCount} specific research or industrial applications for {productName} (Formula: {molecularFormula}). Be specific about the scientific fields or processes. Return as newline-separated list.'
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
    // Deep merge updates
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        settings[key] = { ...settings[key], ...updates[key] };
      } else {
        settings[key] = updates[key];
      }
    });
  }

  settings.lastUpdatedBy = userId;
  settings.version += 1;
  await settings.save();

  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;
