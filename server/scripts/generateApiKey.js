#!/usr/bin/env node

/**
 * Utility script to generate API keys for external applications
 * Usage: node server/scripts/generateApiKey.js [label]
 */

const crypto = require('crypto');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

const label = process.argv[2] || 'New API Key';
const apiKey = generateApiKey();

console.log('\n' + '='.repeat(80));
console.log('🔑 API Key Generated Successfully');
console.log('='.repeat(80));
console.log(`\nLabel: ${label}`);
console.log(`API Key: ${apiKey}`);
console.log('\nAdd this to your .env file:');
console.log(`API_KEY_${Date.now()}=${apiKey}`);
console.log('\nOr use as MASTER_API_KEY for full access:');
console.log(`MASTER_API_KEY=${apiKey}`);
console.log('\n' + '='.repeat(80));
console.log('⚠️  Keep this key secure and never commit it to version control!');
console.log('='.repeat(80) + '\n');
