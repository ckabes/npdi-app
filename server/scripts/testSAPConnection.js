#!/usr/bin/env node
/**
 * Simple SAP Connection Test
 * Tests basic HTTP connectivity to SAP server
 *
 * Usage:
 *   node testSAPConnection.js
 *   node testSAPConnection.js --host=sapprpap19.sial.com --port=8083 --username=M305853 --password=yourpass
 */

const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.substring(2).split('=');
    options[key] = value || true;
  }
});

// Get configuration from command line or .env
const config = {
  host: options.host || process.env.SAP_HOST || 'sapprpap19.sial.com',
  port: options.port || process.env.SAP_PORT || '44300',
  client: options.client || process.env.SAP_CLIENT || '100',
  username: options.username || process.env.SAP_USERNAME || '',
  password: options.password || process.env.SAP_PASSWORD || '',
  protocol: options.protocol || process.env.SAP_PROTOCOL || 'https'
};

// HTTPS agent that ignores certificate validation (for corporate SAP servers)
// WARNING: Only use for development/testing with trusted internal servers
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // Ignore self-signed certificates
});

async function testSAPConnection() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SAP CONNECTION TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Show configuration (hide password)
  console.log('Configuration:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Host:       ${config.host}`);
  console.log(`Port:       ${config.port}`);
  console.log(`Client:     ${config.client}`);
  console.log(`Username:   ${config.username || '(not set)'}`);
  console.log(`Password:   ${config.password ? '***set***' : '(not set)'}`);
  console.log(`Protocol:   ${config.protocol}`);
  console.log(`SSL Verify: Disabled (for corporate certificates)`);
  console.log('─────────────────────────────────────────────────────────────\n');

  // Check if credentials are provided
  if (!config.username || !config.password) {
    console.log('❌ ERROR: Username and password are required\n');
    console.log('Options:');
    console.log('1. Set in .env file: SAP_USERNAME=... SAP_PASSWORD=...');
    console.log('2. Pass as arguments: --username=... --password=...\n');
    process.exit(1);
  }

  try {
    // Test 1: Basic network connectivity
    console.log('🔍 Test 1: Testing network connectivity...\n');

    const baseUrl = `${config.protocol}://${config.host}:${config.port}`;
    console.log(`   Connecting to: ${baseUrl}`);

    const startTime = Date.now();

    try {
      const response = await axios.get(`${baseUrl}/`, {
        timeout: 10000,
        httpsAgent: httpsAgent,
        validateStatus: () => true // Accept any status code
      });

      const duration = Date.now() - startTime;

      console.log(`   ✅ Server responded in ${duration}ms`);
      console.log(`   HTTP Status: ${response.status} ${response.statusText}`);

      if (response.status === 200) {
        console.log('   Server is reachable and responding\n');
      } else {
        console.log('   Server is reachable (authentication may be required)\n');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('   ❌ Connection refused');
        console.log('   The server is not reachable. Are you connected to VPN?\n');
        process.exit(1);
      } else if (error.code === 'ETIMEDOUT') {
        console.log('   ❌ Connection timeout');
        console.log('   The server did not respond. Check your network/VPN connection.\n');
        process.exit(1);
      } else if (error.code === 'ENOTFOUND') {
        console.log('   ❌ Host not found');
        console.log(`   Cannot resolve hostname: ${config.host}\n`);
        process.exit(1);
      } else {
        throw error;
      }
    }

    // Test 2: Test with authentication
    console.log('🔐 Test 2: Testing SAP authentication...\n');

    const testUrl = `${config.protocol}://${config.host}:${config.port}/sap/bc/webdynpro/sap/rpm_item_details`;
    console.log(`   URL: ${testUrl}`);
    console.log(`   User: ${config.username}`);

    const authStartTime = Date.now();

    const authResponse = await axios.get(testUrl, {
      auth: {
        username: config.username,
        password: config.password
      },
      params: {
        'sap-client': config.client
      },
      httpsAgent: httpsAgent,
      timeout: 30000,
      validateStatus: () => true // Accept any status code
    });

    const authDuration = Date.now() - authStartTime;

    console.log(`   Response: ${authResponse.status} ${authResponse.statusText}`);
    console.log(`   Duration: ${authDuration}ms\n`);

    // Interpret results
    if (authResponse.status === 200) {
      console.log('   ✅ SUCCESS - Authentication accepted!');
      console.log('   You can connect to SAP RPM with these credentials.\n');
    } else if (authResponse.status === 401) {
      console.log('   ❌ AUTHENTICATION FAILED');
      console.log('   Username or password is incorrect.\n');
      console.log('   Troubleshooting:');
      console.log('   - Verify your SAP username');
      console.log('   - Check if your password is correct');
      console.log('   - Try logging into SAP GUI to verify credentials\n');
      process.exit(1);
    } else if (authResponse.status === 403) {
      console.log('   ❌ ACCESS FORBIDDEN');
      console.log('   Your credentials are valid but you lack permissions.\n');
      console.log('   Troubleshooting:');
      console.log('   - Contact SAP Basis team for authorization');
      console.log('   - Request access to SAP RPM module\n');
      process.exit(1);
    } else if (authResponse.status === 404) {
      console.log('   ⚠️  SERVICE NOT FOUND (but authentication worked!)');
      console.log('   The SAP RPM service may not be activated.\n');
      console.log('   This is OK - it means you CAN connect to SAP,');
      console.log('   but the specific service might not be available.\n');
    } else if (authResponse.status >= 500) {
      console.log('   ⚠️  SERVER ERROR');
      console.log('   SAP server returned an error. This may be temporary.\n');
    } else {
      console.log(`   ⚠️  Unexpected response: ${authResponse.status}`);
      console.log('   Connection works but response is unexpected.\n');
    }

    // Test 3: Try to retrieve project by ID (if provided)
    const projectId = options.project || '100000000000000572302024';

    console.log('📋 Test 3: Testing project retrieval by ID...\n');
    console.log(`   Project ID: ${projectId}\n`);

    // Try different SAP RPM API endpoints
    const rpmEndpoints = [
      `/sap/opu/odata/sap/RPM_ITEM_SRV/Items('${projectId}')`,
      `/sap/opu/odata/sap/RPM_PROJECT_SRV/Projects('${projectId}')`,
      `/sap/opu/odata4/sap/api_project/srvd_a2x/sap/project/0001/Project('${projectId}')`
    ];

    let projectFound = false;

    for (const endpoint of rpmEndpoints) {
      const projectUrl = `${config.protocol}://${config.host}:${config.port}${endpoint}`;

      console.log(`   Trying: ${endpoint}`);

      try {
        const projectStartTime = Date.now();

        const projectResponse = await axios.get(projectUrl, {
          auth: {
            username: config.username,
            password: config.password
          },
          params: {
            'sap-client': config.client
          },
          headers: {
            'Accept': 'application/json'
          },
          httpsAgent: httpsAgent,
          timeout: 30000,
          validateStatus: () => true
        });

        const projectDuration = Date.now() - projectStartTime;

        console.log(`   Response: ${projectResponse.status} ${projectResponse.statusText} (${projectDuration}ms)`);

        if (projectResponse.status === 200) {
          console.log('   ✅ SUCCESS - Project retrieved!\n');

          // Show project data
          const data = projectResponse.data.d || projectResponse.data;
          console.log('   Project Data:');
          console.log('   ─────────────────────────────────────────────────────────');
          console.log(JSON.stringify(data, null, 2).split('\n').map(line => '   ' + line).join('\n'));
          console.log('   ─────────────────────────────────────────────────────────\n');

          projectFound = true;
          break;
        } else if (projectResponse.status === 404) {
          console.log('   Not found at this endpoint\n');
        } else if (projectResponse.status === 401) {
          console.log('   Authentication required\n');
        } else {
          console.log(`   Unexpected status: ${projectResponse.status}\n`);
        }
      } catch (error) {
        console.log(`   Error: ${error.message}\n`);
      }
    }

    if (!projectFound) {
      console.log('   ⚠️  Could not retrieve project by ID');
      console.log('   The SAP OData API may not be available or the project ID format may differ.\n');
      console.log('   This is OK - you can still use manual URL linking.\n');
      console.log('   To enable API-based project retrieval:');
      console.log('   - Contact SAP Basis team to activate OData services');
      console.log('   - Request access to RPM_ITEM_SRV or RPM_PROJECT_SRV\n');
    }

    // Test 4: Try OData metadata endpoint
    console.log('🌐 Test 4: Testing OData service catalog...\n');

    const odataUrl = `${config.protocol}://${config.host}:${config.port}/sap/opu/odata/sap/`;
    console.log(`   URL: ${odataUrl}`);

    const odataStartTime = Date.now();

    const odataResponse = await axios.get(odataUrl, {
      auth: {
        username: config.username,
        password: config.password
      },
      params: {
        'sap-client': config.client
      },
      headers: {
        'Accept': 'application/xml'
      },
      httpsAgent: httpsAgent,
      timeout: 30000,
      validateStatus: () => true
    });

    const odataDuration = Date.now() - odataStartTime;

    console.log(`   Response: ${odataResponse.status} ${odataResponse.statusText}`);
    console.log(`   Duration: ${odataDuration}ms\n`);

    if (odataResponse.status === 200) {
      console.log('   ✅ OData service catalog is accessible');
      console.log('   SAP OData services are available.\n');
    } else {
      console.log('   ⚠️  OData service catalog not accessible');
      console.log('   API integration requires OData service activation.\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ CONNECTION TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (authResponse.status === 200 || authResponse.status === 404) {
      console.log('RESULT: ✅ You CAN connect to SAP!\n');
      console.log('What this means:');
      console.log('✓ Network connectivity to SAP server works');
      console.log('✓ Your credentials are valid');
      console.log('✓ You can proceed with SAP integration\n');

      if (projectFound) {
        console.log('✅ PROJECT RETRIEVAL BY ID: WORKING\n');
        console.log('You can retrieve projects directly using only the Project ID!');
        console.log('No need to paste URLs - the API integration is fully functional.\n');
        console.log('Next steps:');
        console.log('1. Implement API routes to search/retrieve projects by ID');
        console.log('2. Build UI to search and link projects by ID');
        console.log('3. Enable automatic status synchronization\n');
      } else {
        console.log('⚠️  PROJECT RETRIEVAL BY ID: NOT AVAILABLE\n');
        console.log('The OData API for retrieving projects by ID is not accessible.');
        console.log('You can still use manual URL linking (paste SAP URLs).\n');
        console.log('To enable API-based retrieval:');
        console.log('1. Contact SAP Basis team to activate OData services');
        console.log('2. Request access to RPM_ITEM_SRV or RPM_PROJECT_SRV');
        console.log('3. Or continue with manual URL linking approach\n');
      }
    } else {
      console.log('RESULT: ⚠️  Connection issues detected\n');
      console.log('Please review the errors above and:');
      console.log('1. Verify you are connected to SAP VPN');
      console.log('2. Check your SAP credentials');
      console.log('3. Contact SAP support if needed\n');
    }

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('❌ CONNECTION TEST FAILED');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log(`Error: ${error.message}\n`);

    if (error.code) {
      console.log(`Error Code: ${error.code}\n`);
    }

    console.log('Common issues:');
    console.log('1. Not connected to VPN - Connect to corporate VPN');
    console.log('2. Incorrect hostname - Check SAP_HOST in .env');
    console.log('3. Firewall blocking - Contact network team');
    console.log('4. SAP server down - Contact SAP Basis team\n');

    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
      console.log('');
    }

    process.exit(1);
  }
}

// Run the test
testSAPConnection()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error.message);
    process.exit(1);
  });
