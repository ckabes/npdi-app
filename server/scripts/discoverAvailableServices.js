/**
 * Discover Available SAP OData Services
 * Now that authentication works, let's find what services exist!
 */

require('dotenv').config();
const axios = require('axios');
const https = require('https');
const fs = require('fs');

const SAP_CONFIG = {
  host: process.env.SAP_HOST,
  port: process.env.SAP_PORT,
  client: process.env.SAP_CLIENT || '100',
  username: process.env.SAP_USERNAME,
  password: process.env.SAP_PASSWORD
};

const baseUrl = `http://${SAP_CONFIG.host}:${SAP_CONFIG.port}`;

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('SAP OData SERVICE DISCOVERY');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`Server: ${baseUrl}`);
console.log(`Client: ${SAP_CONFIG.client}`);
console.log(`User: ${SAP_CONFIG.username}`);
console.log('Authentication: ✅ Working!\n');

const discoveredServices = [];

async function testService(name, url, description) {
  const fullUrl = `${baseUrl}${url}?sap-client=${SAP_CONFIG.client}`;

  try {
    const response = await axios.get(fullUrl, {
      auth: {
        username: SAP_CONFIG.username,
        password: SAP_CONFIG.password
      },
      httpsAgent,
      timeout: 15000,
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log(`✅ ${name}`);
    console.log(`   URL: ${url}`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);

    discoveredServices.push({
      name,
      url,
      description,
      status: response.status,
      available: true,
      contentType: response.headers['content-type']
    });

    // If it's a service document, try to get entities
    if (response.data && response.data.d) {
      console.log(`   📊 Service data available`);
    }

    console.log();
    return true;
  } catch (error) {
    const status = error.response ? error.response.status : 'No response';
    console.log(`❌ ${name} - Status: ${status}`);

    discoveredServices.push({
      name,
      url,
      description,
      status: status,
      available: false,
      error: error.message
    });

    return false;
  }
}

async function tryDiscovery() {
  console.log('🔍 Testing common OData service paths...\n');

  // Try to get the service catalog
  console.log('1️⃣ Attempting to access OData Catalog Service\n');

  const catalogUrls = [
    '/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection',
    '/sap/opu/odata/iwfnd/catalogservice;v=2/ServiceCollection',
    '/sap/opu/odata/IWFND/CATALOGSERVICE/ServiceCollection'
  ];

  let catalogFound = false;

  for (const catalogUrl of catalogUrls) {
    const fullUrl = `${baseUrl}${catalogUrl}?sap-client=${SAP_CONFIG.client}`;
    console.log(`   Trying: ${catalogUrl}`);

    try {
      const response = await axios.get(fullUrl, {
        auth: {
          username: SAP_CONFIG.username,
          password: SAP_CONFIG.password
        },
        httpsAgent,
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`   ✅ CATALOG FOUND!\n`);
      catalogFound = true;

      // Parse services from catalog
      if (response.data && response.data.d && response.data.d.results) {
        const services = response.data.d.results;
        console.log(`   📋 Found ${services.length} services in catalog!\n`);

        // Filter for relevant services
        const keywords = ['RPM', 'RECIPE', 'PRODUCT', 'NPDI', 'PLM', 'MATERIAL', 'ITEM', 'API'];
        const relevantServices = services.filter(s =>
          keywords.some(k =>
            (s.TechnicalServiceName && s.TechnicalServiceName.toUpperCase().includes(k)) ||
            (s.Title && s.Title.toUpperCase().includes(k))
          )
        );

        if (relevantServices.length > 0) {
          console.log('═══════════════════════════════════════════════════════════════');
          console.log(`🎯 FOUND ${relevantServices.length} RELEVANT SERVICES:`);
          console.log('═══════════════════════════════════════════════════════════════\n');

          relevantServices.forEach((service, idx) => {
            console.log(`${idx + 1}. ${service.Title || 'Untitled'}`);
            console.log(`   Technical Name: ${service.TechnicalServiceName}`);
            console.log(`   Service URL: ${service.ServiceUrl}`);
            console.log(`   Version: ${service.Version || 'N/A'}`);
            if (service.Description) {
              console.log(`   Description: ${service.Description}`);
            }
            console.log();
          });

          // Save relevant services
          fs.writeFileSync(
            './sap-relevant-services.json',
            JSON.stringify({
              discoveryDate: new Date().toISOString(),
              server: baseUrl,
              client: SAP_CONFIG.client,
              totalServices: services.length,
              relevantServices: relevantServices
            }, null, 2)
          );

          console.log('💾 Relevant services saved to: sap-relevant-services.json\n');
        } else {
          console.log('⚠️  No RPM/NPDI/Product related services found in catalog');
          console.log('   This might mean:');
          console.log('   - Custom NPDI services use different naming');
          console.log('   - Services haven\'t been created yet');
          console.log('   - Need to use RFC SDK approach instead\n');
        }

        // Save all services
        fs.writeFileSync(
          './sap-all-services.json',
          JSON.stringify({
            discoveryDate: new Date().toISOString(),
            server: baseUrl,
            client: SAP_CONFIG.client,
            allServices: services
          }, null, 2)
        );

        console.log('💾 All services saved to: sap-all-services.json\n');
      }

      break;
    } catch (error) {
      console.log(`   ❌ Not found\n`);
    }
  }

  if (!catalogFound) {
    console.log('⚠️  Catalog service not activated');
    console.log('   Testing individual services instead...\n');

    // Test common SAP API services
    console.log('2️⃣ Testing Standard SAP API Services\n');

    const standardServices = [
      { name: 'Product Master', url: '/sap/opu/odata/sap/API_PRODUCT_SRV', desc: 'Product master data' },
      { name: 'Material Document', url: '/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV', desc: 'Material documents' },
      { name: 'Material Stock', url: '/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV', desc: 'Material stock info' },
      { name: 'Business Partner', url: '/sap/opu/odata/sap/API_BUSINESS_PARTNER', desc: 'Business partner data' },
      { name: 'Sales Order', url: '/sap/opu/odata/sap/API_SALES_ORDER_SRV', desc: 'Sales order data' },
    ];

    for (const service of standardServices) {
      await testService(service.name, service.url, service.desc);
    }

    // Test custom NPDI/RPM services
    console.log('\n3️⃣ Testing Potential Custom NPDI/RPM Services\n');

    const customServices = [
      { name: 'Custom NPDI Service', url: '/sap/opu/odata/sap/Z_NPDI_SRV', desc: 'Custom NPDI tracking' },
      { name: 'Custom RPM Service', url: '/sap/opu/odata/sap/Z_RPM_SRV', desc: 'Custom RPM service' },
      { name: 'Custom Product Service', url: '/sap/opu/odata/sap/Z_PRODUCT_SRV', desc: 'Custom product service' },
      { name: 'Merck NPDI Service', url: '/sap/opu/odata/merck/NPDI_SRV', desc: 'Merck-specific NPDI' },
      { name: 'MilliporeSigma NPDI', url: '/sap/opu/odata/sap/ZMS_NPDI_SRV', desc: 'MilliporeSigma NPDI' },
    ];

    for (const service of customServices) {
      await testService(service.name, service.url, service.desc);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const available = discoveredServices.filter(s => s.available);
  const unavailable = discoveredServices.filter(s => !s.available);

  console.log(`✅ Available Services: ${available.length}`);
  console.log(`❌ Unavailable Services: ${unavailable.length}\n`);

  if (available.length > 0) {
    console.log('✅ AVAILABLE SERVICES:\n');
    available.forEach(s => {
      console.log(`   • ${s.name}`);
      console.log(`     ${baseUrl}${s.url}?sap-client=${SAP_CONFIG.client}\n`);
    });
  }

  console.log('\n📋 NEXT STEPS:\n');

  if (catalogFound) {
    console.log('✅ Catalog service is active - check sap-relevant-services.json for NPDI/RPM services\n');
  } else {
    console.log('⚠️  Catalog service not available - contact SAP Basis to activate it\n');
  }

  if (available.length > 0) {
    console.log('💡 You can now use available services in your Node.js application!');
    console.log('   Example code:\n');
    console.log('   const axios = require(\'axios\');');
    console.log('   const response = await axios.get(');
    console.log(`     '${baseUrl}${available[0].url}?sap-client=${SAP_CONFIG.client}',`);
    console.log('     {');
    console.log(`       auth: { username: '${SAP_CONFIG.username}', password: 'your_password' }`);
    console.log('     }');
    console.log('   );\n');
  }

  console.log('🔍 If no NPDI-specific services found:');
  console.log('   1. Ask SAP Basis team about NPDI/RPM OData services');
  console.log('   2. Check if custom Z* services exist for your org');
  console.log('   3. Consider using RFC SDK approach');
  console.log('   4. Or manually enter GUID and build "View in SAP" links\n');
}

tryDiscovery().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
