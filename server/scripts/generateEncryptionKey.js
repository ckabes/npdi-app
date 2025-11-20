#!/usr/bin/env node

/**
 * Generate Encryption Key Script
 *
 * Generates a secure random encryption key for use with the encryption utility.
 * This key should be stored in the ENCRYPTION_KEY environment variable.
 *
 * Usage:
 *   node server/scripts/generateEncryptionKey.js
 *
 * IMPORTANT:
 * - Store this key securely in your .env file
 * - NEVER commit this key to version control
 * - Keep a secure backup of this key
 * - If you lose this key, you CANNOT decrypt your encrypted data
 */

const crypto = require('crypto');

console.log('\n=================================================');
console.log('  ENCRYPTION KEY GENERATOR');
console.log('=================================================\n');

// Generate a secure random 32-byte (256-bit) key
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Your new encryption key (64 characters):');
console.log('\n' + encryptionKey + '\n');

console.log('Add this to your .env file:');
console.log('ENCRYPTION_KEY=' + encryptionKey);

console.log('\n=================================================');
console.log('  IMPORTANT SECURITY NOTES');
console.log('=================================================');
console.log('1. Store this key in your .env file');
console.log('2. NEVER commit .env to version control');
console.log('3. Keep a secure backup of this key');
console.log('4. Losing this key = losing encrypted data');
console.log('5. Use different keys for dev/staging/production');
console.log('=================================================\n');
