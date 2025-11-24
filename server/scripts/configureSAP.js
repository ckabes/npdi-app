#!/usr/bin/env node
/**
 * SAP Configuration Helper Script
 * Configures SAP RPM integration settings in SystemSettings
 *
 * Usage:
 *   node configureSAP.js
 *   node configureSAP.js --enable
 *   node configureSAP.js --test
 */

require('dotenv').config();
const mongoose = require('mongoose');
const SystemSettings = require('../models/SystemSettings');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function configureSAP() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('SAP RPM CONFIGURATION HELPER');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✓ Connected to MongoDB\n');

    // Get current settings
    let settings = await SystemSettings.getSettings();

    console.log('Current SAP Configuration:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Enabled:     ${settings.integrations?.sap?.enabled || false}`);
    console.log(`Host:        ${settings.integrations?.sap?.host || 'not set'}`);
    console.log(`Port:        ${settings.integrations?.sap?.port || 'not set'}`);
    console.log(`Client:      ${settings.integrations?.sap?.client || 'not set'}`);
    console.log(`Username:    ${settings.integrations?.sap?.username || 'not set'}`);
    console.log(`Password:    ${settings.integrations?.sap?.password ? '***set***' : 'not set'}`);
    console.log(`Protocol:    ${settings.integrations?.sap?.protocol || 'http'}`);
    console.log(`Type:        ${settings.integrations?.sap?.applicationType || 'RPM'}`);
    console.log(`Timeout:     ${settings.integrations?.sap?.timeout || 30}s`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Ask if user wants to update
    const update = await question('Do you want to update SAP configuration? (yes/no): ');

    if (update.toLowerCase() !== 'yes' && update.toLowerCase() !== 'y') {
      console.log('\nNo changes made.');
      rl.close();
      await mongoose.disconnect();
      return;
    }

    console.log('\n--- SAP RPM Configuration ---\n');
    console.log('Leave blank to keep current value.\n');

    // Get configuration from user
    const host = await question(`SAP Host [${settings.integrations?.sap?.host || 'sapprpap19.sial.com'}]: `);
    const port = await question(`SAP Port [${settings.integrations?.sap?.port || '8083'}]: `);
    const client = await question(`SAP Client [${settings.integrations?.sap?.client || '100'}]: `);
    const username = await question(`SAP Username [${settings.integrations?.sap?.username || ''}]: `);
    const password = await question(`SAP Password [***hidden***]: `);
    const protocol = await question(`Protocol (http/https) [${settings.integrations?.sap?.protocol || 'http'}]: `);
    const applicationType = await question(`Application Type (RPM/PS) [${settings.integrations?.sap?.applicationType || 'RPM'}]: `);
    const enabled = await question(`Enable SAP integration? (yes/no) [${settings.integrations?.sap?.enabled ? 'yes' : 'no'}]: `);

    rl.close();

    // Build update object
    const updates = {
      integrations: {
        sap: {
          enabled: enabled.toLowerCase() === 'yes' || enabled.toLowerCase() === 'y' ||
                   (enabled === '' && settings.integrations?.sap?.enabled),
          host: host || settings.integrations?.sap?.host || 'sapprpap19.sial.com',
          port: port || settings.integrations?.sap?.port || '8083',
          client: client || settings.integrations?.sap?.client || '100',
          username: username || settings.integrations?.sap?.username || '',
          password: password || settings.integrations?.sap?.password || '',
          protocol: protocol || settings.integrations?.sap?.protocol || 'http',
          applicationType: applicationType || settings.integrations?.sap?.applicationType || 'RPM',
          timeout: 30
        }
      }
    };

    console.log('\n--- Saving Configuration ---\n');

    // Update settings
    settings = await SystemSettings.updateSettings(updates, 'system');

    console.log('✓ Configuration saved successfully!\n');

    console.log('Updated SAP Configuration:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Enabled:     ${settings.integrations.sap.enabled}`);
    console.log(`Host:        ${settings.integrations.sap.host}`);
    console.log(`Port:        ${settings.integrations.sap.port}`);
    console.log(`Client:      ${settings.integrations.sap.client}`);
    console.log(`Username:    ${settings.integrations.sap.username}`);
    console.log(`Password:    ${settings.integrations.sap.password ? '***encrypted***' : 'not set'}`);
    console.log(`Protocol:    ${settings.integrations.sap.protocol}`);
    console.log(`Type:        ${settings.integrations.sap.applicationType}`);
    console.log(`Timeout:     ${settings.integrations.sap.timeout}s`);
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log('✅ Configuration complete!\n');
    console.log('Next steps:');
    console.log('1. Run the test script: node scripts/testSAPProjectAPI.js');
    console.log('2. Or test URL parsing: node scripts/testSAPRPMUrlParser.js\n');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  }
}

// Run configuration
configureSAP()
  .then(() => {
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
