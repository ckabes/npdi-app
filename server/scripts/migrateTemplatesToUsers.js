require('dotenv').config();
const mongoose = require('mongoose');
const TicketTemplate = require('../models/TicketTemplate');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

/**
 * Migration Script: Move template assignments from TicketTemplate.assignedUsers to User.ticketTemplate
 *
 * This script:
 * 1. Reads existing TicketTemplate documents with assignedUsers arrays
 * 2. For each user email in assignedUsers, updates the User document with ticketTemplate reference
 * 3. Also reads devProfiles.json to ensure all profiles have User documents created
 * 4. Reports migration results
 */

const migrateTemplates = async () => {
  try {
    console.log('🚀 Starting template assignment migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app');
    console.log('✅ Connected to MongoDB\n');

    let migratedCount = 0;
    let skippedCount = 0;
    let createdUserCount = 0;
    const errors = [];

    // Step 1: Read devProfiles.json to get all user profiles
    console.log('📋 Step 1: Reading devProfiles.json...');
    const profilesPath = path.join(__dirname, '../data/devProfiles.json');
    let profiles = [];

    try {
      const profilesData = fs.readFileSync(profilesPath, 'utf8');
      profiles = JSON.parse(profilesData);
      console.log(`   Found ${profiles.length} profiles in devProfiles.json\n`);
    } catch (error) {
      console.warn('⚠️  Could not read devProfiles.json:', error.message);
      console.log('   Continuing with template migration only...\n');
    }

    // Step 2: Ensure User documents exist for all profiles
    console.log('👥 Step 2: Ensuring User documents exist for all profiles...');
    for (const profile of profiles) {
      try {
        const existingUser = await User.findOne({ email: profile.email });
        if (!existingUser) {
          await User.create({
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role,
            sbu: profile.sbu,
            isActive: profile.isActive !== undefined ? profile.isActive : true,
            ticketTemplate: null  // Will be set in step 3
          });
          createdUserCount++;
          console.log(`   ✅ Created User document for: ${profile.email}`);
        }
      } catch (error) {
        console.error(`   ❌ Error creating User for ${profile.email}:`, error.message);
        errors.push({ email: profile.email, error: error.message });
      }
    }
    console.log(`   Created ${createdUserCount} new User documents\n`);

    // Step 3: Migrate template assignments from TicketTemplate.assignedUsers
    console.log('🔄 Step 3: Migrating template assignments from TicketTemplate.assignedUsers...');
    const templates = await TicketTemplate.find();
    console.log(`   Found ${templates.length} templates\n`);

    for (const template of templates) {
      if (!template.assignedUsers || template.assignedUsers.length === 0) {
        console.log(`   ⏭️  Template "${template.name}" has no assigned users, skipping`);
        continue;
      }

      console.log(`\n   📌 Processing template: "${template.name}" (${template._id})`);
      console.log(`      Assigned users: ${template.assignedUsers.length}`);

      for (const email of template.assignedUsers) {
        try {
          const user = await User.findOne({ email });

          if (!user) {
            console.log(`      ⚠️  User not found: ${email} - skipping`);
            skippedCount++;
            continue;
          }

          // Update user's ticketTemplate
          user.ticketTemplate = template._id;
          await user.save();

          console.log(`      ✅ Assigned template to: ${email}`);
          migratedCount++;

        } catch (error) {
          console.error(`      ❌ Error assigning template to ${email}:`, error.message);
          errors.push({ email, templateId: template._id, error: error.message });
        }
      }
    }

    // Step 4: Assign default template to profiles with templateId but no User.ticketTemplate
    console.log('\n🎯 Step 4: Syncing templates from devProfiles.json templateId...');
    let syncedFromProfiles = 0;

    for (const profile of profiles) {
      if (profile.templateId && (profile.role === 'PRODUCT_MANAGER' || profile.role === 'ADMIN')) {
        try {
          const user = await User.findOne({ email: profile.email });
          if (user && !user.ticketTemplate) {
            user.ticketTemplate = profile.templateId;
            await user.save();
            console.log(`   ✅ Synced template from profile: ${profile.email} -> ${profile.templateId}`);
            syncedFromProfiles++;
          }
        } catch (error) {
          console.error(`   ❌ Error syncing template for ${profile.email}:`, error.message);
          errors.push({ email: profile.email, error: error.message });
        }
      }
    }
    console.log(`   Synced ${syncedFromProfiles} templates from profiles\n`);

    // Summary Report
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ User documents created:        ${createdUserCount}`);
    console.log(`✅ Templates migrated:            ${migratedCount}`);
    console.log(`✅ Templates synced from profiles: ${syncedFromProfiles}`);
    console.log(`⚠️  Users skipped (not found):    ${skippedCount}`);
    console.log(`❌ Errors encountered:            ${errors.length}`);
    console.log('='.repeat(60));

    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.email}: ${err.error}`);
      });
    }

    // Verification
    console.log('\n🔍 Verification:');
    const usersWithTemplates = await User.countDocuments({ ticketTemplate: { $ne: null } });
    console.log(`   Users with assigned templates: ${usersWithTemplates}`);

    const allUsers = await User.find({ ticketTemplate: { $ne: null } }).select('email ticketTemplate');
    if (allUsers.length > 0) {
      console.log('\n   Template assignments:');
      for (const user of allUsers) {
        const template = await TicketTemplate.findById(user.ticketTemplate);
        console.log(`   - ${user.email} → ${template ? template.name : 'TEMPLATE NOT FOUND'}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test template assignment in Admin UI');
    console.log('   2. Test Create Ticket page template loading');
    console.log('   3. If all tests pass, remove assignedUsers field from TicketTemplate model');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run migration
migrateTemplates();
