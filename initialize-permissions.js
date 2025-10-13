require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('./server/models/Permission');

const initializePermissions = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Initializing default permissions...');
    await Permission.initializeDefaultPermissions();

    console.log('Verifying permissions...');
    const permissions = await Permission.find();

    console.log('\n=== Permissions Initialized ===\n');
    permissions.forEach(perm => {
      console.log(`Role: ${perm.role}`);
      console.log('Permissions:', JSON.stringify(perm.permissions, null, 2));
      console.log('---');
    });

    console.log('\n✅ Default permissions initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing permissions:', error);
    process.exit(1);
  }
};

initializePermissions();
