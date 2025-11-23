/**
 * Script: Assign tickets to a user
 *
 * This script assigns all tickets with createdBy: null to a specific user email.
 *
 * Usage: node scripts/assignTicketsToUser.js <user-email>
 * Example: node scripts/assignTicketsToUser.js john.doe@example.com
 */

const mongoose = require('mongoose');
require('dotenv').config();

const ProductTicket = require('../models/ProductTicket');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-portal';

async function assignTicketsToUser(userEmail) {
  if (!userEmail) {
    console.error('❌ Error: Please provide a user email address');
    console.log('Usage: node scripts/assignTicketsToUser.js <user-email>');
    console.log('Example: node scripts/assignTicketsToUser.js john.doe@example.com');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log(`Assigning tickets to user: ${userEmail}\n`);

    // Find all tickets with createdBy: null
    const tickets = await ProductTicket.find({
      $or: [
        { createdBy: null },
        { createdBy: { $exists: false } },
        { createdBy: '' }
      ]
    }).sort({ createdAt: -1 });

    if (tickets.length === 0) {
      console.log('✓ No tickets found with null createdBy field');
      return;
    }

    console.log(`Found ${tickets.length} tickets with null createdBy:\n`);

    // Display tickets
    tickets.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticketNumber || ticket._id}`);
      console.log(`   Product: ${ticket.productName || 'Untitled'}`);
      console.log(`   CAS: ${ticket.chemicalProperties?.casNumber || 'N/A'}`);
      console.log(`   Status: ${ticket.status}`);
      console.log(`   Created: ${ticket.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Confirm with user (in real implementation, you'd add a readline prompt)
    console.log(`\nAssigning all ${tickets.length} tickets to: ${userEmail}`);

    // Update all tickets
    const result = await ProductTicket.updateMany(
      {
        $or: [
          { createdBy: null },
          { createdBy: { $exists: false } },
          { createdBy: '' }
        ]
      },
      { $set: { createdBy: userEmail } }
    );

    console.log(`\n✓ Successfully updated ${result.modifiedCount} tickets`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Get user email from command line argument
const userEmail = process.argv[2];
assignTicketsToUser(userEmail);
