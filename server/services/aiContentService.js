const langdockService = require('./langdockService');
const SystemSettings = require('../models/SystemSettings');

/**
 * AIContentService - Generate CorpBase website content using AI
 * Orchestrates AI generation for product descriptions, titles, meta descriptions, etc.
 */
class AIContentService {
  constructor() {
    this.settings = null;
  }

  /**
   * Load AI prompt settings from database
   */
  async loadSettings() {
    this.settings = await SystemSettings.getSettings();
    return this.settings;
  }

  /**
   * Replace template variables in prompt with actual values
   * @param {string} template - Prompt template with {variables}
   * @param {object} data - Product data to substitute
   * @returns {string} - Processed prompt
   */
  replacePromptVariables(template, data) {
    let processed = template;

    // Replace all template variables
    const replacements = {
      productName: data.productName || 'this product',
      casNumber: data.casNumber || 'N/A',
      molecularFormula: data.molecularFormula || 'N/A',
      molecularWeight: data.molecularWeight || 'N/A',
      iupacName: data.iupacName || '',
      sbu: data.sbu || 'Life Science',
      maxWords: data.maxWords || 200,
      maxChars: data.maxChars || 160,
      bulletCount: data.bulletCount || 5,
      wordsPerBullet: data.wordsPerBullet || 10,
      itemCount: data.itemCount || 4
    };

    // Replace each variable
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, replacements[key]);
    });

    return processed;
  }

  /**
   * Generate product description using AI
   */
  async generateProductDescription(productData) {
    const settings = await this.loadSettings();
    const config = settings.aiPrompts?.productDescription;

    if (!config?.enabled) {
      throw new Error('Product description generation is disabled');
    }

    const prompt = this.replacePromptVariables(config.prompt, {
      ...productData,
      maxWords: config.maxWords
    });

    const content = await langdockService.generateCompletion(prompt, {
      temperature: config.temperature,
      maxTokens: Math.ceil(config.maxWords * 1.5) // Approximate tokens
    });

    return content;
  }

  /**
   * Generate website title using AI
   */
  async generateWebsiteTitle(productData) {
    const settings = await this.loadSettings();
    const config = settings.aiPrompts?.websiteTitle;

    if (!config?.enabled) {
      throw new Error('Website title generation is disabled');
    }

    const prompt = this.replacePromptVariables(config.prompt, {
      ...productData,
      maxChars: config.maxChars
    });

    const content = await langdockService.generateCompletion(prompt, {
      temperature: config.temperature,
      maxTokens: 50
    });

    // Ensure it's under the character limit
    return content.substring(0, config.maxChars);
  }

  /**
   * Generate meta description using AI
   */
  async generateMetaDescription(productData) {
    const settings = await this.loadSettings();
    const config = settings.aiPrompts?.metaDescription;

    if (!config?.enabled) {
      throw new Error('Meta description generation is disabled');
    }

    const prompt = this.replacePromptVariables(config.prompt, {
      ...productData,
      maxChars: config.maxChars
    });

    const content = await langdockService.generateCompletion(prompt, {
      temperature: config.temperature,
      maxTokens: 100
    });

    // Ensure it's under the character limit
    return content.substring(0, config.maxChars);
  }

  /**
   * Generate key features using AI
   */
  async generateKeyFeatures(productData) {
    const settings = await this.loadSettings();
    const config = settings.aiPrompts?.keyFeatures;

    if (!config?.enabled) {
      throw new Error('Key features generation is disabled');
    }

    const prompt = this.replacePromptVariables(config.prompt, {
      ...productData,
      bulletCount: config.bulletCount,
      wordsPerBullet: config.wordsPerBullet
    });

    const content = await langdockService.generateCompletion(prompt, {
      temperature: config.temperature,
      maxTokens: config.bulletCount * config.wordsPerBullet * 2
    });

    return content;
  }

  /**
   * Generate applications using AI
   */
  async generateApplications(productData) {
    const settings = await this.loadSettings();
    const config = settings.aiPrompts?.applications;

    if (!config?.enabled) {
      throw new Error('Applications generation is disabled');
    }

    const prompt = this.replacePromptVariables(config.prompt, {
      ...productData,
      itemCount: config.itemCount
    });

    const content = await langdockService.generateCompletion(prompt, {
      temperature: config.temperature,
      maxTokens: config.itemCount * 20
    });

    return content;
  }

  /**
   * Generate target industries using AI
   */
  async generateTargetIndustries(productData) {
    const settings = await this.loadSettings();
    const config = settings.aiPrompts?.targetIndustries;

    if (!config?.enabled) {
      throw new Error('Target industries generation is disabled');
    }

    const prompt = this.replacePromptVariables(config.prompt, {
      ...productData,
      itemCount: config.itemCount
    });

    const content = await langdockService.generateCompletion(prompt, {
      temperature: config.temperature,
      maxTokens: config.itemCount * 10
    });

    return content;
  }

  /**
   * Generate all CorpBase content at once
   * @param {object} productData - Product information
   * @param {Array<string>} fields - Specific fields to generate (optional, generates all if not specified)
   * @returns {Promise<object>} - Generated content for each field
   */
  async generateCorpBaseContent(productData, fields = null) {
    try {
      // Check if Langdock is enabled and provide detailed diagnostics
      console.log('[AI Content] Checking AI configuration...');
      const settings = await this.loadSettings();
      const enabled = await langdockService.isEnabled();

      if (!enabled) {
        const hasApiKey = settings?.integrations?.langdock?.apiKey?.length > 0;
        const isEnabledFlag = settings?.integrations?.langdock?.enabled === true;

        console.warn('[AI Content] AI generation not available:');
        console.warn(`  - Enabled flag: ${isEnabledFlag}`);
        console.warn(`  - API key configured: ${hasApiKey}`);
        console.warn('  - Falling back to template-based generation');

        const detailMessage = !isEnabledFlag
          ? 'AI content generation is disabled in System Settings. Enable it in Admin Dashboard > System Settings > Integrations > Langdock.'
          : 'Azure OpenAI API key is not configured. Add your API key in Admin Dashboard > System Settings > Integrations > Langdock.';

        throw new Error(detailMessage);
      }

      console.log('[AI Content] AI configuration verified. Generating content...');

      // Default: generate all fields
      const fieldsToGenerate = fields || [
        'productDescription',
        'websiteTitle',
        'metaDescription',
        'keyFeatures',
        'applications',
        'targetIndustries'
      ];

      const results = {
        success: true,
        generatedAt: new Date(),
        aiGenerated: true,
        content: {},
        diagnostics: {
          configurationValid: true,
          fieldsRequested: fieldsToGenerate.length,
          fieldsGenerated: 0
        }
      };

      // Generate each field
      for (const field of fieldsToGenerate) {
        try {
          console.log(`[AI Content] Generating ${field}...`);
          switch (field) {
            case 'productDescription':
              results.content.productDescription = await this.generateProductDescription(productData);
              break;
            case 'websiteTitle':
              results.content.websiteTitle = await this.generateWebsiteTitle(productData);
              break;
            case 'metaDescription':
              results.content.metaDescription = await this.generateMetaDescription(productData);
              break;
            case 'keyFeatures':
              results.content.keyFeatures = await this.generateKeyFeatures(productData);
              break;
            case 'applications':
              results.content.applications = await this.generateApplications(productData);
              break;
            case 'targetIndustries':
              results.content.targetIndustries = await this.generateTargetIndustries(productData);
              break;
            default:
              console.warn(`[AI Content] Unknown field: ${field}`);
          }
          results.diagnostics.fieldsGenerated++;
        } catch (fieldError) {
          console.error(`[AI Content] Error generating ${field}:`, fieldError.message);
          results.content[field] = null;
          results.errors = results.errors || {};
          results.errors[field] = fieldError.message;
        }
      }

      // Check if any content was generated
      const hasContent = Object.values(results.content).some(val => val !== null);
      if (!hasContent) {
        results.success = false;
        results.message = 'Failed to generate any content. Check API connection and VPN status.';
        console.error('[AI Content] No content was generated for any field');
      } else {
        console.log(`[AI Content] Successfully generated ${results.diagnostics.fieldsGenerated}/${fieldsToGenerate.length} fields`);
      }

      return results;

    } catch (error) {
      console.error('[AI Content] Generation error:', error.message);
      return {
        success: false,
        message: error.message,
        error: error.message,
        content: {},
        diagnostics: {
          configurationValid: false,
          errorType: error.code || 'UNKNOWN'
        }
      };
    }
  }

  /**
   * Generate content with fallback to template-based generation
   * This provides a safety net if AI generation fails
   */
  async generateWithFallback(productData, fields = null) {
    try {
      console.log('[AI Content] Attempting AI-powered content generation...');
      // Try AI generation first
      const aiResult = await this.generateCorpBaseContent(productData, fields);

      if (aiResult.success) {
        console.log('[AI Content] AI generation successful, returning AI-generated content');
        return aiResult;
      }

      // If AI fails, fall back to template-based generation
      console.warn('[AI Content] AI generation failed, using template-based fallback');
      console.warn('[AI Content] Reason:', aiResult.message || aiResult.error);
      const fallbackResult = this.generateTemplateBasedContent(productData);
      fallbackResult.fallbackReason = aiResult.message || aiResult.error;
      return fallbackResult;

    } catch (error) {
      console.error('[AI Content] Exception during content generation:', error.message);
      console.warn('[AI Content] Using template-based fallback due to exception');
      // Fall back to template-based generation
      const fallbackResult = this.generateTemplateBasedContent(productData);
      fallbackResult.fallbackReason = error.message;
      return fallbackResult;
    }
  }

  /**
   * Template-based content generation (fallback)
   * Uses the same logic as the original CreateTicket.jsx
   */
  generateTemplateBasedContent(productData) {
    console.log('[AI Content] Using template-based content generation (no AI)');
    const { productName, molecularFormula, casNumber, sbu } = productData;

    let description = `${productName} is a high-quality chemical compound`;

    if (molecularFormula) {
      description += ` with the molecular formula ${molecularFormula}`;
    }

    if (casNumber) {
      description += ` (CAS: ${casNumber})`;
    }

    description += ` offered by MilliporeSigma for research and development applications.`;

    // Add business unit specific context
    switch (sbu) {
      case 'Life Science':
        description += ` This product is particularly suited for life science research, including cell biology, molecular biology, and biochemical studies.`;
        break;
      case 'Process Solutions':
        description += ` Designed for process development and manufacturing applications, this product meets stringent quality requirements for industrial use.`;
        break;
      default:
        description += ` This versatile compound serves multiple research and industrial applications.`;
    }

    description += ` Available in multiple package sizes to meet diverse research needs, each lot is carefully tested to ensure consistent quality and purity.`;

    return {
      success: true,
      aiGenerated: false,
      generatedAt: new Date(),
      content: {
        productDescription: description,
        websiteTitle: `${productName} | High-Quality Chemical | MilliporeSigma`,
        metaDescription: `Buy ${productName}${molecularFormula ? ` (${molecularFormula})` : ''} from MilliporeSigma. High purity, reliable quality for research applications.`.substring(0, 160),
        keyFeatures: `• High purity and consistent quality\n• Rigorous quality control testing\n• Available in multiple package sizes\n• Suitable for research applications\n• Reliable supply chain and fast delivery`,
        applications: 'Research and Development\nLaboratory Analysis\nChemical Synthesis\nQuality Control',
        targetIndustries: 'Pharmaceutical R&D, Biotechnology, Academic Research, Chemical Manufacturing'
      }
    };
  }
}

// Export singleton instance
module.exports = new AIContentService();
