const axios = require('axios');
const SystemSettings = require('../models/SystemSettings');
const arrow = require('apache-arrow');

/**
 * PalantirService - Integration with Palantir Foundry
 * Provides SQL query capabilities against Palantir datasets
 */
class PalantirService {
  constructor() {
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
   * Check if Palantir integration is enabled and configured
   */
  async isEnabled() {
    const settings = await this.loadSettings();
    return (
      settings?.integrations?.palantir?.enabled === true &&
      settings?.integrations?.palantir?.token?.length > 0 &&
      settings?.integrations?.palantir?.datasetRID?.length > 0
    );
  }

  /**
   * Get configuration for Palantir connection
   */
  async getConfig() {
    const settings = await this.loadSettings();
    const palantirConfig = settings?.integrations?.palantir;

    if (!palantirConfig) {
      throw new Error('Palantir configuration not found');
    }

    // Decrypt the token
    const token = settings.getDecryptedPalantirToken();
    if (!token || token === '') {
      throw new Error('Palantir token is not configured or could not be decrypted');
    }

    return {
      token,
      datasetRID: palantirConfig.datasetRID,
      hostname: palantirConfig.hostname || 'merckgroup.palantirfoundry.com',
      timeout: (palantirConfig.timeout || 30) * 1000 // Convert to milliseconds
    };
  }

  /**
   * Test connection to Palantir Foundry using Files API (like urea project)
   * This lists files in the dataset to verify access
   * @returns {Promise<{success: boolean, message: string, details?: object}>}
   */
  async testConnectionFilesAPI() {
    console.log('='.repeat(80));
    console.log('[Palantir Service] Testing connection with Files API...');

    try {
      const config = await this.getConfig();
      const startTime = Date.now();

      // Step 1: Verify dataset exists with Catalog API
      const catalogUrl = `https://${config.hostname}/api/v1/datasets/${config.datasetRID}`;
      console.log(`[Palantir Service]   Step 1: Catalog URL: ${catalogUrl}`);

      const catalogResponse = await axios.get(catalogUrl, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        timeout: config.timeout
      });

      console.log(`[Palantir Service]   ✓ Dataset found: ${catalogResponse.data.name || 'N/A'}`);

      // Step 2: List files in the dataset
      const filesUrl = `https://${config.hostname}/api/v2/datasets/${config.datasetRID}/files`;
      console.log(`[Palantir Service]   Step 2: Files URL: ${filesUrl}`);

      const filesResponse = await axios.get(filesUrl, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json'
        },
        params: { branch: 'master' },
        timeout: config.timeout
      });

      const duration = Date.now() - startTime;
      const files = filesResponse.data.data || filesResponse.data || [];
      const fileCount = Array.isArray(files) ? files.length : 0;

      console.log(`[Palantir Service]   ✓ Found ${fileCount} files in dataset`);

      if (fileCount > 0 && files[0]) {
        const firstFile = files[0];
        const fileSize = firstFile.sizeBytes ? (parseInt(firstFile.sizeBytes) / 1024 / 1024).toFixed(2) : 'N/A';
        console.log(`[Palantir Service]   Sample file: ${firstFile.path} (${fileSize} MB)`);
      }

      console.log('='.repeat(80));

      await this.updateConnectionStatus('connected');

