import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  // Get the current user profile from localStorage
  const savedProfileId = localStorage.getItem('selectedProfile');

  if (savedProfileId) {
    // Get profile data from localStorage cache or API
    let profileData = localStorage.getItem('currentProfileData');

    if (profileData) {
      try {
        const profile = JSON.parse(profileData);
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
    }
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
  }
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
  testSmtp: (config) => apiClient.post('/system-settings/test-smtp', config),
  testPubChem: () => apiClient.post('/system-settings/test-pubchem')
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
  getStats: () => apiClient.get('/admin/stats')
};

// Default export for convenience
export default apiClient;