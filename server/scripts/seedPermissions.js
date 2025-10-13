const mongoose = require('mongoose');
const Permission = require('../models/Permission');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app';

async function seedPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Initialize default privileges
    console.log('Initializing default privileges...');
    await Permission.initializeDefaultPermissions();

    // Verify
    const permissions = await Permission.find();
    console.log('\nInitialized privileges for roles:');
    permissions.forEach(perm => {
      console.log(`\n${perm.role}:`);
      console.log('  Tickets:', perm.privileges.tickets);
      console.log('  Drafts:', perm.privileges.drafts);
      console.log('  SKU Variants:', perm.privileges.skuVariants);
      console.log('  SKU Assignment:', perm.privileges.skuAssignment);
      console.log('  Pricing Data:', perm.privileges.pricingData);
      console.log('  Admin Panel:', perm.privileges.adminPanel);
    });

    console.log('\n✓ Privileges seeded successfully!');

  } catch (error) {
    console.error('Error seeding privileges:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seed function
seedPermissions();
