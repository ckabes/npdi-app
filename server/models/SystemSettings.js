const mongoose = require('mongoose');

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

  // Email/Notifications (System-level SMTP configuration)
  email: {
    enabled: { type: Boolean, default: false },
    smtpServer: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUsername: { type: String, default: '' },
    smtpPassword: { type: String, default: '' }, // Should be encrypted
    smtpSecure: { type: Boolean, default: false },
    fromEmail: { type: String, default: '' },
    fromName: { type: String, default: 'NPDI System' }
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
    webhook: {
      enabled: { type: Boolean, default: false },
      url: { type: String, default: '' },
      secret: { type: String, default: '' },
      events: [{ type: String }] // ['ticket.created', 'ticket.updated', etc.]
    },
    externalAPI: {
      timeout: { type: Number, default: 10 }, // seconds
      retryAttempts: { type: Number, default: 3 }
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
