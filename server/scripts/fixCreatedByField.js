/**
 * Migration Script: Fix createdBy field for existing tickets
 *
 * This script updates all tickets with createdBy: null to extract the creator's
 * email from the status history (TICKET_CREATED action).
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ProductTicket = require('../models/ProductTicket');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-portal';

async function fixCreatedByField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all tickets with createdBy: null or missing
    const tickets = await ProductTicket.find({
      $or: [
        { createdBy: null },
        { createdBy: { $exists: false } },
        { createdBy: '' }
      ]
    });

    console.log(`Found ${tickets.length} tickets with null/missing createdBy field`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const ticket of tickets) {
      // Try to extract email from status history
      const creationEvent = ticket.statusHistory?.find(
        event => event.action === 'TICKET_CREATED'
      );

      let creatorEmail = null;

      if (creationEvent && creationEvent.userInfo && creationEvent.userInfo.email) {
        // Extract email from userInfo
        creatorEmail = creationEvent.userInfo.email;
      } else if (creationEvent && creationEvent.reason) {
        // Try to extract email from reason string
        const emailMatch = creationEvent.reason.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
        if (emailMatch) {
          creatorEmail = emailMatch[0];
        }
      }

      if (creatorEmail) {
        // Update the ticket
        ticket.createdBy = creatorEmail;
        await ticket.save();
        updatedCount++;
        console.log(`✓ Updated ticket ${ticket.ticketNumber || ticket._id} with creator: ${creatorEmail}`);
      } else {
        skippedCount++;
        console.log(`⚠ Skipped ticket ${ticket.ticketNumber || ticket._id} - unable to determine creator`);
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Total tickets processed: ${tickets.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped (no email found): ${skippedCount}`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
fixCreatedByField();
