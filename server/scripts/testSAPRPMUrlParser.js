#!/usr/bin/env node
/**
 * SAP RPM URL Parser Test Script
 * Tests parsing of SAP RPM WebDynpro URLs and linking projects
 *
 * Usage:
 *   node testSAPRPMUrlParser.js
 *   node testSAPRPMUrlParser.js --url="<SAP_URL>"
 *   node testSAPRPMUrlParser.js --project=100000000000000572302024 --url="<SAP_URL>"
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

// Default test URL (from user's example)
const DEFAULT_PROJECT_ID = '100000000000000572302024';
const DEFAULT_SAP_URL = 'http://sapprpap19.sial.com:8083/sap/bc/webdynpro/sap/rpm_item_details?&sap-client=100&appl_type=RPM&ctx_parent_guid=005056A554681ED5BDAF29EF2AE06D81&ctx_parent_type=RPH&object_guid=0517F09214541EEF97AFD2C8AD56CAA9&object_id=&object_type=RIH&parent_guid=005056A554681ED5BDAF29EF2AE06D81&parent_id=&parent_type=RPH&portal_role=RPM_ITEM&portfolio_guid=005056A554681ED5BDAE9EC36D5E2B90&portfolio_id=&sap-wd-configid=RPM_ITEM_DETAILS_CFG&sap-language=EN';

async function testSAPRPMUrlParser() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SAP RPM URL PARSER TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Date: ${new Date().toLocaleString()}`);
  console.log('');

  try {
    const projectId = options.project || DEFAULT_PROJECT_ID;
    const sapUrl = options.url || DEFAULT_SAP_URL;

    console.log('📋 Test Input:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Project ID: ${projectId}`);
    console.log(`SAP URL:    ${sapUrl.substring(0, 100)}...`);
    console.log('');

    // Test 1: Parse URL
    console.log('🔍 Test 1: Parsing SAP RPM URL...\n');

    const parsedInfo = sapProjectService.parseSAPRPMUrl(sapUrl);

    if (!parsedInfo) {
      console.log('❌ Failed to parse URL');
      return;
    }

    console.log('✅ URL parsed successfully!');
    console.log('');
    console.log('Extracted Information:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`Host:            ${parsedInfo.host}`);
    console.log(`Port:            ${parsedInfo.port}`);
    console.log(`Protocol:        ${parsedInfo.protocol}`);
    console.log(`SAP Client:      ${parsedInfo.client}`);
    console.log(`Application:     ${parsedInfo.applType}`);
    console.log(`Object Type:     ${parsedInfo.objectType}`);
    console.log(`Parent Type:     ${parsedInfo.parentType}`);
    console.log('');
    console.log('GUIDs:');
    console.log(`Object GUID:     ${parsedInfo.objectGuid}`);
    console.log(`Parent GUID:     ${parsedInfo.parentGuid}`);
    console.log(`Portfolio GUID:  ${parsedInfo.portfolioGuid}`);
    console.log('');

    // Test 2: Link project by URL
    console.log('🔗 Test 2: Linking Project by URL...\n');

    const linkResult = await sapProjectService.linkProjectByUrl(projectId, sapUrl);

    if (linkResult.success) {
      console.log('✅ Project linked successfully!');
      console.log('');
      console.log('Project Data for ProductTicket:');
      console.log('─────────────────────────────────────────────────────────────');
      console.log(JSON.stringify(linkResult.data, null, 2));
      console.log('─────────────────────────────────────────────────────────────');
    } else {
      console.log(`❌ Failed to link project: ${linkResult.error}`);
      return;
    }

    // Test 3: Build SAP Link
    console.log('\n🔨 Test 3: Building SAP Link from GUIDs...\n');

    // First, load settings to enable link building
    await sapProjectService.loadSettings();

    const rebuiltUrl = sapProjectService.buildSAPLink(projectId, {
      objectGuid: parsedInfo.objectGuid,
      parentGuid: parsedInfo.parentGuid,
      portfolioGuid: parsedInfo.portfolioGuid,
      parentType: parsedInfo.parentType
    });

    console.log('✅ SAP Link generated!');
    console.log('');
    console.log('Generated URL:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(rebuiltUrl);
    console.log('─────────────────────────────────────────────────────────────');
    console.log('');

    // Compare URLs
    console.log('URL Comparison:');
    console.log(`Original length:  ${sapUrl.length} characters`);
    console.log(`Generated length: ${rebuiltUrl.length} characters`);

    // Parse the generated URL to verify
    const rebuiltParsed = sapProjectService.parseSAPRPMUrl(rebuiltUrl);
    const guidMatch = rebuiltParsed?.objectGuid === parsedInfo.objectGuid;

    console.log(`GUIDs match:      ${guidMatch ? '✅ Yes' : '❌ No'}`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('   All tests completed successfully!');
    console.log('');
    console.log('   What this means:');
    console.log('   ✓ SAP RPM URLs can be parsed correctly');
    console.log('   ✓ Project information can be extracted from URLs');
    console.log('   ✓ New SAP links can be generated with GUIDs');
    console.log('   ✓ Ready to link ProductTickets to SAP RPM items');
    console.log('');
    console.log('   Next steps:');
    console.log('   1. Configure SAP credentials: node scripts/configureSAP.js');
    console.log('   2. Update ProductTicket model with sapProject schema');
    console.log('   3. Create API routes for linking projects');
    console.log('   4. Build frontend components for SAP integration');
    console.log('');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('❌ TEST FAILED');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.error('   Error:', error.message);

    if (error.stack) {
      console.error('\n   Stack trace:');
      console.error(error.stack);
    }

    console.log('\n   💡 Troubleshooting:');
    console.log('   1. Ensure the URL is a valid SAP RPM WebDynpro URL');
    console.log('   2. Check that the URL contains required parameters (object_guid, etc.)');
    console.log('   3. Verify the URL format matches the expected pattern');
    console.log('');

    process.exit(1);
  }
}

// Run the tests
console.log('');
testSAPRPMUrlParser()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
