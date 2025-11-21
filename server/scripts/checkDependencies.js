#!/usr/bin/env node

/**
 * Dependency Check Script
 *
 * Checks for outdated dependencies and security vulnerabilities.
 * Run monthly or before planning updates.
 *
 * Usage:
 *   node server/scripts/checkDependencies.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('\n=================================================');
console.log('  NPDI PORTAL - DEPENDENCY CHECK');
console.log('=================================================\n');

const rootDir = path.join(__dirname, '../..');
const clientDir = path.join(rootDir, 'client');

function runCommand(command, cwd) {
  try {
    return execSync(command, { cwd, encoding: 'utf8' });
  } catch (error) {
    return error.stdout || error.message;
  }
}

console.log('Checking SERVER dependencies...\n');
console.log('--- Outdated Packages ---');
console.log(runCommand('npm outdated', rootDir));
console.log('\n--- Security Audit ---');
console.log(runCommand('npm audit', rootDir));

console.log('\n=================================================');
console.log('Checking CLIENT dependencies...\n');
console.log('--- Outdated Packages ---');
console.log(runCommand('npm outdated', clientDir));
console.log('\n--- Security Audit ---');
console.log(runCommand('npm audit', clientDir));

console.log('\n=================================================');
console.log('  RECOMMENDATIONS');
console.log('=================================================\n');
console.log('1. Review security vulnerabilities above');
console.log('2. Apply security fixes: npm audit fix');
console.log('3. Review DEPENDENCY_MANAGEMENT.md for update strategy');
console.log('4. Plan updates based on priority matrix');
console.log('\n');
