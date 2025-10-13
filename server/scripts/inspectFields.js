const mongoose = require('mongoose');
const FormConfiguration = require('../models/FormConfiguration');

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app';

async function inspectFields() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get the active form configuration
    const config = await FormConfiguration.findOne({ isActive: true });

    if (!config) {
      console.log('No active form configuration found');
      return;
    }

    console.log('\n=== CURRENT CONFIGURATION FIELDS ===\n');

    config.sections.forEach(section => {
      console.log(`\n${section.name} (${section.sectionKey}):`);
      console.log(`  Visible: ${section.visible}`);
      console.log(`  Fields (${section.fields.length}):`);

      section.fields.forEach(field => {
        console.log(`    - ${field.label} (${field.fieldKey})`);
        console.log(`      Type: ${field.type}`);
        console.log(`      Visible: ${field.visible}`);
        console.log(`      Editable: ${field.editable}`);
        console.log(`      Required: ${field.required}`);
        if (field.defaultValue !== undefined) {
          console.log(`      Default: ${field.defaultValue}`);
        }
        if (field.options && field.options.length > 0) {
          console.log(`      Options: ${field.options.map(o => o.value).join(', ')}`);
        }
      });
    });

    if (config.lastPublishedSections && config.lastPublishedSections.length > 0) {
      console.log('\n\n=== LAST PUBLISHED SECTIONS ===\n');

      config.lastPublishedSections.forEach(section => {
        console.log(`\n${section.name} (${section.sectionKey}):`);
        console.log(`  Visible: ${section.visible}`);
        console.log(`  Fields (${section.fields.length}):`);

        section.fields.forEach(field => {
          console.log(`    - ${field.label} (${field.fieldKey})`);
          console.log(`      Type: ${field.type}`);
          console.log(`      Visible: ${field.visible}`);
          console.log(`      Editable: ${field.editable}`);
          console.log(`      Required: ${field.required}`);
          if (field.defaultValue !== undefined) {
            console.log(`      Default: ${field.defaultValue}`);
          }
          if (field.options && field.options.length > 0) {
            console.log(`      Options: ${field.options.map(o => o.value).join(', ')}`);
          }
        });
      });
    } else {
      console.log('\n\n=== NO LAST PUBLISHED SECTIONS ===');
    }

  } catch (error) {
    console.error('Error inspecting fields:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

inspectFields();
