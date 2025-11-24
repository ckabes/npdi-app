/**
 * Migration: Add SAP Project fields to ProductTicket model
 * Adds fields to link ProductTickets to SAP Project System projects
 *
 * Run with: node migrations/add-sap-project-fields.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('MIGRATION: Add SAP Project Fields to ProductTicket');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('productticketes');

    // Check current documents
    const totalDocs = await collection.countDocuments();
    console.log(`Found ${totalDocs} ProductTicket documents\n`);

    // Add SAP project fields to all documents that don't have them
    const updateOperation = {
      $set: {
        'sapProject.projectId': null,
        'sapProject.wbsElement': null,
        'sapProject.projectName': null,
        'sapProject.systemStatus': null,
        'sapProject.systemStatusText': null,
        'sapProject.userStatus': null,
        'sapProject.responsible': null,
        'sapProject.startDate': null,
        'sapProject.endDate': null,
        'sapProject.lastSyncDate': null,
        'sapProject.sapUrl': null,
        'sapProject.autoSync': false,
        // SAP RPM specific fields
        'sapProject.objectGuid': null,
        'sapProject.parentGuid': null,
        'sapProject.portfolioGuid': null,
        'sapProject.applicationType': 'RPM'
      }
    };

    console.log('Adding SAP project fields to documents...');

    const result = await collection.updateMany(
      { 'sapProject': { $exists: false } }, // Only update documents that don't have sapProject
      updateOperation
    );

    console.log(`\n✓ Migration complete!`);
    console.log(`  Matched: ${result.matchedCount} documents`);
    console.log(`  Modified: ${result.modifiedCount} documents`);

    if (result.modifiedCount > 0) {
      console.log('\n📋 Sample document after migration:');
      const sampleDoc = await collection.findOne({ 'sapProject': { $exists: true } });
      console.log(JSON.stringify({
        ticketNumber: sampleDoc.ticketNumber,
        sapProject: sampleDoc.sapProject
      }, null, 2));
    }

    console.log('\n✅ Migration successful!');
    console.log('\nNext steps:');
    console.log('1. Update ProductTicket.js model to include sapProject schema');
    console.log('2. Restart application');
    console.log('3. Test SAP project linking in UI\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('═══════════════════════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
