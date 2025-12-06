const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v) {
        return /^M\d+$/.test(v);
      },
      message: 'Employee ID must start with M followed by numbers (e.g., M361549)'
    }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['PRODUCT_MANAGER', 'PM_OPS', 'ADMIN'],
    required: true
  },
  sbu: {
    type: String,
    enum: ['Life Science', 'Process Solutions', 'Electronics', 'Healthcare'],
    required: function() {
      return this.role === 'PRODUCT_MANAGER';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  ticketTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TicketTemplate',
    required: false  // PM_OPS and ADMIN roles don't require templates
  },
  lastLogin: {
    type: Date
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

userSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('User', userSchema);