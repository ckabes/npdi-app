const mongoose = require('mongoose');
const FormConfiguration = require('../models/FormConfiguration');

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app';

async function clearLastPublished() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Get the active form configuration
    const config = await FormConfiguration.findOne({ isActive: true });

    if (!config) {
      console.log('No active form configuration found');
      return;
    }

    console.log('\n=== CLEARING CORRUPT LAST PUBLISHED SECTIONS ===\n');
    console.log('Current Configuration:');
    console.log('- ID:', config._id);
    console.log('- Version:', config.version);
    console.log('- lastPublishedSections:', config.lastPublishedSections ? `${config.lastPublishedSections.length} sections` : 'NONE');

    // Clear the lastPublishedSections
    config.lastPublishedSections = undefined;
    config.updatedAt = Date.now();

    await config.save();

    console.log('\n✓ Cleared lastPublishedSections successfully');
    console.log('\nNext steps:');
    console.log('1. The rollback feature will now show "No previous version available"');
    console.log('2. Make any change to the form configuration');
    console.log('3. Save as draft');
    console.log('4. Publish the draft');
    console.log('5. After publishing, lastPublishedSections will be properly set');
    console.log('6. Future changes and publishes will now allow rollback');

  } catch (error) {
    console.error('Error clearing lastPublishedSections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

clearLastPublished();
