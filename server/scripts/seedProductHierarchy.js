// Script to seed the product hierarchy from the LS Product Hierarchy CSV
// Run with: node server/scripts/seedProductHierarchy.js

const mongoose = require('mongoose');
const ProductHierarchy = require('../models/ProductHierarchy');
const ProductHierarchyParser = require('../services/productHierarchyParser');
const path = require('path');
require('dotenv').config();

async function seedProductHierarchy() {
  try {
    console.log('Starting Product Hierarchy seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Path to the CSV file
    const csvPath = path.join(__dirname, '../../LS Product Hierarchy.csv');
    console.log(`Reading CSV from: ${csvPath}\n`);

    // Parse the CSV file
    console.log('Parsing CSV file...');
    const parser = new ProductHierarchyParser();
    const hierarchyData = await parser.parseCSV(csvPath);

    console.log(`✓ Parsed ${hierarchyData.stats.totalRecords.toLocaleString()} records`);
    console.log(`✓ Found ${hierarchyData.stats.divisionsCount} divisions\n`);

    // Check if hierarchy already exists
    const existingHierarchy = await ProductHierarchy.getActive();
    if (existingHierarchy) {
      console.log('⚠ Active hierarchy already exists');
      console.log(`  Current version: v${existingHierarchy.metadata.version}`);
      console.log(`  Records: ${existingHierarchy.stats.totalRecords.toLocaleString()}`);
      console.log(`  Last updated: ${new Date(existingHierarchy.metadata.generatedAt).toLocaleString()}\n`);

      // Ask for confirmation (in a real scenario)
      console.log('Creating new version and deactivating old one...\n');
    }

    // Create new version
    const newHierarchy = await ProductHierarchy.createNewVersion(hierarchyData, null);

    console.log('✓ Successfully created product hierarchy!');
    console.log(`  Version: v${newHierarchy.metadata.version}`);
    console.log(`  Total records: ${newHierarchy.stats.totalRecords.toLocaleString()}`);
    console.log(`  Divisions: ${newHierarchy.stats.divisionsCount}`);
    console.log(`  Generated at: ${new Date(newHierarchy.metadata.generatedAt).toLocaleString()}\n`);

    // Display some sample data
    console.log('Sample divisions:');
    const divisions = Object.values(hierarchyData.divisions);
    divisions.slice(0, 3).forEach(div => {
      console.log(`  - ${div.code}: ${div.title}`);
    });

  } catch (error) {
    console.error('Error seeding product hierarchy:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedProductHierarchy()
    .then(() => {
      console.log('\n✓ Product hierarchy seeding completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n✗ Product hierarchy seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedProductHierarchy };
