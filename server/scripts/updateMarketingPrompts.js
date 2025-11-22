require('dotenv').config();
const mongoose = require('mongoose');
const SystemSettings = require('../models/SystemSettings');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/npdi-app');
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateMarketingPrompts = async () => {
  try {
    await connectDB();

    const settings = await SystemSettings.getSettings();

    console.log('Current Product Description Prompt:');
    console.log(settings.aiPrompts?.productDescription?.prompt?.substring(0, 150) + '...\n');

    // Update product description prompt to be marketing-focused
    settings.aiPrompts.productDescription.prompt = 'You are a marketing content writer for MilliporeSigma. Write a compelling, marketing-focused product description for {productName} that sells the product to research scientists. FOCUS ON: 1) Primary research applications and what researchers can achieve with this product, 2) Quality and reliability messaging (high purity, rigorous testing, consistent results), 3) Availability and convenience (multiple package sizes available, ready to ship, flexible ordering), 4) Benefits to the researcher (accelerate research, reliable results, trusted worldwide). AVOID: Technical specifications, CAS numbers, molecular formulas, physical properties - these belong in specification sections. TONE: Professional yet engaging, benefit-focused, confident. Think marketing copy, not technical datasheet. Use active voice and compelling language. Maximum {maxWords} words. IMPORTANT: Format as HTML with <p> for paragraphs, <strong> for key selling points, and <ul><li> for benefit lists. Return ONLY the HTML content.';

    await settings.save();

    console.log('✓ Product Description Prompt updated to marketing-focused style');
    console.log('\nNew Prompt Focus:');
    console.log('  ✓ Applications and benefits (what researchers can achieve)');
    console.log('  ✓ Quality and reliability messaging');
    console.log('  ✓ Availability and convenience (packaging, delivery)');
    console.log('  ✓ Marketing tone, not technical datasheet');
    console.log('  ✗ NO technical specs (CAS, formula, properties)');
    console.log('\nExample Output Style:');
    console.log('  "Delivers high purity and consistent performance..."');
    console.log('  "Ideal for life science research applications..."');
    console.log('  "Available in multiple package sizes..."');

    process.exit(0);
  } catch (error) {
    console.error('Error updating marketing prompts:', error);
    process.exit(1);
  }
};

updateMarketingPrompts();
