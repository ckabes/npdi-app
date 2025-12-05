import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  // Get the current user profile from localStorage - always read fresh to avoid stale data
  const savedProfileId = localStorage.getItem('selectedProfile');

  if (savedProfileId) {
    // Always read fresh from localStorage to ensure we have the latest profile data
    let profileData = localStorage.getItem('currentProfileData');

    if (profileData) {
      try {
        const profile = JSON.parse(profileData);
        // Debug logging to help track profile issues
        if (config.url && config.url.includes('/comments')) {
          console.log('API Request - Adding comment with profile:', {
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role,
            email: profile.email
          });
        }
        // Add user information as headers (no authentication, just profile data)
        config.headers['x-user-role'] = profile.role;
        config.headers['x-user-firstname'] = profile.firstName;
        config.headers['x-user-lastname'] = profile.lastName;
        config.headers['x-user-email'] = profile.email;
        if (profile.sbu) {
          config.headers['x-user-sbu'] = profile.sbu;
        }
      } catch (error) {
        console.error('Error parsing profile data:', error);
      }
    } else {
      console.warn('No profile data found in localStorage');
    }
  } else {
    console.warn('No saved profile ID found');
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear profile and redirect to profile selection
      localStorage.removeItem('selectedProfile');
      window.location.href = '/select-profile';
    }
    return Promise.reject(error);
  }
);

export const productAPI = {
  createTicket: (data) => apiClient.post('/products', data),
  saveDraft: (data) => apiClient.post('/products/draft', data),
  getTickets: (params) => apiClient.get('/products', { params }),
  getTicket: (id) => apiClient.get(`/products/${id}`),
  updateTicket: (id, data) => apiClient.put(`/products/${id}`, data),
  updateStatus: (id, data) => apiClient.patch(`/products/${id}/status`, data),
  addComment: (id, data) => apiClient.post(`/products/${id}/comments`, data),
  getDashboardStats: () => apiClient.get('/products/dashboard/stats'),
  getRecentActivity: (params) => apiClient.get('/products/recent-activity', { params }),
  lookupCAS: (casNumber) => {
    console.log('API: Starting CAS lookup for', casNumber);
    return apiClient.get(`/products/cas-lookup/${casNumber}`, {
      timeout: 30000 // 30 second timeout
    }).then(response => {
      console.log('API: CAS lookup successful', response.data);
      return response;
    }).catch(error => {
      console.error('API: CAS lookup failed', error);
      throw error;
    });
  },
  searchMARA: (searchType, searchValue, options = {}) => {
    const { limit = 10, offset = 0 } = options;
    console.log(`API: Starting SAP search - Type: ${searchType}, Value: ${searchValue}, Limit: ${limit}, Offset: ${offset}`);
    return apiClient.get(`/products/sap-search`, {
      params: {
        type: searchType,
        value: searchValue,
        limit: limit,
        offset: offset
      },
      timeout: 60000 // 60 second timeout for Palantir queries
    }).then(response => {
      console.log('API: SAP search successful', response.data);
      return response;
    }).catch(error => {
      console.error('API: SAP search failed', error);
      throw error;
    });
  },
  searchSimilarProducts: (casNumber, options = {}) => {
    console.log('API: Starting similar products search for CAS', casNumber);
    const { maxResults = 3, maxSearchTime = 20000, filterSixDigit = true } = options;
    return apiClient.get(`/products/similar-products/${casNumber}`, {
      params: { maxResults, maxSearchTime, filterSixDigit },
      timeout: maxSearchTime + 5000 // Add 5 seconds buffer to API timeout
    }).then(response => {
      console.log('API: Similar products search successful', response.data);
      return response;
    }).catch(error => {
      console.error('API: Similar products search failed', error);
      throw error;
    });
  },
  generateCorpBaseContent: (productData, fields = null) => {
    console.log('API: Starting AI content generation for', productData.productName);

    // Extract forceTemplate flag if present
    const { forceTemplate, ...cleanProductData } = productData;

    return apiClient.post('/products/generate-corpbase-content', {
      productData: cleanProductData,
      fields,
      forceTemplate: forceTemplate || false
    }, {
      timeout: 60000 // 60 second timeout for AI generation
    }).then(response => {
      console.log('API: AI content generation successful', response.data);
      return response;
    }).catch(error => {
      console.error('API: AI content generation failed', error);
      throw error;
    });
  },
  exportPDPChecklist: (id) => apiClient.get(`/products/${id}/export-pdp`, {
    responseType: 'blob' // Important for binary data
  }),
  exportPIF: (id) => apiClient.get(`/products/${id}/export-pif`, {
    responseType: 'blob' // Important for binary data
  }),
  exportDataExcel: (id) => apiClient.get(`/products/${id}/export-data`, {
    responseType: 'blob' // Important for binary data
  })
};

export const formConfigAPI = {
  getActive: () => apiClient.get('/form-config/active'),
  getAll: () => apiClient.get('/form-config/all'),
  getById: (id) => apiClient.get(`/form-config/${id}`),
  create: (data) => apiClient.post('/form-config', data),
  update: (id, data) => apiClient.put(`/form-config/${id}`, data),
  publish: (id) => apiClient.post(`/form-config/${id}/publish`),
  discardDraft: (id) => apiClient.post(`/form-config/${id}/discard-draft`),
  rollback: (id) => apiClient.post(`/form-config/${id}/rollback`),
  restoreDefault: (id) => apiClient.post(`/form-config/${id}/restore-default`),
  reorderSections: (id, sectionOrders) =>
    apiClient.patch(`/form-config/${id}/sections/reorder`, { sectionOrders }),
  addSection: (id, section) => apiClient.post(`/form-config/${id}/sections`, section),
  addField: (id, sectionKey, field) =>
    apiClient.post(`/form-config/${id}/sections/${sectionKey}/fields`, field),
  deleteSection: (id, sectionKey) =>
    apiClient.delete(`/form-config/${id}/sections/${sectionKey}`),
  deleteField: (id, sectionKey, fieldKey) =>
    apiClient.delete(`/form-config/${id}/sections/${sectionKey}/fields/${fieldKey}`),
  activate: (id) => apiClient.patch(`/form-config/${id}/activate`)
};