      return {
        success: true,
        message: `Connected to dataset "${catalogResponse.data.name || config.datasetRID}" with ${fileCount} files`,
        datasetRID: config.datasetRID,
        hostname: config.hostname,
        duration,
        datasetName: catalogResponse.data.name,
        fileCount: fileCount,
        sampleFile: fileCount > 0 ? files[0].path : null,
        diagnostics: {
          enabled: true,
          hasToken: true,
          hasDatasetRID: true,
          responseTime: duration,
          apiUsed: 'Files API v2',
          fileFormats: fileCount > 0 ? [...new Set(files.map(f => f.path?.split('.').pop()))].join(', ') : 'N/A'
        }
      };
    } catch (error) {
      console.error('[Palantir Service] Files API test failed');
      console.error('[Palantir Service] Error:', error.message);
      console.log('='.repeat(80));

      await this.updateConnectionStatus('failed');

      throw error;
    }
  }

  /**
   * Test connection to Palantir Foundry using SQL Query API
   * @returns {Promise<{success: boolean, message: string, details?: object}>}
   */
  async testConnection() {
    console.log('='.repeat(80));
    console.log('[Palantir Service] Starting connection test with SQL Query API...');

    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        console.warn('[Palantir Service] Palantir integration is not enabled or not configured');

        const settings = await this.loadSettings();
        const palantirConfig = settings?.integrations?.palantir;

        const hasToken = palantirConfig?.token?.length > 0;
        const hasDatasetRID = palantirConfig?.datasetRID?.length > 0;
        const isEnabledFlag = palantirConfig?.enabled === true;

        console.log('[Palantir Service] Configuration check:');
        console.log(`[Palantir Service]   Enabled: ${isEnabledFlag}`);
        console.log(`[Palantir Service]   Has Token: ${hasToken}`);
        console.log(`[Palantir Service]   Has Dataset RID: ${hasDatasetRID}`);
        console.log('='.repeat(80));

        await this.updateConnectionStatus('failed');

        return {
          success: false,
          message: 'Palantir integration is not enabled or not configured properly',
          diagnostics: {
            enabled: isEnabledFlag,
            hasToken: hasToken,
            hasDatasetRID: hasDatasetRID
          }
        };
      }

      const config = await this.getConfig();

      console.log('[Palantir Service] Configuration valid, making test request...');
      console.log(`[Palantir Service]   Hostname: ${config.hostname}`);
      console.log(`[Palantir Service]   Dataset RID: ${config.datasetRID}`);
      console.log(`[Palantir Service]   Token: ****${config.token.slice(-8)}`);
      console.log(`[Palantir Service]   Timeout: ${config.timeout / 1000} seconds`);

      // Test with a real query that searches for material 176036
      // MATNR is the Material Number column (from MARA mapping)
      const testQuery = `SELECT * FROM \`${config.datasetRID}\` WHERE MATNR LIKE '%176036%' LIMIT 1`;
      console.log(`[Palantir Service]   Test Query: ${testQuery}`);

      const startTime = Date.now();

      const response = await this.executeQuery(testQuery);
      const duration = Date.now() - startTime;

      console.log('[Palantir Service] Connection successful!');
      console.log(`[Palantir Service]   Duration: ${duration}ms`);
      console.log(`[Palantir Service]   Rows returned: ${response.rows?.length || 0}`);

      // Log sample data if found
      if (response.rows && response.rows.length > 0) {
        console.log(`[Palantir Service]   Sample row keys: ${Object.keys(response.rows[0]).join(', ')}`);
        if (response.rows[0].MATNR) {
          console.log(`[Palantir Service]   Found material: ${response.rows[0].MATNR}`);
        }
      }

      console.log('='.repeat(80));

      // Update connection status in database
      await this.updateConnectionStatus('connected');

      const message = response.rows?.length > 0
        ? `Connection successful! Found test material (MATNR: ${response.rows[0].MATNR || 'unknown'}) in dataset.`
        : 'Connection successful! Dataset is accessible but test material 176036 was not found.';

      return {
        success: true,
        message: message,
        datasetRID: config.datasetRID,
        hostname: config.hostname,
        duration,
        rowsFound: response.rows?.length || 0,
        sampleData: response.rows?.[0] || null,
        diagnostics: {
          enabled: true,
          hasToken: true,
          hasDatasetRID: true,
          responseTime: duration,
          apiUsed: 'SQL Query API v2'
        }
      };

    } catch (error) {
      console.error('[Palantir Service] Connection test failed');
      console.error('[Palantir Service] Error:', error.message);
      console.log('='.repeat(80));

      // Update connection status in database
      await this.updateConnectionStatus('failed');

      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Legacy test connection method - kept for backward compatibility
   * @deprecated Use testConnection() instead
   */
  async testConnectionSQL() {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        console.warn('[Palantir Service] Palantir integration is not enabled or not configured');

        const settings = await this.loadSettings();
        const palantirConfig = settings?.integrations?.palantir;

        const hasToken = palantirConfig?.token?.length > 0;
        const hasDatasetRID = palantirConfig?.datasetRID?.length > 0;
        const isEnabledFlag = palantirConfig?.enabled === true;

        let detailedMessage = '';
        if (!isEnabledFlag && !hasToken && !hasDatasetRID) {
          detailedMessage = 'Palantir integration is disabled and no token/dataset is configured. Please enable and configure in System Settings.';
        } else if (!isEnabledFlag) {
          detailedMessage = 'Palantir integration is disabled in System Settings. Enable it to use Palantir datasets.';
        } else if (!hasToken) {
          detailedMessage = 'Palantir token is not configured. Please add your token in System Settings.';
        } else if (!hasDatasetRID) {
          detailedMessage = 'Palantir dataset RID is not configured. Please add your dataset RID in System Settings.';
        }

        console.log('[Palantir Service] Test failed - Configuration issue');
        console.log('='.repeat(80));

        return {
          success: false,
          message: detailedMessage,
          diagnostics: {
            enabled: isEnabledFlag,
            hasToken: hasToken,
            hasDatasetRID: hasDatasetRID
          }
        };
      }

      const config = await this.getConfig();

      console.log('[Palantir Service] Configuration valid, making test request...');
      console.log(`[Palantir Service]   Hostname: ${config.hostname}`);
      console.log(`[Palantir Service]   Dataset RID: ${config.datasetRID}`);
      console.log(`[Palantir Service]   Token: ****${config.token.slice(-8)}`);
      console.log(`[Palantir Service]   Timeout: ${config.timeout / 1000} seconds`);

      // Test with a real query that searches for material 176036
      // MATNR is the Material Number column (from MARA mapping)
      const testQuery = `SELECT * FROM \`${config.datasetRID}\` WHERE MATNR LIKE '%176036%' LIMIT 1`;
      console.log(`[Palantir Service]   Test Query: ${testQuery}`);

      const startTime = Date.now();

      const response = await this.executeQuery(testQuery);
      const duration = Date.now() - startTime;

      console.log('[Palantir Service] Connection successful!');
      console.log(`[Palantir Service]   Duration: ${duration}ms`);
      console.log(`[Palantir Service]   Rows returned: ${response.rows?.length || 0}`);

      // Log sample data if found
      if (response.rows && response.rows.length > 0) {
        console.log(`[Palantir Service]   Sample row keys: ${Object.keys(response.rows[0]).join(', ')}`);
        if (response.rows[0].MATNR) {
          console.log(`[Palantir Service]   Found material: ${response.rows[0].MATNR}`);
        }
      }

      console.log('='.repeat(80));

      // Update connection status in database
      await this.updateConnectionStatus('connected');

      const message = response.rows?.length > 0
        ? `Connection successful! Found test material (MATNR: ${response.rows[0].MATNR || 'unknown'}) in dataset.`
        : 'Connection successful! Dataset is accessible but test material 176036 was not found.';

      return {
        success: true,
        message: message,
        datasetRID: config.datasetRID,
        hostname: config.hostname,
        duration,
        rowsFound: response.rows?.length || 0,
        sampleData: response.rows?.[0] || null,
        diagnostics: {
          enabled: true,
          hasToken: true,
          hasDatasetRID: true,
          responseTime: duration
        }
      };

    } catch (error) {
      console.error('[Palantir Service] Connection test failed');
      console.error('[Palantir Service] Error:', error.message);
      console.log('='.repeat(80));

      // Update connection status in database
      await this.updateConnectionStatus('failed');

      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  }

  /**
   * Execute a SQL query against the Palantir dataset
   * @param {string} query - SQL query to execute
   * @param {object} options - Query options (limit, etc.)
   * @returns {Promise<{rows: Array, columns: Array}>}
   */
  async executeQuery(query, options = {}) {
    try {
      const enabled = await this.isEnabled();
      if (!enabled) {
        throw new Error('Palantir integration is not enabled or not configured properly');
      }

      const config = await this.getConfig();

      // Build Palantir SQL API v2 endpoint
      // Palantir Foundry SQL API: https://{hostname}/api/v2/sqlQueries/execute
      const url = `https://${config.hostname}/api/v2/sqlQueries/execute?preview=true`;

      console.log('[Palantir Service] Executing SQL query...');
      console.log(`[Palantir Service]   URL: ${url}`);
      console.log(`[Palantir Service]   Query: ${query.substring(0, 100)}${query.length > 100 ? '...' : ''}`);

      // Prepare request payload for SQL Query API v2
      // Format: { "query": "SELECT ...", "fallbackBranchIds": ["master"] }
      const payload = {
        query: query,
        ...(options.fallbackBranchIds && { fallbackBranchIds: options.fallbackBranchIds })
      };

      // Make API request
      const startTime = Date.now();
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: config.timeout
      });
      const duration = Date.now() - startTime;

      console.log('[Palantir Service] Query submitted successfully');
      console.log(`[Palantir Service]   Submission duration: ${duration}ms`);
      console.log(`[Palantir Service]   Response status: ${response.status}`);

      const resultData = response.data;
      console.log(`[Palantir Service]   Response type: ${resultData.type || 'unknown'}`);

      // Debug: log the full response structure
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Palantir Service]   Full response keys: ${Object.keys(resultData).join(', ')}`);
      }

      // Handle different response types from execute endpoint
      // Response is a union type: running, succeeded, failed, canceled

      // Check if query failed immediately
      if (resultData.type === 'failed') {
        throw new Error(`Query failed: ${resultData.errorMessage || 'Unknown error'}`);
      }

      // Check if query was canceled
      if (resultData.type === 'canceled') {
        throw new Error('Query was canceled');
      }

      // Extract queryId (present in both "running" and "succeeded" responses)
      const queryId = resultData.queryId;
      if (!queryId) {
        console.error('[Palantir Service]   ERROR: No queryId in response');
        console.error('[Palantir Service]   Response data:', JSON.stringify(resultData, null, 2));
        throw new Error('No queryId returned from execute endpoint');
      }

      console.log(`[Palantir Service]   Query ID (raw): ${queryId}`);
      console.log(`[Palantir Service]   Query ID type: ${typeof queryId}`);
      console.log(`[Palantir Service]   Query ID length: ${queryId.length}`);

      // If query already succeeded, skip polling
      let queryStatus = resultData.type;

      // Poll getStatus endpoint until query succeeds or fails
      if (queryStatus === 'running') {
        console.log(`[Palantir Service]   Query is running, polling for completion...`);

        const maxPolls = 60; // 60 attempts
        const pollInterval = 1000; // 1 second

        // URL-encode the queryId to handle special characters and base64 content
        const encodedQueryId = encodeURIComponent(queryId);
        const statusUrl = `https://${config.hostname}/api/v2/sqlQueries/${encodedQueryId}/getStatus?preview=true`;

        console.log(`[Palantir Service]   Status URL: ${statusUrl}`);

        for (let poll = 1; poll <= maxPolls; poll++) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));

          console.log(`[Palantir Service]   Poll ${poll}/${maxPolls}: Checking status...`);

          try {
            const statusResponse = await axios.get(statusUrl, {
              headers: {
                'Authorization': `Bearer ${config.token}`,
                'Accept': 'application/json'
              },
              timeout: 10000
            });

            queryStatus = statusResponse.data.type;
            console.log(`[Palantir Service]   Status: ${queryStatus}`);

            if (queryStatus === 'succeeded') {
              console.log(`[Palantir Service]   ✓ Query completed successfully!`);
              break;
            } else if (queryStatus === 'failed') {
              throw new Error(`Query failed: ${statusResponse.data.errorMessage || 'Unknown error'}`);
            } else if (queryStatus === 'canceled') {
              throw new Error('Query was canceled during execution');
            }
            // Otherwise status is still "running", continue polling

          } catch (statusError) {
            console.error(`[Palantir Service]   Status check error: ${statusError.message}`);
            // Continue polling unless it's a non-network error
            if (!statusError.response) {
              throw statusError;
            }
          }
        }

        if (queryStatus !== 'succeeded') {
          throw new Error(`Query did not complete within ${maxPolls} seconds`);
        }
      }

      // Fetch results using getResults endpoint
      console.log(`[Palantir Service]   Fetching results...`);

      // URL-encode the queryId to handle special characters and base64 content
      const encodedQueryId = encodeURIComponent(queryId);
      const resultsUrl = `https://${config.hostname}/api/v2/sqlQueries/${encodedQueryId}/getResults?preview=true`;
      console.log(`[Palantir Service]   Results URL: ${resultsUrl}`);

      const resultsResponse = await axios.get(resultsUrl, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/octet-stream' // Apache Arrow binary format
        },
        responseType: 'arraybuffer', // Important: get binary data
        timeout: 60000 // 60 second timeout for results
      });

      const totalDuration = Date.now() - startTime;
      console.log(`[Palantir Service] ✓ Results fetched successfully!`);
      console.log(`[Palantir Service]   Total duration: ${totalDuration}ms`);
      console.log(`[Palantir Service]   Response size: ${resultsResponse.data.byteLength} bytes`);

      // Parse Apache Arrow format
      console.log(`[Palantir Service]   Parsing Apache Arrow data...`);
      const arrowTable = arrow.tableFromIPC(resultsResponse.data);

      // Convert Arrow table to rows array
      const rows = [];
      const numRows = arrowTable.numRows;
      const schema = arrowTable.schema;
      const columns = schema.fields.map(field => ({
        name: field.name,
        type: field.type.toString()
      }));

      console.log(`[Palantir Service]   Columns: ${columns.map(c => c.name).join(', ')}`);
      console.log(`[Palantir Service]   Rows: ${numRows}`);

      // Convert each row to a plain object
      for (let i = 0; i < numRows; i++) {
        const row = {};
        for (const field of schema.fields) {
          const column = arrowTable.getChild(field.name);
          row[field.name] = column.get(i);
        }
        rows.push(row);
      }

      console.log(`[Palantir Service]   ✓ Parsed ${rows.length} rows`);

      return {
        rows: rows,
        columns: columns,
        duration: totalDuration,
        queryId: queryId
      };

    } catch (error) {
      console.error('[Palantir Service] Query execution failed');
      console.error('[Palantir Service] Error type:', error.constructor.name);
      console.error('[Palantir Service] Error message:', error.message);

      // Provide more specific error messages
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        console.error('[Palantir Service] HTTP Response:');
        console.error('[Palantir Service]   Status:', status);
        console.error('[Palantir Service]   Data:', JSON.stringify(data, null, 2));

        if (status === 401 || status === 403) {
          throw new Error(
            `Authentication failed (HTTP ${status}): ${data?.errorName || 'Invalid token'}. ` +
            `Please verify your Palantir token in System Settings.`
          );
        } else if (status === 404) {
          throw new Error(
            `Dataset not found (HTTP 404): The dataset RID '${(await this.getConfig()).datasetRID}' does not exist or you don't have access to it.`
          );
        } else if (status === 429) {
          throw new Error(`Rate limit exceeded (HTTP 429). Please try again later.`);
        } else if (status >= 500) {
          throw new Error(
            `Palantir service error (HTTP ${status}): ${data?.errorMessage || 'Service temporarily unavailable'}. ` +
            `Please try again later.`
          );
        } else {
          throw new Error(
            `Palantir API error (HTTP ${status}): ${data?.errorMessage || data?.message || error.message}`
          );
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(
          `Request timeout: The Palantir API did not respond within the configured timeout period. ` +
          `Please try again or check your connection.`
        );
      } else if (error.code === 'ENOTFOUND') {
        const config = await this.getConfig();
        throw new Error(
          `DNS resolution failed: Cannot resolve '${config.hostname}'. ` +
          `Please verify the hostname in System Settings or check your network connection.`
        );
      } else {
        throw new Error(`Unexpected error: ${error.message}`);
      }
    }
  }

  /**
   * Query the configured dataset with SQL
   * @param {string} query - SQL query to execute (should reference dataset by RID)
   * @param {object} options - Query options
   * @returns {Promise<{rows: Array, columns: Array}>}
   */
  async queryDataset(query, options = {}) {
    const config = await this.getConfig();

    // If no FROM clause, automatically add the dataset RID
    // Palantir SQL Query API v2 expects dataset references like: FROM `ri.foundry.main.dataset.xxx`
    if (!query.toUpperCase().includes('FROM')) {
      query = `${query} FROM \`${config.datasetRID}\``;
    }

    return await this.executeQuery(query, options);
  }

  /**
   * Update connection status in database
   * @param {string} status - 'connected', 'failed', or 'unknown'
   */
  async updateConnectionStatus(status) {
    try {
      const settings = await SystemSettings.getSettings();
      settings.integrations.palantir.connectionStatus = status;
      settings.integrations.palantir.lastConnectionTest = new Date();
      await settings.save();
    } catch (error) {
      console.error('[Palantir Service] Failed to update connection status:', error);
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
module.exports = new PalantirService();
