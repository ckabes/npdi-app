const mongoose = require('mongoose');
const FormConfiguration = require('../models/FormConfiguration');

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app';

async function diagnoseFormConfig() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get the active form configuration
    const config = await FormConfiguration.findOne({ isActive: true });

    if (!config) {
      console.log('No active form configuration found');
      return;
    }

    console.log('\n=== FORM CONFIGURATION DIAGNOSIS ===\n');
    console.log('ID:', config._id);
    console.log('Version:', config.version);
    console.log('Published Version:', config.publishedVersion);
    console.log('Is Draft:', config.isDraft);
    console.log('Last Published:', config.lastPublishedAt);
    console.log('\nCurrent Sections:', config.sections.length);
    console.log('Section Keys:', config.sections.map(s => s.sectionKey).join(', '));

    console.log('\nLast Published Sections:', config.lastPublishedSections ? config.lastPublishedSections.length : 'NONE');
    if (config.lastPublishedSections && config.lastPublishedSections.length > 0) {
      console.log('Last Published Section Keys:', config.lastPublishedSections.map(s => s.sectionKey).join(', '));

      // Check if they're the same
      const currentKeys = config.sections.map(s => s.sectionKey).sort().join(',');
      const lastKeys = config.lastPublishedSections.map(s => s.sectionKey).sort().join(',');

      if (currentKeys === lastKeys) {
        console.log('\n⚠️  WARNING: Current sections and lastPublishedSections appear to be identical!');
        console.log('This means rollback will not work correctly.');
        console.log('This is likely due to the bug that was recently fixed.');
      } else {
        console.log('\n✓ Current and lastPublishedSections are different - rollback should work');
      }
    } else {
      console.log('\n⚠️  WARNING: No lastPublishedSections found!');
      console.log('Rollback will not be available until you publish a new version after making changes.');
    }

    console.log('\n=== RECOMMENDATION ===');
    if (!config.lastPublishedSections || config.lastPublishedSections.length === 0) {
      console.log('To fix: Make a change to the form, save as draft, then publish.');
      console.log('The new publish logic will properly save the current version before incrementing.');
    } else if (config.sections.length === config.lastPublishedSections?.length) {
      console.log('The lastPublishedSections may contain corrupt data from the old bug.');
      console.log('Options to fix:');
      console.log('1. Clear lastPublishedSections and start fresh (see clearLastPublished.js)');
      console.log('2. Make a change, save, and publish to establish a new baseline');
    }

  } catch (error) {
    console.error('Error diagnosing form configuration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

diagnoseFormConfig();
