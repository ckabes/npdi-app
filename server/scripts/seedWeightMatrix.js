const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const WeightMatrix = require('../models/WeightMatrix');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app';

/**
 * Parse size string and extract numeric value and unit
 * Examples: "100G" -> {value: 100, unit: "G"}, "1.5L" -> {value: 1.5, unit: "L"}
 */
function parseSize(sizeStr) {
  if (!sizeStr || sizeStr.trim() === '') return null;

  // Match pattern: number (with optional decimal) followed by unit letters
  const match = sizeStr.match(/^(\d+\.?\d*)([A-Z]+)$/i);
  if (!match) return null;

  return {
    value: parseFloat(match[1]),
    unit: match[2].toUpperCase()
  };
}

/**
 * Convert weight to grams for normalized comparison
 */
function convertToGrams(value, unit) {
  const conversions = {
    'UG': 0.000001,
    'MG': 0.001,
    'G': 1,
    'KG': 1000
  };

  return value * (conversions[unit] || 1);
}

/**
 * Convert various units to a standard unit for size comparison
 * Supports: G, KG, MG, ML, L, EA, UN, etc.
 */
function normalizeSizeValue(value, unit) {
  // Weight conversions to grams
  const weightConversions = {
    'UG': 0.000001,
    'MG': 0.001,
    'G': 1,
    'KG': 1000
  };

  // Volume conversions to mL
  const volumeConversions = {
    'ML': 1,
    'L': 1000,
    'UL': 0.001
  };

  // If it's a weight unit, convert to grams
  if (weightConversions[unit]) {
    return {
      value: value * weightConversions[unit],
      unit: 'G'
    };
  }

  // If it's a volume unit, convert to mL
  if (volumeConversions[unit]) {
    return {
      value: value * volumeConversions[unit],
      unit: 'ML'
    };
  }

  // For other units (EA, UN, etc.), keep as-is
  return { value, unit };
}

/**
 * Seed weight matrix data from CSV file
 */
async function seedWeightMatrix() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../Weight_Matrix_CSV.csv');
    console.log(`📄 Reading CSV file: ${csvPath}`);

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');

    console.log(`📊 Found ${lines.length - 1} data rows (excluding header)`);

    // Clear existing data
    console.log('🗑️  Clearing existing weight matrix data...');
    await WeightMatrix.deleteMany({});
    console.log('✅ Cleared existing data');

    // Parse and insert data
    const entries = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {  // Skip header row
      const line = lines[i];
      const columns = line.split(',');

      if (columns.length < 3) {
        skipped++;
        continue;
      }

      const size = columns[0].trim().replace(/^\uFEFF/, ''); // Remove BOM if present
      const grossWeight = parseFloat(columns[1]);
      const weightUnit = columns[2].trim().toUpperCase();

      // Skip invalid rows
      if (!size || isNaN(grossWeight) || !weightUnit) {
        skipped++;
        continue;
      }

      // Parse size to get normalized values
      const parsedSize = parseSize(size);
      const normalizedSize = parsedSize ? normalizeSizeValue(parsedSize.value, parsedSize.unit) : null;

      // Normalize gross weight to grams
      const normalizedGrossWeight = {
        value: convertToGrams(grossWeight, weightUnit),
        unit: 'G'
      };

      entries.push({
        size,
        grossWeight,
        weightUnit,
        normalizedSize,
        normalizedGrossWeight,
        createdBy: 'system'
      });
    }

    console.log(`💾 Inserting ${entries.length} weight matrix entries...`);
    await WeightMatrix.insertMany(entries);

    console.log('✅ Weight matrix seeding completed!');
    console.log(`   - Total entries: ${entries.length}`);
    console.log(`   - Skipped rows: ${skipped}`);

    // Display sample entries
    console.log('\n📋 Sample entries:');
    const samples = await WeightMatrix.find().limit(5);
    samples.forEach(entry => {
      console.log(`   ${entry.size} -> ${entry.grossWeight} ${entry.weightUnit} (normalized: ${entry.normalizedGrossWeight?.value.toFixed(2)}g)`);
    });

  } catch (error) {
    console.error('❌ Error seeding weight matrix:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seed function
seedWeightMatrix();
