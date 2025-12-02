const mongoose = require('mongoose');

const BusinessLineSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  metadata: {
    extractedFrom: {
      type: String,
      default: 'Manual Entry'
    },
    lastExtracted: {
      type: Date,
      default: Date.now
    },
    extractedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
BusinessLineSchema.index({ code: 1 });
BusinessLineSchema.index({ description: 1 });
BusinessLineSchema.index({ active: 1 });

const BusinessLine = mongoose.model('BusinessLine', BusinessLineSchema);

module.exports = BusinessLine;
