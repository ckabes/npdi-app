#!/usr/bin/env node
/**
 * Test SAP NWBC (NetWeaver Business Client) Access
 * Tests the desktop client endpoint
 */

const path = require('path');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');

// Desktop client endpoint
const NWBC_BASE_URL = 'http://sapprpap8.sial.com:8083';
const NWBC_PATH = '/nwbc/';

const config = {
  username: process.env.SAP_USERNAME,
  password: process.env.SAP_PASSWORD,
  client: '100'
};

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testNWBC() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SAP NWBC (NETWEAVER BUSINESS CLIENT) TEST');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Configuration from Desktop Client:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`Host:       sapprpap8.sial.com`);
  console.log(`Port:       8083`);
  console.log(`Protocol:   http`);
  console.log(`Path:       /nwbc/`);
  console.log(`Client:     100`);
  console.log(`Username:   ${config.username}`);
  console.log('─────────────────────────────────────────────────────────────\n');

  try {
    // Test 1: NWBC root with parameters from desktop client
    console.log('🔍 Test 1: Testing NWBC root endpoint...\n');

    const nwbcUrl = `${NWBC_BASE_URL}${NWBC_PATH}`;
    const params = {
      'sap-client': config.client,
      'sap-language': 'EN',
      'sap-nwbc-node': 'root',
      'sap-theme': 'SAP_BELIZE'
    };

    console.log(`   URL: ${nwbcUrl}`);
    console.log(`   Params: ${JSON.stringify(params)}\n`);

    const startTime = Date.now();

    const response = await axios.get(nwbcUrl, {
      auth: {
        username: config.username,
        password: config.password
      },
      params: params,
      httpsAgent: httpsAgent,
      timeout: 30000,
      validateStatus: () => true,
      maxRedirects: 5
    });

    const duration = Date.now() - startTime;

    console.log(`   Response: ${response.status} ${response.statusText}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   Content-Length: ${response.headers['content-length'] || 'unknown'}\n`);

    if (response.status === 200) {
      console.log('   ✅ SUCCESS - NWBC endpoint is accessible!\n');

      // Check for authentication markers in response
      const body = response.data.toString().toLowerCase();
      if (body.includes('login') || body.includes('logon')) {
        console.log('   ⚠️  Response contains login page - session authentication may be required\n');
      } else if (body.includes('nwbc') || body.includes('netweaver')) {
        console.log('   ✅ NWBC content detected - authenticated successfully!\n');
      }

      // Show snippet
      const snippet = response.data.toString().substring(0, 500);
      console.log('   Response preview:');
      console.log('   ─────────────────────────────────────────────────────────');
      console.log(snippet.split('\n').map(line => '   ' + line).join('\n'));
      console.log('   ─────────────────────────────────────────────────────────\n');

    } else if (response.status === 401) {
      console.log('   ❌ Authentication required\n');
    } else if (response.status === 403) {
      console.log('   ❌ Access forbidden\n');
    } else {
      console.log(`   ⚠️  Status: ${response.status}\n`);
    }

    // Test 2: Try ICF service tree
    console.log('🌐 Test 2: Testing ICF service tree...\n');

    const icfUrl = `${NWBC_BASE_URL}/sap/bc/icf/`;
    console.log(`   URL: ${icfUrl}\n`);

    const icfResponse = await axios.get(icfUrl, {
      auth: {
        username: config.username,
        password: config.password
      },
      params: {
        'sap-client': config.client
      },
      httpsAgent: httpsAgent,
      timeout: 10000,
      validateStatus: () => true
    });

    console.log(`   Response: ${icfResponse.status} ${icfResponse.statusText}\n`);

    if (icfResponse.status === 200) {
      console.log('   ✅ ICF service tree accessible\n');
    }

    // Test 3: Try OData catalog
    console.log('📊 Test 3: Testing OData catalog...\n');

    const odataUrl = `${NWBC_BASE_URL}/sap/opu/odata/sap/`;
    console.log(`   URL: ${odataUrl}\n`);

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
      timeout: 10000,
      validateStatus: () => true
    });

    console.log(`   Response: ${odataResponse.status} ${odataResponse.statusText}\n`);

    if (odataResponse.status === 200) {
      console.log('   ✅ OData services accessible!\n');

      // Show available services
      const services = odataResponse.data.toString();
      if (services.includes('RPM')) {
        console.log('   ✅ RPM services found in catalog!\n');
      }
    } else if (odataResponse.status === 403) {
      console.log('   ❌ OData access forbidden (authorization required)\n');
    }

    // Test 4: Try WebGUI endpoint
    console.log('🖥️  Test 4: Testing WebGUI endpoint...\n');

    const webguiUrl = `${NWBC_BASE_URL}/sap/bc/gui/sap/its/webgui`;
    console.log(`   URL: ${webguiUrl}\n`);

    const webguiResponse = await axios.get(webguiUrl, {
      auth: {
        username: config.username,
        password: config.password
      },
      params: {
        'sap-client': config.client
      },
      httpsAgent: httpsAgent,
      timeout: 10000,
      validateStatus: () => true
    });

    console.log(`   Response: ${webguiResponse.status} ${webguiResponse.statusText}\n`);

    if (webguiResponse.status === 200) {
      console.log('   ✅ WebGUI accessible - Can use transaction-based URLs!\n');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const results = {
      nwbc: response.status === 200,
      icf: icfResponse.status === 200,
      odata: odataResponse.status === 200,
      webgui: webguiResponse.status === 200
    };

    console.log('Endpoint Accessibility:');
    console.log(`  NWBC:   ${results.nwbc ? '✅ Working' : '❌ Not accessible'}`);
    console.log(`  ICF:    ${results.icf ? '✅ Working' : '❌ Not accessible'}`);
    console.log(`  OData:  ${results.odata ? '✅ Working' : '❌ Not accessible'}`);
    console.log(`  WebGUI: ${results.webgui ? '✅ Working' : '❌ Not accessible'}`);
    console.log('');

    if (results.nwbc || results.icf || results.webgui) {
      console.log('✅ GOOD NEWS: You CAN connect to SAP via sapprpap8.sial.com!\n');
      console.log('This is a different server than sapprpap19.sial.com.');
      console.log('Desktop client uses: sapprpap8.sial.com:8083 (http)');
      console.log('WebDynpro uses: sapprpap19.sial.com:44300 (https)\n');

      if (results.odata) {
        console.log('✅ OData API is accessible - Can retrieve projects by ID!\n');
      } else {
        console.log('⚠️  OData API not accessible - Use URL-based linking\n');
      }
    } else {
      console.log('⚠️  Could not connect to any SAP endpoints\n');
    }

  } catch (error) {
    console.log('❌ TEST FAILED\n');
    console.log(`Error: ${error.message}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused - Server may not be accessible\n');
    }
  }
}

testNWBC()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
