#!/usr/bin/env node

/**
 * Script to seed an initial API key for development/testing
 * Usage: node server/scripts/seedApiKey.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ApiKey = require('../models/ApiKey');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app';

async function seedApiKey() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if any API keys exist
    const existingKeys = await ApiKey.countDocuments();

    if (existingKeys > 0) {
      console.log(`\nℹ  ${existingKeys} API key(s) already exist.`);
      console.log('To generate more keys, use the Admin Dashboard UI.\n');

      const keys = await ApiKey.find({ isActive: true })
        .select('name keyPrefix application createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      if (keys.length > 0) {
        console.log('Recent active keys:');
        keys.forEach(key => {
          console.log(`  - ${key.name} (${key.keyPrefix}...) ${key.application ? `- ${key.application}` : ''}`);
        });
        console.log();
      }

      await mongoose.disconnect();
      process.exit(0);
    }

    // Generate a new API key for development
    const key = ApiKey.generateKey();
    const keyHash = ApiKey.hashKey(key);
    const keyPrefix = key.substring(0, 8);

    const apiKey = new ApiKey({
      name: 'Development Key',
      description: 'Auto-generated key for development and testing',
      key,
      keyHash,
      keyPrefix,
      createdBy: 'system',
      application: 'Development',
      permissions: ['read', 'write', 'admin'],
      rateLimit: {
        requestsPerHour: 10000
      }
    });

    await apiKey.save();

    console.log('\n' + '='.repeat(80));
    console.log('✓ Development API Key Created Successfully!');
    console.log('='.repeat(80));
    console.log(`\nName: ${apiKey.name}`);
    console.log(`API Key: ${key}`);
    console.log(`Key Prefix: ${keyPrefix}...`);
    console.log(`Permissions: ${apiKey.permissions.join(', ')}`);
    console.log(`Rate Limit: ${apiKey.rateLimit.requestsPerHour} requests/hour`);
    console.log('\n⚠️  IMPORTANT: Save this API key securely. It will not be shown again!');
    console.log('\nTo use this key in your requests:');
    console.log(`  curl -H "X-API-Key: ${key}" http://localhost:5000/api/v1/tickets`);
    console.log('\nTo generate more keys, use the Admin Dashboard at:');
    console.log('  http://localhost:5173/admin → API Keys tab');
    console.log('='.repeat(80) + '\n');

    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error seeding API key:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seed function
seedApiKey();
