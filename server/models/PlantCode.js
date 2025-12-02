const mongoose = require('mongoose');

const plantCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
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
      default: 'MARA_Export.csv'
    },
    lastExtracted: {
      type: Date
    },
    extractedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
plantCodeSchema.index({ code: 1, active: 1 });

const PlantCode = mongoose.model('PlantCode', plantCodeSchema);

module.exports = PlantCode;
