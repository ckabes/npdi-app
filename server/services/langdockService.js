const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');

/**
 * LangdockService - Integration with Azure OpenAI via Merck NLP API
 * Provides AI content generation through Azure OpenAI endpoint
 */
class LangdockService {
  constructor() {
    // Merck's Azure OpenAI NLP API endpoint (base URL without environment)
    this.baseURL = 'https://api.nlp';
    this.settings = null;
    this.lastSettingsUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Load settings from database with caching
   */
  async loadSettings() {
    const now = Date.now();

    // Use cached settings if available and recent
    if (this.settings && this.lastSettingsUpdate && (now - this.lastSettingsUpdate < this.cacheTimeout)) {
      return this.settings;
    }

    // Fetch fresh settings from database
    this.settings = await SystemSettings.getSettings();
    this.lastSettingsUpdate = now;

    return this.settings;
  }

  /**
   * Check if Langdock integration is enabled and configured
   */
  async isEnabled() {
    const settings = await this.loadSettings();
    return (
      settings?.integrations?.langdock?.enabled === true &&
      settings?.integrations?.langdock?.apiKey?.length > 0
    );
  }

  /**
   * Generate chat completion using Langdock API
   * @param {string} prompt - The user prompt to send
   * @param {object} options - Additional options (temperature, maxTokens, etc.)
   * @returns {Promise<string>} - Generated text content
   */
  async generateCompletion(prompt, options = {}) {
    try {
      // Check if Langdock is enabled
      const enabled = await this.isEnabled();
      if (!enabled) {
        throw new Error('Langdock AI integration is not enabled or API key is not configured');
      }

      const settings = await this.loadSettings();
      const langdockConfig = settings.integrations.langdock;

      // Build Azure OpenAI endpoint URL
      // Format: https://api.nlp.{env}.uptimize.merckgroup.com/openai/deployments/{model}/chat/completions?api-version={version}
      const environment = langdockConfig.environment || 'prod';
      const apiVersion = langdockConfig.apiVersion || '2024-10-21';
      const model = options.model || langdockConfig.model || 'gpt-4o-mini';

      const azureEndpoint = `${this.baseURL}.${environment}.uptimize.merckgroup.com`;
      const url = `${azureEndpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

      // Prepare request payload (Azure OpenAI format)
      const payload = {
        messages: [
          {
            role: 'system',
            content: 'You are a professional technical content writer for MilliporeSigma, specializing in life science and chemical products.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || langdockConfig.maxTokens || 2000
      };

      // Debug logging
      console.log('Azure OpenAI API Request:');
      console.log('  Endpoint:', azureEndpoint);
      console.log('  URL:', url);
      console.log('  Environment:', environment);
      console.log('  Model/Deployment:', model);
      console.log('  API Version:', apiVersion);
      console.log('  API Key (last 8):', '****' + langdockConfig.apiKey.slice(-8));
      console.log('  Temperature:', payload.temperature);
      console.log('  Max Tokens:', payload.max_tokens);

      // Make API request using axios (Azure OpenAI format)
      const timeout = (langdockConfig.timeout || 30) * 1000; // Convert to milliseconds
      const response = await axios.post(url, payload, {
        headers: {
          'api-key': langdockConfig.apiKey,  // Azure OpenAI uses 'api-key' header
          'Content-Type': 'application/json'
        },
        timeout
      });

      console.log('Azure OpenAI API Response Status:', response.status);

      // Extract generated content
      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error('Invalid response format from Azure OpenAI API');
      }

    } catch (error) {
      console.error('Azure OpenAI API error:', error.message);

      // Provide more specific error messages
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        console.error('API Response Status:', status);
        console.error('API Response Data:', JSON.stringify(data, null, 2));
        console.error('API Response Headers:', JSON.stringify(error.response.headers, null, 2));

        if (status === 401) {
          throw new Error(`Azure OpenAI API authentication failed: ${data?.message || 'Invalid API key'}. Please verify your API key in Admin Dashboard. VPN connection may be required.`);
        } else if (status === 429) {
          throw new Error('Azure OpenAI API rate limit exceeded. Please try again later.');
        } else if (status >= 500) {
          throw new Error('Azure OpenAI API service error. Please try again later.');
        } else {
          throw new Error(`Azure OpenAI API error (${status}): ${data?.message || data?.error?.message || error.message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Azure OpenAI API request timed out. Please try again.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(`Failed to connect to Azure OpenAI API: ${error.message}. VPN connection may be required.`);
      } else {
        throw new Error(`Failed to generate content: ${error.message}`);
      }
    }
  }

  /**
   * Generate multiple completions in parallel (batch processing)
   * @param {Array<{prompt: string, options: object}>} requests - Array of requests
   * @returns {Promise<Array<{success: boolean, content: string, error: string}>>}
   */
  async generateBatch(requests) {
    const promises = requests.map(async (req) => {
      try {
        const content = await this.generateCompletion(req.prompt, req.options);
        return { success: true, content, error: null };
      } catch (error) {
        return { success: false, content: null, error: error.message };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Test the Azure OpenAI API connection
   * @returns {Promise<{success: boolean, message: string, model: string}>}
   */
  async testConnection() {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        return {
          success: false,
          message: 'Azure OpenAI integration is not enabled or API key is not configured'
        };
      }

      const settings = await this.loadSettings();
      const model = settings.integrations.langdock.model;

      // Make a simple test request
      const testPrompt = 'Respond with "Connection successful" if you can read this message.';
      const response = await this.generateCompletion(testPrompt, {
        temperature: 0,
        maxTokens: 50
      });

      return {
        success: true,
        message: 'Azure OpenAI API connection successful',
        model,
        response
      };

    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Clear cached settings (useful after settings update)
   */
  clearCache() {
    this.settings = null;
    this.lastSettingsUpdate = null;
  }
}

// Export singleton instance
module.exports = new LangdockService();
