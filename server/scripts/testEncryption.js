#!/usr/bin/env node

/**
 * Test Encryption Utility
 *
 * Tests the encryption/decryption functionality to ensure it's working correctly.
 *
 * Usage:
 *   node server/scripts/testEncryption.js
 */

require('dotenv').config();
const encryption = require('../utils/encryption');

console.log('\n=================================================');
console.log('  ENCRYPTION UTILITY TEST');
console.log('=================================================\n');

// Test data
const testStrings = [
  'sk-1234567890abcdef',
  'azure-api-key-test-value-12345',
  'webhook-secret-super-secure',
  'smtp-password-123',
  ''  // Test empty string
];

console.log('Testing encryption/decryption...\n');

let allPassed = true;

testStrings.forEach((original, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`  Original: "${original}"`);

  try {
    // Test encryption
    const encrypted = encryption.encrypt(original);
    console.log(`  Encrypted: ${encrypted.substring(0, 50)}${encrypted.length > 50 ? '...' : ''}`);

    // Test isEncrypted check
    const isEncryptedCheck = encryption.isEncrypted(encrypted);
    console.log(`  Is encrypted format: ${isEncryptedCheck}`);

    // Test decryption
    const decrypted = encryption.decrypt(encrypted);
    console.log(`  Decrypted: "${decrypted}"`);

    // Verify match
    const matches = original === decrypted;
    console.log(`  Match: ${matches ? 'PASS' : 'FAIL'}`);

    if (!matches) {
      allPassed = false;
      console.log(`  ERROR: Decrypted value doesn't match original!`);
    }

    console.log('');
  } catch (error) {
    console.log(`  ERROR: ${error.message}`);
    allPassed = false;
    console.log('');
  }
});

// Test performance
console.log('=================================================');
console.log('  PERFORMANCE TEST');
console.log('=================================================\n');

const testValue = 'azure-openai-api-key-test-value-for-performance';
const iterations = 1000;

console.log(`Testing ${iterations} encryption operations...`);
const encryptStart = Date.now();
for (let i = 0; i < iterations; i++) {
  encryption.encrypt(testValue);
}
const encryptTime = Date.now() - encryptStart;
console.log(`  Time: ${encryptTime}ms`);
console.log(`  Average: ${(encryptTime / iterations).toFixed(3)}ms per operation`);

console.log(`\nTesting ${iterations} decryption operations...`);
const encrypted = encryption.encrypt(testValue);
const decryptStart = Date.now();
for (let i = 0; i < iterations; i++) {
  encryption.decrypt(encrypted);
}
const decryptTime = Date.now() - decryptStart;
console.log(`  Time: ${decryptTime}ms`);
console.log(`  Average: ${(decryptTime / iterations).toFixed(3)}ms per operation`);

// Final result
console.log('\n=================================================');
if (allPassed) {
  console.log('  ALL TESTS PASSED');
} else {
  console.log('  SOME TESTS FAILED - CHECK ABOVE');
}
console.log('=================================================\n');

process.exit(allPassed ? 0 : 1);
