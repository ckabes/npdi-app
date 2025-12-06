const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,  // Email address from profile (legacy, prefer userEmployeeId)
    required: false,
    unique: false,
    sparse: true  // Allow multiple null values
  },
  userEmployeeId: {
    type: String,  // Employee ID (e.g., M361549)
    required: false,
    unique: true,
    sparse: true  // Allow multiple null values during migration
  },

  // Display Preferences
  display: {
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    dateFormat: {
      type: String,
      enum: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      default: 'MM/DD/YYYY'
    },
    timeFormat: {
      type: String,
      enum: ['12-hour', '24-hour'],
      default: '12-hour'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  },

  // Notification Preferences
  notifications: {
    email: {
      enabled: { type: Boolean, default: true },
      newTicket: { type: Boolean, default: true },
      statusChange: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: false },
      weeklyReport: { type: Boolean, default: false }
    },
    browser: {
      enabled: { type: Boolean, default: true },
      newTicket: { type: Boolean, default: false },
      statusChange: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true }
    }
  },

  // Dashboard & View Preferences
  dashboard: {
    defaultView: {
      type: String,
      enum: ['grid', 'list', 'kanban'],
      default: 'list'
    },
    itemsPerPage: {
      type: Number,
      default: 25,
      min: 10,
      max: 100
    },
    showCompletedTickets: { type: Boolean, default: false },
    defaultFilter: {
      status: [{ type: String }],
      priority: [{ type: String }],
      assignedTo: { type: String }
    },
    defaultSort: {
      field: { type: String, default: 'createdAt' },
      order: { type: String, enum: ['asc', 'desc'], default: 'desc' }
    }
  },

  // Ticket Form Preferences
  ticketForm: {
    saveAsDraftByDefault: { type: Boolean, default: true },
    autoSaveInterval: {
      type: Number,
      default: 30, // seconds
      min: 10,
      max: 300
    },
    defaultPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    },
    showHelpText: { type: Boolean, default: true }
  },

  // Accessibility
  accessibility: {
    reducedMotion: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    },
    screenReader: { type: Boolean, default: false }
  },

  // Advanced
  advanced: {
    showDeveloperInfo: { type: Boolean, default: false },
    enableExperimentalFeatures: { type: Boolean, default: false },
    compactMode: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Get or create user preferences
// userId can be either email or employeeId
userPreferencesSchema.statics.getOrCreate = async function(userId, isEmployeeId = false) {
  const query = isEmployeeId ? { userEmployeeId: userId } : { $or: [{ userEmployeeId: userId }, { userId }] };
  let preferences = await this.findOne(query);
  if (!preferences) {
    const createData = isEmployeeId ? { userEmployeeId: userId } : { userId };
    preferences = await this.create(createData);
  }
  return preferences;
};

// Update user preferences
// userId can be either email or employeeId
userPreferencesSchema.statics.updatePreferences = async function(userId, updates, isEmployeeId = false) {
  const query = isEmployeeId ? { userEmployeeId: userId } : { $or: [{ userEmployeeId: userId }, { userId }] };
  let preferences = await this.findOne(query);

  if (!preferences) {
    const createData = isEmployeeId ? { userEmployeeId: userId, ...updates } : { userId, ...updates };
    preferences = new this(createData);
  } else {
    // Deep merge updates
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        preferences[key] = { ...preferences[key], ...updates[key] };
      } else {
        preferences[key] = updates[key];
      }
    });
  }

  await preferences.save();
  return preferences;
};

// Auto-detect timezone from request
userPreferencesSchema.statics.detectTimezone = function() {
  // This will be called from the frontend with browser's timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

const UserPreferences = mongoose.model('UserPreferences', userPreferencesSchema);

module.exports = UserPreferences;
