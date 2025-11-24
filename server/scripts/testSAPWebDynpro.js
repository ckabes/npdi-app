#!/usr/bin/env node
/**
 * Test SAP WebDynpro URL Access
 * Tests if we can access the exact WebDynpro URL provided by the user
 */

const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');

// Your actual SAP RPM URL
const SAP_URL = 'https://sapprpap19.sial.com:44300/sap/bc/webdynpro/sap/rpm_item_details?=&appl_type=RPM&ctx_parent_guid=005056A554681ED5BDAF29EF2AE06D81&ctx_parent_type=RPH&object_guid=0517F09214541EEF97AFD2C8AD56CAA9&object_id=&object_type=RIH&parent_guid=005056A554681ED5BDAF29EF2AE06D81&parent_id=&parent_type=RPH&portal_role=RPM_ITEM&portfolio_guid=005056A554681ED5BDAE9EC36D5E2B90&portfolio_id=&sap-wd-configid=RPM_ITEM_DETAILS_CFG&sap-client=100&sap-language=EN';

const config = {
  username: process.env.SAP_USERNAME,
  password: process.env.SAP_PASSWORD
};

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testWebDynproURL() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SAP WEBDYNPRO URL TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Testing your actual SAP RPM URL...\n');
  console.log(`URL: ${SAP_URL.substring(0, 80)}...`);
  console.log(`User: ${config.username}\n`);

  try {
    const startTime = Date.now();

    const response = await axios.get(SAP_URL, {
      auth: {
        username: config.username,
        password: config.password
      },
      httpsAgent: httpsAgent,
      timeout: 30000,
      validateStatus: () => true,
      maxRedirects: 5
    });

    const duration = Date.now() - startTime;

    console.log(`Response: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.headers['content-length'] || 'unknown'}\n`);

    if (response.status === 200) {
      console.log('✅ SUCCESS - WebDynpro URL is accessible!\n');
      console.log('This means:');
      console.log('✓ You CAN access SAP RPM items via WebDynpro URLs');
      console.log('✓ Manual URL linking will work perfectly');
      console.log('✓ Users can paste SAP URLs to link tickets\n');

      // Show a snippet of the response
      const bodyPreview = response.data.toString().substring(0, 500);
      console.log('Response preview:');
      console.log('─────────────────────────────────────────────────────────');
      console.log(bodyPreview);
      console.log('─────────────────────────────────────────────────────────\n');

      console.log('✅ RECOMMENDATION: Use URL-based linking\n');
      console.log('Since OData API is restricted, implement the integration as:');
      console.log('1. User opens SAP RPM item in browser');
      console.log('2. User copies the URL from browser');
      console.log('3. User pastes URL when linking ticket');
      console.log('4. System extracts GUIDs from URL');
      console.log('5. "View in SAP" button opens the stored URL\n');

    } else if (response.status === 401) {
      console.log('❌ AUTHENTICATION FAILED\n');
      console.log('Your credentials are not valid for WebDynpro access.');
      console.log('This could mean:');
      console.log('- Password is incorrect');
      console.log('- User lacks WebDynpro permissions');
      console.log('- Session-based authentication is required\n');

    } else if (response.status === 403) {
      console.log('❌ ACCESS FORBIDDEN\n');
      console.log('Your user lacks permission to access SAP RPM items.');
      console.log('Contact SAP Security team for:');
      console.log('- SAP RPM access role');
      console.log('- WebDynpro authorization\n');

    } else if (response.status === 404) {
      console.log('⚠️  NOT FOUND\n');
      console.log('The specific RPM item may not exist or URL format changed.');
      console.log('Try opening this URL in a browser to verify.\n');

    } else if (response.status === 500) {
      console.log('❌ SERVER ERROR\n');
      console.log('SAP server encountered an error.');
      console.log('This could be temporary or a configuration issue.\n');

    } else {
      console.log(`⚠️  Unexpected response: ${response.status}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.log('❌ TEST FAILED\n');
    console.log(`Error: ${error.message}\n`);

    if (error.code) {
      console.log(`Error Code: ${error.code}\n`);
    }
  }
}

testWebDynproURL()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
