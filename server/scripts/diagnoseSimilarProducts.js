/**
 * Diagnostic Script for Similar Products Search
 *
 * This script tests the similar products functionality by:
 * 1. Looking up a specific part number (459844) in SAP/Palantir
 * 2. Checking its CAS number
 * 3. Searching for all products with the same CAS number
 * 4. Analyzing why certain products may not appear in results
 *
 * Usage: node server/scripts/diagnoseSimilarProducts.js [part-number] [cas-number]
 * Example: node server/scripts/diagnoseSimilarProducts.js 459844 64-17-5
 */

require('dotenv').config();
const mongoose = require('mongoose');
const palantirService = require('../services/palantirService');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app';
const TEST_PART_NUMBER = process.argv[2] || '459844';
const TEST_CAS_NUMBER = process.argv[3] || '64-17-5';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('  SIMILAR PRODUCTS DIAGNOSTIC TOOL');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log(`Test Part Number: ${TEST_PART_NUMBER}`);
console.log(`Test CAS Number: ${TEST_CAS_NUMBER}`);
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

async function runDiagnostics() {
  try {
    // Connect to MongoDB
    console.log('[Step 1] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Check if Palantir is enabled
    console.log('[Step 2] Checking Palantir configuration...');
    const isEnabled = await palantirService.isEnabled();
    if (!isEnabled) {
      console.error('✗ Palantir integration is not enabled or not configured properly');
      console.error('  Please configure Palantir settings in the admin dashboard first.');
      process.exit(1);
    }
    const config = await palantirService.getConfig();
    console.log('✓ Palantir is enabled');
    console.log(`  Dataset RID: ${config.datasetRID}`);
    console.log(`  Hostname: ${config.hostname}\n`);

    // Test 1: Look up the specific part number
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log(`[Test 1] Looking up part number ${TEST_PART_NUMBER}...`);
    console.log('───────────────────────────────────────────────────────────────────────────────');

    const partLookupQuery = `
      SELECT MATNR, TEXT_SHORT, YYD_CASNR
      FROM \`${config.datasetRID}\`
      WHERE MATNR LIKE '${TEST_PART_NUMBER}%'
      LIMIT 10
    `;

    console.log('Executing query:');
    console.log(partLookupQuery);
    console.log();

    let partResults = null;
    try {
      partResults = await palantirService.executeQuery(partLookupQuery);

      if (partResults && partResults.rows && partResults.rows.length > 0) {
        console.log(`✓ Found ${partResults.rows.length} variant(s) of part ${TEST_PART_NUMBER}:\n`);

        const table = [];
        for (const row of partResults.rows) {
          console.log(`  MATNR: ${row.MATNR || 'N/A'}`);
          console.log(`  Name: ${row.TEXT_SHORT || 'N/A'}`);
          console.log(`  CAS: ${row.YYD_CASNR || 'NOT FOUND'}`);
          console.log();

          table.push({
            MATNR: row.MATNR,
            TEXT_SHORT: row.TEXT_SHORT,
            YYD_CASNR: row.YYD_CASNR
          });
        }

        // Check if CAS number exists
        const hasMatchingCAS = partResults.rows.some(row => row.YYD_CASNR === TEST_CAS_NUMBER);
        if (hasMatchingCAS) {
          console.log(`✓ CONFIRMED: Part ${TEST_PART_NUMBER} has CAS number ${TEST_CAS_NUMBER}`);
        } else {
          const actualCAS = partResults.rows[0]?.YYD_CASNR;
          if (actualCAS) {
            console.log(`⚠ WARNING: Part ${TEST_PART_NUMBER} has CAS ${actualCAS}, not ${TEST_CAS_NUMBER}`);
            console.log(`  Will search using actual CAS: ${actualCAS}`);
          } else {
            console.log(`✗ ERROR: Part ${TEST_PART_NUMBER} has NO CAS number in the database`);
            console.log(`  This is why it won't appear in similar products search!`);
          }
        }
      } else {
        console.log(`✗ Part number ${TEST_PART_NUMBER} NOT FOUND in Palantir database`);
        console.log(`  This part does not exist in the SAP data!`);
      }
    } catch (error) {
      console.error(`✗ Query failed: ${error.message}`);
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    console.log();

    // Test 2: Search for all products with the test CAS number
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log(`[Test 2] Searching for ALL products with CAS ${TEST_CAS_NUMBER}...`);
    console.log('───────────────────────────────────────────────────────────────────────────────');

    const casSearchQuery = `
      SELECT DISTINCT MATNR, TEXT_SHORT, YYD_CASNR
      FROM \`${config.datasetRID}\`
      WHERE YYD_CASNR = '${TEST_CAS_NUMBER}'
        AND MATNR IS NOT NULL
        AND MATNR != ''
      ORDER BY MATNR
      LIMIT 100
    `;

    console.log('Executing query:');
    console.log(casSearchQuery);
    console.log();

    try {
      const casResults = await palantirService.executeQuery(casSearchQuery);

      if (casResults && casResults.rows && casResults.rows.length > 0) {
        console.log(`✓ Found ${casResults.rows.length} product(s) with CAS ${TEST_CAS_NUMBER}:\n`);

        const uniquePrefixes = new Set();
        const skippedVariants = [];
        const invalidPrefixes = [];

        for (const row of casResults.rows) {
          const matnr = row.MATNR || '';
          const prefix = matnr.substring(0, 6);
          const digitCount = (prefix.match(/\d/g) || []).length;

          console.log(`  MATNR: ${matnr.padEnd(20)} | Name: ${(row.TEXT_SHORT || 'N/A').substring(0, 50)}`);

          // Check if this would pass the filter in the actual search
          if (digitCount < 6) {
            console.log(`    ⚠ SKIPPED: Prefix "${prefix}" has only ${digitCount} digits (need 6)`);
            invalidPrefixes.push({ matnr, prefix, digitCount });
          } else if (uniquePrefixes.has(prefix)) {
            console.log(`    ⚠ DUPLICATE: Variant of ${prefix} (already seen)`);
            skippedVariants.push({ matnr, prefix });
          } else {
            console.log(`    ✓ INCLUDED: Unique product with prefix ${prefix}`);
            uniquePrefixes.add(prefix);
          }
        }

        console.log();
        console.log(`Summary:`);
        console.log(`  Total raw results: ${casResults.rows.length}`);
        console.log(`  Unique products (first 6 digits): ${uniquePrefixes.size}`);
        console.log(`  Skipped variants: ${skippedVariants.length}`);
        console.log(`  Invalid prefixes: ${invalidPrefixes.length}`);

        // Check if the test part appears in results
        const testPartFound = casResults.rows.some(row =>
          row.MATNR && row.MATNR.startsWith(TEST_PART_NUMBER)
        );

        console.log();
        if (testPartFound) {
          console.log(`✓ Part ${TEST_PART_NUMBER} FOUND in similar products results!`);
        } else {
          console.log(`✗ Part ${TEST_PART_NUMBER} NOT FOUND in similar products results!`);
          console.log(`  Possible reasons:`);
          console.log(`    1. Part doesn't have CAS ${TEST_CAS_NUMBER} (check Test 1 results)`);
          console.log(`    2. Part has invalid prefix format (less than 6 digits)`);
          console.log(`    3. Part doesn't exist in SAP database`);
        }

        if (invalidPrefixes.length > 0) {
          console.log();
          console.log(`⚠ Products with invalid prefixes (excluded from search):`);
          invalidPrefixes.forEach(item => {
            console.log(`  ${item.matnr}: prefix "${item.prefix}" has ${item.digitCount} digit(s)`);
          });
        }

      } else {
        console.log(`✗ NO products found with CAS ${TEST_CAS_NUMBER}`);
        console.log(`  This means:`);
        console.log(`    1. No products in SAP have this CAS number, OR`);
        console.log(`    2. The CAS number format is incorrect, OR`);
        console.log(`    3. The CAS number field (YYD_CASNR) is empty for all products`);
      }
    } catch (error) {
      console.error(`✗ Query failed: ${error.message}`);
      if (error.response) {
        console.error(`  Status: ${error.response.status}`);
        console.error(`  Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
    console.log();

    // Test 3: Check CAS number field statistics
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log('[Test 3] Analyzing CAS number field statistics...');
    console.log('───────────────────────────────────────────────────────────────────────────────');

    const statsQuery = `
      SELECT
        COUNT(*) as total_products,
        COUNT(YYD_CASNR) as products_with_cas,
        COUNT(CASE WHEN YYD_CASNR IS NOT NULL AND YYD_CASNR != '' THEN 1 END) as products_with_nonempty_cas
      FROM \`${config.datasetRID}\`
      WHERE MATNR IS NOT NULL AND MATNR != ''
      LIMIT 1
    `;

    console.log('Executing query:');
    console.log(statsQuery);
    console.log();

    try {
      const statsResults = await palantirService.executeQuery(statsQuery);

      if (statsResults && statsResults.rows && statsResults.rows.length > 0) {
        const stats = statsResults.rows[0];
        console.log('Database statistics:');
        console.log(`  Total products: ${stats.total_products || 'N/A'}`);
        console.log(`  Products with CAS field: ${stats.products_with_cas || 'N/A'}`);
        console.log(`  Products with non-empty CAS: ${stats.products_with_nonempty_cas || 'N/A'}`);

        if (stats.total_products && stats.products_with_nonempty_cas) {
          const percentage = ((stats.products_with_nonempty_cas / stats.total_products) * 100).toFixed(2);
          console.log(`  Coverage: ${percentage}% of products have CAS numbers`);
        }
      }
    } catch (error) {
      console.error(`✗ Stats query failed: ${error.message}`);
    }
    console.log();

    // Test 4: Sample some products with CAS numbers
    console.log('───────────────────────────────────────────────────────────────────────────────');
    console.log('[Test 4] Sampling products with CAS numbers...');
    console.log('───────────────────────────────────────────────────────────────────────────────');

    const sampleQuery = `
      SELECT MATNR, TEXT_SHORT, YYD_CASNR
      FROM \`${config.datasetRID}\`
      WHERE YYD_CASNR IS NOT NULL
        AND YYD_CASNR != ''
        AND MATNR IS NOT NULL
        AND MATNR != ''
      ORDER BY MATNR
      LIMIT 5
    `;

    console.log('Executing query:');
    console.log(sampleQuery);
    console.log();

    try {
      const sampleResults = await palantirService.executeQuery(sampleQuery);

      if (sampleResults && sampleResults.rows && sampleResults.rows.length > 0) {
        console.log('Sample products with CAS numbers:');
        sampleResults.rows.forEach(row => {
          console.log(`  ${row.MATNR}: CAS ${row.YYD_CASNR} - ${row.TEXT_SHORT || 'N/A'}`);
        });
      } else {
        console.log('✗ No products with CAS numbers found');
      }
    } catch (error) {
      console.error(`✗ Sample query failed: ${error.message}`);
    }
    console.log();

    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('  DIAGNOSTICS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n✗ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
