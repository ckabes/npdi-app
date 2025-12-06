require('dotenv').config();
const mongoose = require('mongoose');
const TicketTemplate = require('../models/TicketTemplate');
const FormConfiguration = require('../models/FormConfiguration');

/**
 * Utility script to sync TicketTemplate names with their FormConfiguration names
 * This ensures template names always match their form configuration version
 * 
 * Run: node server/scripts/syncTemplateNames.js
 */

const syncTemplateNames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app');
    console.log('✅ Connected to MongoDB');

    // Get all templates
    const templates = await TicketTemplate.find().populate('formConfiguration');
    
    console.log(`\n📋 Found ${templates.length} template(s)\n`);

    let updatedCount = 0;

    for (const template of templates) {
      if (!template.formConfiguration) {
        console.log(`⚠️  Template "${template.name}" has no form configuration - skipping`);
        continue;
      }

      const formConfigName = template.formConfiguration.name;
      
      if (template.name !== formConfigName) {
        console.log(`🔄 Updating template name:`);
        console.log(`   From: "${template.name}"`);
        console.log(`   To:   "${formConfigName}"`);
        
        template.name = formConfigName;
        template.updatedBy = 'sync-script';
        template.updatedAt = new Date();
        await template.save();
        
        updatedCount++;
      } else {
        console.log(`✅ Template "${template.name}" already in sync`);
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Summary:`);
    console.log(`   Total templates: ${templates.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already in sync: ${templates.length - updatedCount}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  syncTemplateNames();
}

module.exports = syncTemplateNames;
