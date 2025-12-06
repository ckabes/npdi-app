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
    type: String,  // Email address from profile
    default: 'system'
  },
  updatedBy: {
    type: String,  // Email address from profile
    default: 'system'
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

ticketTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure only one default template
ticketTemplateSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('TicketTemplate').updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('TicketTemplate', ticketTemplateSchema);
