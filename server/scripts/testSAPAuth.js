/**
 * SAP Authentication Diagnostic Test
 * Tests authentication with detailed error messages
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');

// Load credentials from .env
const SAP_CONFIG = {
  host: process.env.SAP_HOST || 'sapprpap3.sial.com',
  port: process.env.SAP_PORT || '8083',
  client: process.env.SAP_CLIENT || '100',
  username: process.env.SAP_USERNAME,
  password: process.env.SAP_PASSWORD
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('SAP AUTHENTICATION DIAGNOSTIC TEST');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Configuration loaded from .env:');
console.log(`  SAP_HOST: ${SAP_CONFIG.host}`);
console.log(`  SAP_PORT: ${SAP_CONFIG.port}`);
console.log(`  SAP_CLIENT: ${SAP_CONFIG.client}`);
console.log(`  SAP_USERNAME: ${SAP_CONFIG.username}`);
console.log(`  SAP_PASSWORD: ${SAP_CONFIG.password ? '***' + SAP_CONFIG.password.slice(-3) : 'NOT SET'}`);
console.log();

if (!SAP_CONFIG.username || !SAP_CONFIG.password) {
  console.log('❌ ERROR: SAP_USERNAME or SAP_PASSWORD not found in .env file\n');
  console.log('Please ensure these variables are set in /home/ckabes/npdi-app/.env\n');
  process.exit(1);
}

const baseUrl = `http://${SAP_CONFIG.host}:${SAP_CONFIG.port}`;

// Disable SSL verification for testing
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testAuthentication() {
  console.log('Testing authentication methods...\n');

  // Test 1: Basic Auth with User Details Service
  console.log('1️⃣ Testing Basic Authentication with User Details Service');
  console.log(`   URL: ${baseUrl}/sap/opu/odata/sap/USERDETAILS_SRV/`);

  try {
    const response = await axios.get(
      `${baseUrl}/sap/opu/odata/sap/USERDETAILS_SRV/`,
      {
        auth: {
          username: SAP_CONFIG.username,
          password: SAP_CONFIG.password
        },
        httpsAgent,
        timeout: 15000
      }
    );

    console.log(`   ✅ SUCCESS! Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   Authentication is working!\n`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ FAILED: HTTP ${error.response.status}`);
      console.log(`   Status Text: ${error.response.statusText}`);

      if (error.response.status === 401) {
        console.log('\n   🔍 Diagnosis: Authentication Failed');
        console.log('   Possible reasons:');
        console.log('   - Username or password is incorrect');
        console.log('   - Password has expired');
        console.log('   - Account is locked');
        console.log('   - Client number is wrong (current: ' + SAP_CONFIG.client + ')');
        console.log('   - SAP system requires different authentication method');

        // Check if response has SAP-specific error details
        if (error.response.data) {
          const data = typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);

          if (data.includes('password') || data.includes('expired')) {
            console.log('\n   ⚠️  Response indicates password issue');
          }
          if (data.includes('locked')) {
            console.log('\n   ⚠️  Response indicates account is locked');
          }
        }
      } else if (error.response.status === 403) {
        console.log('\n   🔍 Diagnosis: Access Forbidden');
        console.log('   - Credentials accepted but user lacks permissions');
        console.log('   - Contact SAP Basis to grant OData access');
      }
    } else {
      console.log(`   ❌ Connection Error: ${error.message}`);
    }
    console.log();
    return false;
  }

  // Test 2: Try with sap-client parameter in URL
  console.log('\n2️⃣ Testing with sap-client parameter in URL');
  console.log(`   URL: ${baseUrl}/sap/opu/odata/sap/USERDETAILS_SRV/?sap-client=${SAP_CONFIG.client}`);

  try {
    const response = await axios.get(
      `${baseUrl}/sap/opu/odata/sap/USERDETAILS_SRV/?sap-client=${SAP_CONFIG.client}`,
      {
        auth: {
          username: SAP_CONFIG.username,
          password: SAP_CONFIG.password
        },
        httpsAgent,
        timeout: 15000
      }
    );

    console.log(`   ✅ SUCCESS! Status: ${response.status}`);
    console.log(`   sap-client parameter helped!\n`);
    return true;
  } catch (error) {
    console.log(`   ❌ Same error with sap-client parameter\n`);
  }

  // Test 3: Try the base OData path
  console.log('3️⃣ Testing base OData gateway');
  console.log(`   URL: ${baseUrl}/sap/opu/odata/?sap-client=${SAP_CONFIG.client}`);

  try {
    const response = await axios.get(
      `${baseUrl}/sap/opu/odata/?sap-client=${SAP_CONFIG.client}`,
      {
        auth: {
          username: SAP_CONFIG.username,
          password: SAP_CONFIG.password
        },
        httpsAgent,
        timeout: 15000
      }
    );

    console.log(`   ✅ SUCCESS! Status: ${response.status}`);
    console.log(`   Gateway base is accessible\n`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Status: ${error.response.status}\n`);
    } else {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  return false;
}

async function testSAPGUICredentials() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('CREDENTIAL VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Please verify these credentials work in SAP GUI or NWBC:\n');
  console.log(`  System: PRP (sapprpap3.sial.com)`);
  console.log(`  Client: ${SAP_CONFIG.client}`);
  console.log(`  User: ${SAP_CONFIG.username}`);
  console.log(`  Password: ${SAP_CONFIG.password ? '***' + SAP_CONFIG.password.slice(-3) : 'NOT SET'}`);
  console.log();
  console.log('Steps to verify:');
  console.log('  1. Open SAP GUI or NWBC');
  console.log('  2. Connect to PRP system');
  console.log('  3. Try logging in with these credentials');
  console.log('  4. If login fails, password may be expired or account locked');
  console.log();
}

// Run tests
testAuthentication().then(success => {
  if (!success) {
    testSAPGUICredentials();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Since authentication is failing, here are your options:\n');
    console.log('1️⃣ Verify Credentials');
    console.log('   - Test login via SAP GUI or NWBC first');
    console.log('   - Contact SAP support if password is expired');
    console.log('   - Try different client number (100, 200, 300)\n');

    console.log('2️⃣ Contact SAP Basis Team');
    console.log('   - Confirm OData Gateway is enabled for your user');
    console.log('   - Request ICF services be activated');
    console.log('   - Ask about authentication requirements\n');

    console.log('3️⃣ Alternative Approach (if OData fails)');
    console.log('   - Use SAP RFC SDK instead of OData');
    console.log('   - Manual GUID entry in application');
    console.log('   - Build "View in SAP" link using known URL pattern\n');
  } else {
    console.log('\n✅ Authentication successful!');
    console.log('You can now use OData services with these credentials.\n');
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
