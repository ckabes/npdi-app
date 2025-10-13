const mongoose = require('mongoose');

const fieldOptionSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
}, { _id: false });

const formFieldSchema = new mongoose.Schema({
  fieldKey: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'date', 'email', 'url'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  visible: {
    type: Boolean,
    default: true
  },
  editable: {
    type: Boolean,
    default: true
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed
  },
  placeholder: String,
  helpText: String,
  options: [fieldOptionSchema],
  validation: {
    pattern: String,
    min: Number,
    max: Number,
    minLength: Number,
    maxLength: Number,
    step: Number
  },
  conditionalDisplay: {
    dependsOn: String,
    value: mongoose.Schema.Types.Mixed
  },
  visibleWhen: {
    fieldKey: String,
    value: mongoose.Schema.Types.Mixed
  },
  gridColumn: {
    type: String,
    default: 'full' // 'full', 'half', 'third', 'quarter'
  },
  order: {
    type: Number,
    default: 0
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const formSectionSchema = new mongoose.Schema({
  sectionKey: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  visible: {
    type: Boolean,
    default: true
  },
  collapsible: {
    type: Boolean,
    default: true
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: true
  },
  fields: [formFieldSchema],
  isCustom: {
    type: Boolean,
    default: false
  },
  icon: String
}, { _id: false });

const formConfigurationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Product Ticket Form'
  },
  templateName: {
    type: String,
    default: 'Default',
    required: true
  },
  description: String,
  version: {
    type: String,
    required: true,
    default: '1.0.0'
  },
  isDraft: {
    type: Boolean,
    default: false
  },
  publishedVersion: {
    type: String,
    default: '1.0.0'
  },
  lastPublishedAt: {
    type: Date
  },
  // Store the last published version's sections for rollback
  lastPublishedSections: {
    type: [formSectionSchema],
    default: undefined
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sections: [formSectionSchema],
  metadata: {
    totalFields: Number,
    customFieldsCount: Number,
    customSectionsCount: Number
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

formConfigurationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Calculate metadata
  let totalFields = 0;
  let customFieldsCount = 0;
  let customSectionsCount = 0;

  this.sections.forEach(section => {
    if (section.isCustom) customSectionsCount++;
    totalFields += section.fields.length;
    section.fields.forEach(field => {
      if (field.isCustom) customFieldsCount++;
    });
  });

  this.metadata = {
    totalFields,
    customFieldsCount,
    customSectionsCount
  };

  next();
});

module.exports = mongoose.model('FormConfiguration', formConfigurationSchema);
