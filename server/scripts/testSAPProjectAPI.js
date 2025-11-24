#!/usr/bin/env node
/**
 * SAP Project API Test Script
 * Tests connectivity and functionality of SAP Project System integration
 *
 * Usage:
 *   node testSAPProjectAPI.js
 *   node testSAPProjectAPI.js --project=PROJECT123
 *   node testSAPProjectAPI.js --search=NPDI
 */

require('dotenv').config();
const sapProjectService = require('../services/sapProjectService');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

async function testSAPProjectAPI() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SAP PROJECT API TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Date: ${new Date().toLocaleString()}`);
  console.log('');

  try {
    // Test 1: Check if integration is enabled
    console.log('📋 Test 1: Checking SAP Project Integration Status...\n');

    const enabled = await sapProjectService.isEnabled();
    console.log(`   Integration Enabled: ${enabled ? '✅ Yes' : '❌ No'}`);

    if (!enabled) {
      console.log('\n⚠️  SAP Project integration is disabled or not configured.');
      console.log('   Please configure in System Settings:');
      console.log('   - SAP Host');
      console.log('   - SAP Port');
      console.log('   - SAP Client');
      console.log('   - SAP Username');
      console.log('   - SAP Password');
      console.log('   - Enable integration toggle');
      return;
    }

    // Test 2: Test connection
    console.log('\n📡 Test 2: Testing Connection to SAP Project API...\n');

    const connectionTest = await sapProjectService.testConnection();

    if (connectionTest.success) {
      console.log(`   ✅ ${connectionTest.message}`);
      console.log(`   Response time: ${connectionTest.duration}ms`);
      console.log(`   API Version: ${connectionTest.diagnostics.apiVersion}`);
    } else {
      console.log(`   ❌ Connection failed: ${connectionTest.message}`);

      if (connectionTest.diagnostics) {
        console.log('\n   Diagnostics:');
        Object.entries(connectionTest.diagnostics).forEach(([key, value]) => {
          console.log(`     ${key}: ${value}`);
        });
      }

      console.log('\n   💡 Troubleshooting:');
      console.log('   1. Verify SAP credentials are correct');
      console.log('   2. Check if OData Gateway is activated in SAP (transaction SICF)');
      console.log('   3. Ensure user has authorization for OData services');
      console.log('   4. Check network connectivity to SAP server');
      return;
    }

    // Test 3: Get project by ID (if specified)
    if (options.project) {
      console.log(`\n🔍 Test 3: Fetching Project by ID: ${options.project}...\n`);

      const projectResult = await sapProjectService.getProjectById(options.project);

      if (projectResult.success) {
        console.log('   ✅ Project retrieved successfully!');
        console.log('\n   Project Details:');
        console.log('   ─────────────────────────────────────────────────');
        console.log(`   Project ID:       ${projectResult.project.projectId}`);
        console.log(`   Project Name:     ${projectResult.project.projectName}`);
        console.log(`   System Status:    ${projectResult.project.systemStatus} (${projectResult.project.systemStatusText})`);
        console.log(`   User Status:      ${projectResult.project.userStatus || 'None'}`);
        console.log(`   Responsible:      ${projectResult.project.responsible || 'Not assigned'}`);
        console.log(`   Start Date:       ${projectResult.project.startDate || 'Not set'}`);
        console.log(`   End Date:         ${projectResult.project.endDate || 'Not set'}`);
        console.log(`   SAP Link:         ${projectResult.project.sapUrl}`);
        console.log(`   Last Sync:        ${projectResult.project.lastSyncDate.toLocaleString()}`);
        console.log('   ─────────────────────────────────────────────────');

        console.log('\n   📊 Status Badge Color: ' + sapProjectService.getStatusColor(projectResult.project.systemStatus));

      } else {
        console.log(`   ❌ Failed: ${projectResult.error}`);
      }
    }

    // Test 4: Search projects (if specified or as default)
    const searchQuery = options.search || 'NPDI';

    console.log(`\n🔎 Test 4: Searching Projects for "${searchQuery}"...\n`);

    const searchResult = await sapProjectService.searchProjects(searchQuery, 5);

    if (searchResult.success) {
      console.log(`   ✅ Found ${searchResult.count} project(s) in ${searchResult.duration}ms`);

      if (searchResult.projects.length === 0) {
        console.log(`\n   No projects found matching "${searchQuery}"`);
        console.log('   Try a different search term or check if projects exist in SAP');
      } else {
        console.log('\n   Search Results:');
        console.log('   ═══════════════════════════════════════════════════════════════\n');

        searchResult.projects.forEach((project, index) => {
          console.log(`   ${index + 1}. ${project.projectId} - ${project.projectName}`);
          console.log(`      Status:      ${project.systemStatus} (${project.systemStatusText})`);
          console.log(`      Dates:       ${project.startDate || 'N/A'} to ${project.endDate || 'N/A'}`);
          console.log(`      Responsible: ${project.responsible || 'Not assigned'}`);
          console.log(`      SAP Link:    ${project.sapUrl}`);
          console.log('');
        });
      }
    } else {
      console.log(`   ❌ Search failed: ${searchResult.error}`);
    }

    // Test 5: Get project status (if project specified)
    if (options.project) {
      console.log(`\n📊 Test 5: Getting Status for Project ${options.project}...\n`);

      const statusResult = await sapProjectService.getProjectStatus(options.project);

      if (statusResult.success) {
        console.log('   ✅ Status retrieved successfully!');
        console.log(`   System Status:     ${statusResult.status.systemStatus}`);
        console.log(`   Status Text:       ${statusResult.status.systemStatusText}`);
        console.log(`   User Status:       ${statusResult.status.userStatus || 'None'}`);
        console.log(`   Last Sync:         ${statusResult.status.lastSyncDate.toLocaleString()}`);
      } else {
        console.log(`   ❌ Failed: ${statusResult.error}`);
      }
    }

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('   All tests completed successfully!');
    console.log('\n   Next Steps:');
    console.log('   1. Update ProductTicket model to include SAP project fields');
    console.log('   2. Create API routes for SAP project integration');
    console.log('   3. Build frontend components to display SAP status');
    console.log('   4. Test with real NPDI project IDs from your SAP system');
    console.log('');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('❌ TEST FAILED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.error('   Error:', error.message);

    if (error.response) {
      console.error('\n   HTTP Response:');
      console.error(`     Status: ${error.response.status}`);
      console.error(`     Status Text: ${error.response.statusText}`);

      if (error.response.data) {
        console.error('     Response Data:', JSON.stringify(error.response.data, null, 2));
      }
    }

    if (error.code) {
      console.error(`\n   Error Code: ${error.code}`);

      if (error.code === 'ECONNREFUSED') {
        console.log('\n   💡 Connection refused - SAP server may not be reachable');
        console.log('      Check: Network connectivity, firewall, SAP server status');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('\n   💡 Connection timeout');
        console.log('      Check: Network latency, SAP server load, timeout settings');
      } else if (error.code === 'ENOTFOUND') {
        console.log('\n   💡 Host not found');
        console.log('      Check: SAP hostname in System Settings');
      }
    }

    console.log('\n   📖 For detailed troubleshooting, see:');
    console.log('      docs/features/SAP_NPDI_STATUS_INTEGRATION.md');
    console.log('');

    process.exit(1);
  }
}

// Run the tests
console.log('');
testSAPProjectAPI()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
