require('dotenv').config();
const mongoose = require('mongoose');
const TicketTemplate = require('../models/TicketTemplate');
const FormConfiguration = require('../models/FormConfiguration');

const seedDefaultTemplate = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app');
    console.log('Connected to MongoDB');

    // Check if default template already exists
    const existingDefault = await TicketTemplate.findOne({ isDefault: true });
    if (existingDefault) {
      console.log('\n✅ Default template already exists:', existingDefault.name);
      console.log('Template ID:', existingDefault._id);
      console.log('Form Configuration ID:', existingDefault.formConfiguration);

      // Verify the form configuration exists and has the right templateName
      const formConfig = await FormConfiguration.findById(existingDefault.formConfiguration);
      if (formConfig) {
        console.log('Form Configuration Name:', formConfig.name);
        console.log('Form Configuration Version:', formConfig.version);
        console.log('Template Name:', formConfig.templateName);

        // Update templateName if needed
        if (formConfig.templateName !== 'Default') {
          formConfig.templateName = 'Default';
          await formConfig.save();
          console.log('Updated form configuration templateName to "Default"');
        }
      }

      // Check if we need to assign users to the default template
      const fs = require('fs');
      const path = require('path');
      const profilesPath = path.join(__dirname, '../data/devProfiles.json');

      try {
        const profilesData = fs.readFileSync(profilesPath, 'utf8');
        const profiles = JSON.parse(profilesData);

        // Get all Product Manager and Admin users
        const shouldBeAssigned = profiles
          .filter(profile => profile.role === 'PRODUCT_MANAGER' || profile.role === 'ADMIN')
          .map(profile => profile.email);

        // Check if they're already assigned
        const currentlyAssigned = existingDefault.assignedUsers || [];
        const needsUpdate = shouldBeAssigned.some(email => !currentlyAssigned.includes(email));

        if (needsUpdate) {
          existingDefault.assignedUsers = [...new Set([...currentlyAssigned, ...shouldBeAssigned])];
          await existingDefault.save();
          console.log('Updated assigned users:', existingDefault.assignedUsers.join(', '));
        } else {
          console.log('Assigned Users:', currentlyAssigned.join(', ') || 'None');
        }
      } catch (error) {
        console.warn('Could not update user assignments:', error.message);
      }

      await mongoose.connection.close();
      return;
    }

    console.log('\n📋 Creating default template...');

    // Get or create the default form configuration
    let formConfig = await FormConfiguration.findOne({ templateName: 'Default' });

    if (!formConfig) {
      console.log('No form configuration found with templateName "Default"');
      console.log('Looking for any existing form configuration...');

      // Get the first available form configuration (should be the one seeded by the system)
      formConfig = await FormConfiguration.findOne();

      if (!formConfig) {
        console.error('❌ No form configuration found. Please ensure the form configuration is seeded first.');
        console.error('Run: npm run seed (or your seed script) to create the base form configuration');
        await mongoose.connection.close();
        process.exit(1);
      }

      console.log('Found existing form configuration:', formConfig.name);

      // Update it to be the Default template
      formConfig.templateName = 'Default';
      formConfig.name = formConfig.name || 'Product Ticket Form';
      formConfig.description = formConfig.description || 'Default form configuration for product tickets';
      await formConfig.save();
      console.log('✅ Updated form configuration to be "Default" template');
    }

    // Get Product Manager emails from devProfiles to assign to default template
    const fs = require('fs');
    const path = require('path');
    const profilesPath = path.join(__dirname, '../data/devProfiles.json');
    let assignedUsers = [];

    try {
      const profilesData = fs.readFileSync(profilesPath, 'utf8');
      const profiles = JSON.parse(profilesData);

      // Get all Product Manager and Admin users (exclude PM_OPS)
      assignedUsers = profiles
        .filter(profile => profile.role === 'PRODUCT_MANAGER' || profile.role === 'ADMIN')
        .map(profile => profile.email);

      console.log('Found users to assign to Default template:', assignedUsers);
    } catch (error) {
      console.warn('Could not read devProfiles.json, continuing without user assignment');
    }

    // Create the default ticket template
    const defaultTemplate = new TicketTemplate({
      name: 'Default',
      description: 'Default ticket template for all Product Managers',
      formConfiguration: formConfig._id,
      isDefault: true,
      isActive: true,
      assignedUsers: assignedUsers, // Assign Product Managers and Admins by default
      createdBy: 'system',
      updatedBy: 'system'
    });

    await defaultTemplate.save();
    console.log('\n✅ Default template created successfully!');
    console.log('Template ID:', defaultTemplate._id);
    console.log('Template Name:', defaultTemplate.name);
    console.log('Assigned Users:', defaultTemplate.assignedUsers.join(', ') || 'None');
    console.log('Form Configuration ID:', formConfig._id);
    console.log('Form Configuration Name:', formConfig.name);
    console.log('Form Configuration Version:', formConfig.version);
    console.log('Sections:', formConfig.sections?.length || 0);
    console.log('Total Fields:', formConfig.metadata?.totalFields || 0);

    console.log('\n📝 Next steps:');
    console.log('1. Visit Admin Dashboard > Templates & Forms');
    console.log('2. Click "Edit Form" on the Default template to customize it');
    console.log('3. Create additional templates and assign them to users');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding default template:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDefaultTemplate();
