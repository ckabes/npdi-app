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

const updateAIPrompts = async () => {
  try {
    await connectDB();

    // Get existing settings
    const settings = await SystemSettings.getSettings();

    console.log('Current AI Prompts:');
    console.log('  - Product Description:', settings.aiPrompts?.productDescription?.prompt?.substring(0, 100) + '...');
    console.log('  - Key Features:', settings.aiPrompts?.keyFeatures?.prompt?.substring(0, 100) + '...');
    console.log('  - Applications:', settings.aiPrompts?.applications?.prompt?.substring(0, 100) + '...');

    // Update prompts with HTML formatting instructions
    settings.aiPrompts.productDescription.prompt = 'You are a technical content writer for MilliporeSigma, a leading life science company. Generate a professional, informative product description for {productName} (CAS: {casNumber}, Formula: {molecularFormula}). Include: brief introduction of the compound, key chemical properties and characteristics, primary applications in research/industry, quality and purity highlights, and mention of available package sizes. Tone: Professional, scientific, but accessible. Target audience: Research scientists and laboratory professionals. Maximum {maxWords} words. IMPORTANT: Format the output as HTML with proper tags. Use <p> for paragraphs, <strong> for emphasis, and <ul><li> for lists where appropriate. Return ONLY the HTML content, no additional text or markdown.';

    settings.aiPrompts.websiteTitle.prompt = 'Create an SEO-optimized webpage title for {productName}. Include the product name and "MilliporeSigma" brand. Keep it under {maxChars} characters. Make it compelling for search engines while remaining accurate. Return ONLY plain text, no HTML or markdown.';

    settings.aiPrompts.metaDescription.prompt = 'Write a compelling meta description for {productName} (CAS: {casNumber}). Highlight key benefits: high purity, research quality, multiple sizes. Target researchers searching for this chemical. Maximum {maxChars} characters. Return ONLY plain text, no HTML or markdown.';

    settings.aiPrompts.keyFeatures.prompt = 'Generate {bulletCount} concise bullet points highlighting key features and benefits of {productName} for MilliporeSigma\'s product page. Focus on: quality/purity specifications, packaging and availability, application suitability, reliability and support. Format as bullet points, {wordsPerBullet} words each maximum. IMPORTANT: Format as HTML using <ul><li> tags. Return ONLY the HTML <ul> list with <li> items, no additional text or markdown.';

    settings.aiPrompts.applications.prompt = 'List {itemCount} specific research or industrial applications for {productName} (Formula: {molecularFormula}). Be specific about the scientific fields or processes. IMPORTANT: Format as HTML using <ul><li> tags. Return ONLY the HTML <ul> list with <li> items, no additional text or markdown.';

    settings.aiPrompts.targetIndustries.prompt = 'Identify {itemCount} primary industries or research sectors that would use {productName} (CAS: {casNumber}). Examples: Pharmaceutical R&D, Biotechnology, Academic Research, Chemical Manufacturing, etc. Return as comma-separated text only, no additional explanation.';

    // Save updated settings
    await settings.save();

    console.log('\n✓ AI Prompts updated successfully with HTML formatting instructions');
    console.log('\nUpdated Prompts:');
    console.log('  - Product Description: HTML formatting enabled');
    console.log('  - Website Title: Plain text (no HTML)');
    console.log('  - Meta Description: Plain text (no HTML)');
    console.log('  - Key Features: HTML <ul><li> formatting');
    console.log('  - Applications: HTML <ul><li> formatting');
    console.log('  - Target Industries: Plain text (comma-separated)');

    process.exit(0);
  } catch (error) {
    console.error('Error updating AI prompts:', error);
    process.exit(1);
  }
};

updateAIPrompts();
