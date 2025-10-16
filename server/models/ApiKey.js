const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Store a hash of the key for additional security
  keyHash: {
    type: String,
    required: true
  },
  // Prefix shown to users (first 8 characters)
  keyPrefix: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    type: [String],
    default: ['read'],
    enum: ['read', 'write', 'admin']
  },
  // Usage tracking
  lastUsedAt: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  },
  // Rate limiting
  rateLimit: {
    requestsPerHour: {
      type: Number,
      default: 1000
    }
  },
  // Expiration
  expiresAt: {
    type: Date
  },
  // Metadata
  createdBy: {
    type: String,  // Email address from profile
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // IP whitelist (optional)
  ipWhitelist: {
    type: [String],
    default: []
  },
  // Application/service this key is for
  application: {
    type: String,
    default: ''
  }
});

// Pre-save middleware to update timestamp
apiKeySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to generate a new API key
apiKeySchema.statics.generateKey = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Static method to hash a key
apiKeySchema.statics.hashKey = function(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Instance method to check if key is expired
apiKeySchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Instance method to check if key is valid
apiKeySchema.methods.isValid = function() {
  return this.isActive && !this.isExpired();
};

// Instance method to record usage
apiKeySchema.methods.recordUsage = async function() {
  this.lastUsedAt = new Date();
  this.usageCount += 1;
  await this.save();
};

// Don't return the full key in JSON responses (only show prefix)
apiKeySchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.key;
  delete obj.keyHash;
  return obj;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
