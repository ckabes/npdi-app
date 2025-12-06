const mongoose = require('mongoose');

const ticketTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  formConfiguration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormConfiguration',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  submissionRequirements: {
    type: [String],  // Array of fieldKeys that are required for submission
    default: []
  },
  createdBy: {
    type: String,  // Email address from profile (legacy, prefer createdByEmployeeId)
    default: 'system'
  },
  createdByEmployeeId: {
    type: String,  // Employee ID (e.g., M361549)
    default: null
  },
  updatedBy: {
    type: String,  // Email address from profile (legacy, prefer updatedByEmployeeId)
    default: 'system'
  },
  updatedByEmployeeId: {
    type: String,  // Employee ID (e.g., M361549)
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ticketTemplateSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Ensure only one default template
ticketTemplateSchema.pre('save', async function() {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('TicketTemplate').updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

module.exports = mongoose.model('TicketTemplate', ticketTemplateSchema);
