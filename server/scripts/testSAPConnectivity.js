/**
 * SAP Connectivity Test Script
 * Tests various SAP endpoints to determine what services are available
 */

const axios = require('axios');
const https = require('https');

// SAP Configuration
const SAP_CONFIG = {
  host: 'sapprpap3.sial.com',
  port: '8083',
  // Optional - will test without auth if not provided
  username: process.env.SAP_USERNAME || '',
  password: process.env.SAP_PASSWORD || ''
};

// Check if credentials are provided
const hasCredentials = SAP_CONFIG.username && SAP_CONFIG.password;

// Disable SSL verification for testing (remove in production)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const baseUrl = `http://${SAP_CONFIG.host}:${SAP_CONFIG.port}`;

// Endpoints to test
const testEndpoints = [
  {
    name: 'SAP Gateway Base',
    url: '/sap/opu/odata/',
    description: 'Base OData service path'
  },
  {
    name: 'OData V2 Catalog (with version)',
    url: '/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection?$format=json',
    description: 'Standard catalog service with version parameter'
  },
  {
    name: 'OData V2 Catalog (no version)',
    url: '/sap/opu/odata/IWFND/CATALOGSERVICE/ServiceCollection?$format=json',
    description: 'Catalog without version parameter'
  },
  {
    name: 'OData V4 Base',
    url: '/sap/opu/odata4/',
    description: 'OData V4 service base path'
  },
  {
    name: 'OData V4 Catalog',
    url: '/sap/opu/odata4/iwfnd/config/default/iwfnd/catalog/0002/ServiceGroups',
    description: 'OData V4 catalog service'
  },
  {
    name: 'ICF Service Tree',
    url: '/sap/bc/gui/sap/its/webgui',
    description: 'Internet Communication Framework test'
  },
  {
    name: 'User Details Service',
    url: '/sap/opu/odata/sap/USERDETAILS_SRV/',
    description: 'Common standard service for user details'
  },
  {
    name: 'Business Partner API',
    url: '/sap/opu/odata/sap/API_BUSINESS_PARTNER/',
    description: 'Standard Business Partner OData service'
  },
  {
    name: 'Material Master API',
    url: '/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/',
    description: 'Material stock service'
  },
  {
    name: 'Product API',
    url: '/sap/opu/odata/sap/API_PRODUCT_SRV/',
    description: 'Product master data service'
  }
];

async function testEndpoint(endpoint) {
  const fullUrl = `${baseUrl}${endpoint.url}`;

  try {
    const config = {
      httpsAgent,
      timeout: 10000,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    };

    // Only add auth if credentials are provided
    if (hasCredentials) {
      config.auth = {
        username: SAP_CONFIG.username,
        password: SAP_CONFIG.password
      };
    }

    const response = await axios.get(fullUrl, config);

    return {
      success: response.status === 200,
      status: response.status,
      message: response.status === 200 ? 'Service is active!' : `HTTP ${response.status}`,
      contentType: response.headers['content-type'],
      hasData: response.data ? true : false
    };
  } catch (error) {
    if (error.response) {
      // Server responded with error
      return {
        success: false,
        status: error.response.status,
        message: error.response.status === 404
          ? 'Service not found (may need activation in SICF)'
          : error.response.status === 401
          ? 'Authentication required (provide SAP_USERNAME and SAP_PASSWORD)'
          : error.response.status === 403
          ? 'Access forbidden (user lacks permissions)'
          : `HTTP ${error.response.status}`,
        error: error.message
      };
    } else if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'Connection refused (server not reachable)',
        error: error.code
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: 'Connection timeout',
        error: error.code
      };
    } else {
      return {
        success: false,
        message: error.message,
        error: error.code || 'Unknown error'
      };
    }
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SAP CONNECTIVITY TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Server: ${baseUrl}`);

  if (hasCredentials) {
    console.log(`Username: ${SAP_CONFIG.username}`);
    console.log(`Authentication: ✅ Enabled`);
  } else {
    console.log(`Authentication: ⚠️  Disabled (testing without credentials)`);
    console.log(`Note: Some services may require authentication`);
  }

  console.log(`Testing ${testEndpoints.length} endpoints...\n`);

  const results = [];

  for (const endpoint of testEndpoints) {
    console.log(`\n🔍 Testing: ${endpoint.name}`);
    console.log(`   ${endpoint.description}`);
    console.log(`   URL: ${baseUrl}${endpoint.url}`);

    const result = await testEndpoint(endpoint);
    results.push({ ...endpoint, ...result });

    if (result.success) {
      console.log(`   ✅ SUCCESS - ${result.message}`);
      if (result.contentType) {
        console.log(`   📄 Content-Type: ${result.contentType}`);
      }
    } else {
      console.log(`   ❌ FAILED - ${result.message}`);
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}\n`);

  if (successful.length > 0) {
    console.log('✅ AVAILABLE SERVICES:');
    successful.forEach(r => {
      console.log(`   • ${r.name}`);
      console.log(`     ${baseUrl}${r.url}\n`);
    });
  }

  console.log('\n📋 RECOMMENDATIONS:\n');

  if (!hasCredentials) {
    console.log('ℹ️  No Credentials Provided:');
    console.log('   - Tests run without authentication');
    console.log('   - Add SAP_USERNAME and SAP_PASSWORD to .env for authenticated tests');
    console.log('   - Some services may only be accessible with valid credentials\n');
  }

  if (failed.some(r => r.status === 401)) {
    console.log('⚠️  Authentication Required:');
    console.log('   - Set SAP_USERNAME and SAP_PASSWORD in .env file');
    console.log('   - Verify credentials work in SAP GUI or NWBC');
    console.log('   - Contact SAP support if password is expired\n');
  }

  if (failed.some(r => r.status === 404 && r.url.includes('CATALOGSERVICE'))) {
    console.log('⚠️  Catalog Service Not Available:');
    console.log('   - Contact SAP Basis team to activate CATALOGSERVICE in transaction SICF');
    console.log('   - Path: /sap/opu/odata/iwfnd/catalogservice');
    console.log('   - This service is needed to discover other OData services\n');
  }

  if (successful.length === 0) {
    console.log('⚠️  No Services Available:');
    console.log('   - SAP Gateway may not be configured on this system');
    console.log('   - Contact SAP Basis team to enable Gateway services');
    console.log('   - May need to use RFC SDK approach instead of OData\n');
  } else if (successful.length > 0 && !successful.some(r => r.name.includes('Catalog'))) {
    console.log('💡 Services Available but No Catalog:');
    console.log('   - Some services are active, but catalog is disabled');
    console.log('   - You can still use specific OData services if you know their paths');
    console.log('   - Request catalog activation to discover all available services\n');
  }

  if (successful.length > 0) {
    console.log('🎯 NEXT STEPS:');
    console.log('   1. Share these results with your SAP Basis team');
    console.log('   2. Request activation of catalog service if not available');
    console.log('   3. Ask about RPM/NPDI-specific OData services');
    console.log('   4. If no OData available, consider RFC SDK approach\n');
  }

  // Save results
  const fs = require('fs');
  fs.writeFileSync(
    './sap-connectivity-test-results.json',
    JSON.stringify({
      testDate: new Date().toISOString(),
      server: baseUrl,
      results: results
    }, null, 2)
  );

  console.log('💾 Results saved to: sap-connectivity-test-results.json\n');
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
