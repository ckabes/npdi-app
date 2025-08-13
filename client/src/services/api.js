import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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

export const authAPI = {
  login: (data) => apiClient.post('/auth/login', data),
  register: (data) => apiClient.post('/auth/register', data),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data)
};