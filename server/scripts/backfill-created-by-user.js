/**
 * Migration script to backfill createdByUser field for existing tickets
 *
 * This script finds all tickets where:
 * - createdBy (email) is set
 * - createdByUser (ObjectId reference) is NOT set
 *
 * And attempts to populate createdByUser by looking up the User model
 * based on the email address in createdBy.
 *
 * Usage: node server/scripts/backfill-created-by-user.js
 */

const mongoose = require('mongoose');
const ProductTicket = require('../models/ProductTicket');
const User = require('../models/User');
require('dotenv').config();

async function backfillCreatedByUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all tickets where createdByUser is not set but createdBy is set
    const ticketsToUpdate = await ProductTicket.find({
      createdBy: { $exists: true, $ne: null, $ne: '' },
      $or: [
        { createdByUser: { $exists: false } },
        { createdByUser: null }
      ]
    });

    console.log(`Found ${ticketsToUpdate.length} tickets to update`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // Process each ticket
    for (const ticket of ticketsToUpdate) {
      try {
        // Look up the user by email
        const user = await User.findOne({ email: ticket.createdBy });

        if (user) {
          // Update the ticket with the user ObjectId
          ticket.createdByUser = user._id;
          await ticket.save();
          successCount++;
          console.log(`✓ Updated ticket ${ticket.ticketNumber} - linked to ${user.firstName} ${user.lastName}`);
        } else {
          notFoundCount++;
          console.log(`⚠ No user found for email: ${ticket.createdBy} (ticket ${ticket.ticketNumber})`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error updating ticket ${ticket.ticketNumber}:`, error.message);
      }
    }

    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log(`Total tickets processed: ${ticketsToUpdate.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`User not found: ${notFoundCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================\n');

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
backfillCreatedByUser();