export const permissionAPI = {
  getAll: () => apiClient.get('/permissions'),
  getByRole: (role) => apiClient.get(`/permissions/${role}`),
  updateRole: (role, privileges) => apiClient.put(`/permissions/${role}`, { privileges }),
  updatePrivilege: (role, section, privilege, value) =>
    apiClient.patch(`/permissions/${role}/${section}/${privilege}`, { value }),
  initialize: () => apiClient.post('/permissions/initialize'),
  getUserPrivileges: () => apiClient.get('/permissions/user/me')
};

export const systemSettingsAPI = {
  getSettings: () => apiClient.get('/system-settings'),
  updateSettings: (settings) => apiClient.put('/system-settings', settings),
  getSection: (section) => apiClient.get(`/system-settings/${section}`),
  testPubChem: () => apiClient.post('/system-settings/test-pubchem'),
  testAzureOpenAI: () => apiClient.post('/system-settings/test-azure-openai')
};

export const userPreferencesAPI = {
  getPreferences: () => apiClient.get('/user-preferences'),
  updatePreferences: (preferences) => apiClient.put('/user-preferences', preferences),
  getSection: (section) => apiClient.get(`/user-preferences/${section}`),
  updateSection: (section, data) => apiClient.patch(`/user-preferences/${section}`, data),
  reset: () => apiClient.post('/user-preferences/reset')
};

export const userAPI = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
  toggleStatus: (id) => apiClient.patch(`/users/${id}/toggle-status`)
};

export const templatesAPI = {
  getAll: () => apiClient.get('/templates'),
  getById: (id) => apiClient.get(`/templates/${id}`),
  getUserTemplate: (email, role) => apiClient.get(`/templates/user/${email}?role=${role}`),
  create: (data) => apiClient.post('/templates', data),
  update: (id, data) => apiClient.put(`/templates/${id}`, data),
  delete: (id) => apiClient.delete(`/templates/${id}`),
  assign: (id, data) => apiClient.patch(`/templates/${id}/assign`, data),
  unassign: (id, data) => apiClient.patch(`/templates/${id}/unassign`, data)
};

export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  testPalantir: () => apiClient.post('/admin/palantir/test-connection')
};

export const weightMatrixAPI = {
  getAll: (page = 1, limit = 50) => apiClient.get('/weight-matrix', { params: { page, limit } }),
  search: (query) => apiClient.get('/weight-matrix/search', { params: { q: query } }),
  lookup: (packageSize) => apiClient.get(`/weight-matrix/lookup/${encodeURIComponent(packageSize)}`),
  create: (data) => apiClient.post('/weight-matrix', data),
  update: (id, data) => apiClient.put(`/weight-matrix/${id}`, data),
  delete: (id) => apiClient.delete(`/weight-matrix/${id}`)
};

export const plantCodeAPI = {
  getAll: () => apiClient.get('/plant-codes'),
  getActive: () => apiClient.get('/plant-codes/active'),
  getMetadata: () => apiClient.get('/plant-codes/metadata'),
  create: (data) => apiClient.post('/plant-codes', data),
  update: (id, data) => apiClient.put(`/plant-codes/${id}`, data),
  delete: (id) => apiClient.delete(`/plant-codes/${id}`),
  rebuild: () => apiClient.post('/plant-codes/rebuild')
};

export const businessLineAPI = {
  getAll: () => apiClient.get('/business-lines'),
  getActive: () => apiClient.get('/business-lines/active'),
  getMetadata: () => apiClient.get('/business-lines/metadata'),
  create: (data) => apiClient.post('/business-lines', data),
  update: (id, data) => apiClient.put(`/business-lines/${id}`, data),
  delete: (id) => apiClient.delete(`/business-lines/${id}`),
  rebuild: () => apiClient.post('/business-lines/rebuild')
};

export const parserConfigAPI = {
  // Get all configurations (testAttribute, testMethod, defaultMethod)
  getAll: () => apiClient.get('/parser-config'),

  // Get configuration by type
  getByType: (configType) => apiClient.get(`/parser-config/${configType}`),

  // Get version info (for cache invalidation)
  getVersion: () => apiClient.get('/parser-config/version'),

  // Add or update an entry
  upsertEntry: (configType, data) => apiClient.post(`/parser-config/${configType}/entry`, data),

  // Delete an entry
  deleteEntry: (configType, key) => apiClient.delete(`/parser-config/${configType}/entry/${encodeURIComponent(key)}`),

  // Bulk import
  bulkImport: (configType, entries, replaceAll = false) =>
    apiClient.post(`/parser-config/${configType}/bulk`, { entries, replaceAll }),

  // Export configuration
  exportConfig: (configType, format = 'json') =>
    apiClient.get(`/parser-config/${configType}/export`, { params: { format }, responseType: format === 'csv' ? 'blob' : 'json' }),

  // Reset to defaults
  resetToDefaults: (configType) => apiClient.post(`/parser-config/${configType}/reset`),

  // Search entries
  search: (configType, query, category = null) =>
    apiClient.get(`/parser-config/${configType}/search`, { params: { q: query, category } })
};

// Default export for convenience
export default apiClient;