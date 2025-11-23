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

      // Decrypt the API key for use (encrypted at rest in database)
      // Need to fetch fresh instance from DB to get Mongoose methods
      const SystemSettings = require('../models/SystemSettings');
      const settingsDoc = await SystemSettings.getSettings();
      const apiKey = settingsDoc.getDecryptedApiKey();
      if (!apiKey || apiKey === '') {
        throw new Error('Azure OpenAI API key is not configured or could not be decrypted');
      }

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
      console.log('[Azure OpenAI] Making API request:');
      console.log('[Azure OpenAI]   Endpoint:', azureEndpoint);
      console.log('[Azure OpenAI]   Full URL:', url);
      console.log('[Azure OpenAI]   Environment:', environment);
      console.log('[Azure OpenAI]   Model/Deployment:', model);
      console.log('[Azure OpenAI]   API Version:', apiVersion);
      console.log('[Azure OpenAI]   API Key:', '****' + apiKey.slice(-8));
      console.log('[Azure OpenAI]   Temperature:', payload.temperature);
      console.log('[Azure OpenAI]   Max Tokens:', payload.max_tokens);
      console.log('[Azure OpenAI]   Timeout:', (langdockConfig.timeout || 30), 'seconds');

      // Make API request using axios (Azure OpenAI format)
      const timeout = (langdockConfig.timeout || 30) * 1000; // Convert to milliseconds

      const startTime = Date.now();
      const response = await axios.post(url, payload, {
        headers: {
          'api-key': apiKey,  // Azure OpenAI uses 'api-key' header (decrypted from database)
          'Content-Type': 'application/json'
        },
        timeout,
        validateStatus: (status) => status < 600 // Don't throw on any status < 600
      });
      const duration = Date.now() - startTime;

      console.log('[Azure OpenAI] Response received:');
      console.log('[Azure OpenAI]   Status:', response.status);
      console.log('[Azure OpenAI]   Duration:', duration, 'ms');

      // Extract generated content
      if (response.data?.choices?.[0]?.message?.content) {
        let content = response.data.choices[0].message.content.trim();

        // Strip markdown code fences if present (AI sometimes adds them despite instructions)
        // Handles: ```html\n<content>\n``` or ```\n<content>\n```
        content = content.replace(/^```html?\n?/i, '').replace(/\n?```$/, '');

        console.log('[Azure OpenAI]   Content length:', content.length, 'characters');
        return content;
      } else {
        console.error('[Azure OpenAI] Invalid response format:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response format from Azure OpenAI API');
      }

    } catch (error) {
      console.error('[Azure OpenAI] API error occurred');
      console.error('[Azure OpenAI] Error type:', error.constructor.name);
      console.error('[Azure OpenAI] Error code:', error.code || 'N/A');
      console.error('[Azure OpenAI] Error message:', error.message);

      // Provide more specific error messages
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        console.error('[Azure OpenAI] HTTP Response:');
        console.error('[Azure OpenAI]   Status:', status);
        console.error('[Azure OpenAI]   Status Text:', error.response.statusText);
        console.error('[Azure OpenAI]   Data:', JSON.stringify(data, null, 2));
        console.error('[Azure OpenAI]   Headers:', JSON.stringify(error.response.headers, null, 2));

        if (status === 401 || status === 403) {
          throw new Error(
            `Authentication failed (HTTP ${status}): ${data?.error?.message || data?.message || 'Invalid API key'}. ` +
            `Please verify your Azure OpenAI API key in Admin Dashboard > System Settings > Integrations > Langdock. ` +
            `If the key is correct, ensure you are connected to the Merck VPN.`
          );
        } else if (status === 404) {
          throw new Error(
            `Resource not found (HTTP 404): The deployment '${error.config?.url}' does not exist. ` +
            `Please verify the model/deployment name and environment in System Settings.`
          );
        } else if (status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          throw new Error(
            `Rate limit exceeded (HTTP 429). ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please try again later.'}`
          );
        } else if (status >= 500) {
          throw new Error(
            `Azure OpenAI service error (HTTP ${status}): ${data?.error?.message || 'Service temporarily unavailable'}. ` +
            `Please try again later.`
          );
        } else {
          throw new Error(
            `Azure OpenAI API error (HTTP ${status}): ${data?.error?.message || data?.message || error.message}`
          );
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(
          `Request timeout: The Azure OpenAI API did not respond within the configured timeout period. ` +
          `This may indicate network issues or high API load. Please try again.`
        );
      } else if (error.code === 'ENOTFOUND') {
        const settings = await this.loadSettings();
        const environment = settings?.integrations?.langdock?.environment || 'prod';
        throw new Error(
          `DNS resolution failed: Cannot resolve '${this.baseURL}.${environment}.uptimize.merckgroup.com'. ` +
          `This usually means you are not connected to the Merck VPN. ` +
          `Please connect to VPN and try again.`
        );
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(
          `Connection refused: The Azure OpenAI service refused the connection. ` +
          `Please check your VPN connection and verify the service is accessible.`
        );
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        throw new Error(
          `Network timeout: Unable to establish connection to Azure OpenAI API. ` +
          `Please check your network connection and VPN status.`
        );
      } else {
        throw new Error(
          `Unexpected error: ${error.message}. ` +
          `If you are connected to the network, please verify your VPN connection and API configuration.`
        );
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
    console.log('='.repeat(80));
    console.log('[Azure OpenAI Test] Starting connection test...');

    try {
      // Load settings first to provide detailed diagnostics
      const settings = await this.loadSettings();
      const langdockConfig = settings?.integrations?.langdock;

      console.log('[Azure OpenAI Test] Configuration check:');
      console.log('[Azure OpenAI Test]   Enabled:', langdockConfig?.enabled);
      console.log('[Azure OpenAI Test]   API Key configured:', langdockConfig?.apiKey ? 'Yes (****' + langdockConfig.apiKey.slice(-8) + ')' : 'No');
      console.log('[Azure OpenAI Test]   Environment:', langdockConfig?.environment || 'prod');
      console.log('[Azure OpenAI Test]   Model:', langdockConfig?.model || 'gpt-4o-mini');
      console.log('[Azure OpenAI Test]   API Version:', langdockConfig?.apiVersion || '2024-10-21');

      const enabled = await this.isEnabled();
      if (!enabled) {
        const hasApiKey = langdockConfig?.apiKey?.length > 0;
        const isEnabledFlag = langdockConfig?.enabled === true;

        console.warn('[Azure OpenAI Test] Configuration invalid:');
        console.warn('[Azure OpenAI Test]   Enabled flag:', isEnabledFlag);
        console.warn('[Azure OpenAI Test]   API key present:', hasApiKey);

        let detailedMessage = '';
        if (!isEnabledFlag && !hasApiKey) {
          detailedMessage = 'Azure OpenAI integration is disabled and no API key is configured. Please enable it and add your API key in System Settings.';
        } else if (!isEnabledFlag) {
          detailedMessage = 'Azure OpenAI integration is disabled in System Settings. Enable it to use AI content generation.';
        } else if (!hasApiKey) {
          detailedMessage = 'Azure OpenAI API key is not configured. Please add your API key in System Settings.';
        } else {
          detailedMessage = 'Configuration check failed for unknown reason.';
        }

        console.log('[Azure OpenAI Test] Test failed - Configuration issue');
        console.log('='.repeat(80));

        return {
          success: false,
          message: detailedMessage,
          diagnostics: {
            enabled: isEnabledFlag,
            hasApiKey: hasApiKey,
            environment: langdockConfig?.environment || 'prod',
            model: langdockConfig?.model || 'gpt-4o-mini'
          }
        };
      }

      const model = langdockConfig.model || 'gpt-4o-mini';
      const environment = langdockConfig.environment || 'prod';
      const endpoint = `${this.baseURL}.${environment}.uptimize.merckgroup.com`;

      console.log('[Azure OpenAI Test] Configuration valid, making test request...');
      console.log('[Azure OpenAI Test]   Endpoint:', endpoint);
      console.log('[Azure OpenAI Test]   Model/Deployment:', model);

      // Make a simple test request
      const testPrompt = 'Respond with "Connection successful" if you can read this message.';
      const startTime = Date.now();
      const response = await this.generateCompletion(testPrompt, {
        temperature: 0,
        maxTokens: 50
      });
      const duration = Date.now() - startTime;

      console.log('[Azure OpenAI Test] Connection successful!');
      console.log('[Azure OpenAI Test]   Duration:', duration, 'ms');
      console.log('[Azure OpenAI Test]   Response:', response.substring(0, 100) + (response.length > 100 ? '...' : ''));
      console.log('='.repeat(80));

      return {
        success: true,
        message: 'Azure OpenAI API connection successful! Your API key is valid and the service is accessible.',
        model,
        environment,
        endpoint,
        response,
        duration,
        diagnostics: {
          enabled: true,
          hasApiKey: true,
          environment,
          model,
          responseTime: duration
        }
      };

    } catch (error) {
      console.error('[Azure OpenAI Test] Connection test failed');
      console.error('[Azure OpenAI Test] Error:', error.message);
      console.log('='.repeat(80));

      return {
        success: false,
        message: error.message,
        error: error.message
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
