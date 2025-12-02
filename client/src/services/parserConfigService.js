/**
 * Parser Configuration Service with Caching Layer
 *
 * Manages loading, caching, and accessing parser configuration data.
 * Uses localStorage for persistent caching across sessions.
 * Automatically invalidates cache when version changes.
 */

import { parserConfigAPI } from './api';

const CACHE_KEY = 'parserConfig';
const VERSION_KEY = 'parserConfigVersion';

class ParserConfigService {
  constructor() {
    this.memoryCache = null;
    this.cacheVersion = null;
    this.loading = false;
    this.loadPromise = null;
  }

  /**
   * Load parser configuration with caching
   * @returns {Promise<Object>} Parser configuration data
   */
  async load() {
    // If already loading, return the same promise
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    // If memory cache exists, return it
    if (this.memoryCache) {
      return this.memoryCache;
    }

    // Start loading
    this.loading = true;
    this.loadPromise = this._loadWithCache();

    try {
      const data = await this.loadPromise;
      return data;
    } finally {
      this.loading = false;
      this.loadPromise = null;
    }
  }

  /**
   * Internal method to load with cache checking
   */
  async _loadWithCache() {
    try {
      // Try to load from localStorage first
      const cached = this._getFromLocalStorage();

      if (cached) {
        console.log('Parser config loaded from localStorage cache');
        this.memoryCache = cached.data;
        this.cacheVersion = cached.version;

        // Check server for version updates in background
        this._checkForUpdates();

        return this.memoryCache;
      }

      // No cache, fetch from server
      console.log('No cache found, fetching parser config from server...');
      return await this.fetchFresh();
    } catch (error) {
      console.error('Error loading parser config:', error);

      // If we have cached data, use it even if version check failed
      if (this.memoryCache) {
        console.warn('Using cached data due to error');
        return this.memoryCache;
      }

      // No cache and error fetching - return empty config
      return this._getEmptyConfig();
    }
  }

  /**
   * Fetch fresh configuration from server
   */
  async fetchFresh() {
    try {
      console.log('Fetching fresh parser configuration...');
      const response = await parserConfigAPI.getAll();
      const data = response.data;

      // Store in memory and localStorage
      this.memoryCache = data;
      this.cacheVersion = data.version || 1;

      this._saveToLocalStorage(data, this.cacheVersion);

      console.log('Parser config fetched and cached successfully');
      return data;
    } catch (error) {
      console.error('Error fetching parser config:', error);
      throw error;
    }
  }

  /**
   * Check for updates in the background
   */
  async _checkForUpdates() {
    try {
      const versionResponse = await parserConfigAPI.getVersion();
      const serverVersion = versionResponse.data.overall;

      if (serverVersion > this.cacheVersion) {
        console.log(`New parser config version available (${serverVersion} > ${this.cacheVersion}), fetching...`);
        await this.fetchFresh();
      }
    } catch (error) {
      // Silent fail - we're already using cached data
      console.warn('Could not check for parser config updates:', error.message);
    }
  }

  /**
   * Get configuration from localStorage
   */
  _getFromLocalStorage() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const version = localStorage.getItem(VERSION_KEY);

      if (cached && version) {
        return {
          data: JSON.parse(cached),
          version: parseInt(version, 10)
        };
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return null;
  }

  /**
   * Save configuration to localStorage
   */
  _saveToLocalStorage(data, version) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(VERSION_KEY, version.toString());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Invalidate cache (call after admin makes changes)
   */
  invalidate() {
    console.log('Invalidating parser config cache...');
    this.memoryCache = null;
    this.cacheVersion = null;
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(VERSION_KEY);
  }

  /**
   * Get a specific configuration lookup table
   * @param {string} type - 'testAttribute', 'testMethod', or 'defaultMethod'
   * @returns {Promise<Object>} Lookup table (key -> value)
   */
  async getLookupTable(type) {
    const data = await this.load();

    const configMap = {
      testAttribute: 'testAttributes',
      testMethod: 'testMethods',
      defaultMethod: 'defaultMethods'
    };

    const configKey = configMap[type];
    if (!configKey) {
      throw new Error(`Invalid config type: ${type}`);
    }

    const config = data[configKey];
    if (!config || !config.entries) {
      return {};
    }

    // Convert entries array to lookup object
    const lookup = {};
    config.entries.forEach(entry => {
      lookup[entry.key] = entry.value;
    });

    return lookup;
  }

  /**
   * Get all entries for a specific configuration type
   * @param {string} type - 'testAttribute', 'testMethod', or 'defaultMethod'
   * @returns {Promise<Array>} Array of entries
   */
  async getEntries(type) {
    const data = await this.load();

    const configMap = {
      testAttribute: 'testAttributes',
      testMethod: 'testMethods',
      defaultMethod: 'defaultMethods'
    };

    const configKey = configMap[type];
    if (!configKey) {
      throw new Error(`Invalid config type: ${type}`);
    }

    const config = data[configKey];
    return config?.entries || [];
  }

  /**
   * Get empty configuration fallback
   */
  _getEmptyConfig() {
    return {
      testAttributes: { entries: [], version: 0 },
      testMethods: { entries: [], version: 0 },
      defaultMethods: { entries: [], version: 0 },
      version: 0
    };
  }

  /**
   * Preload configuration (call on app startup)
   */
  async preload() {
    try {
      await this.load();
      console.log('Parser configuration preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload parser configuration:', error);
    }
  }
}

// Export singleton instance
export const parserConfigService = new ParserConfigService();

// Export for testing
export { ParserConfigService };
