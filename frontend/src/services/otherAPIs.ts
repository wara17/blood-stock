import { createAuthenticatedAPI } from './authInterceptors';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with shared auth interceptors
const api = createAuthenticatedAPI(API_BASE_URL);

// Example: Future API services can use the same pattern
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  }
};

export const reportsAPI = {
  // Get blood inventory statistics
  getStatistics: async () => {
    const response = await api.get('/reports/statistics');
    return response.data;
  },

  // Get blood usage report
  getUsageReport: async (params: any) => {
    const response = await api.get('/reports/usage', { params });
    return response.data;
  }
};

// All APIs using createAuthenticatedAPI will automatically have:
// - Request interceptor that adds Authorization header
// - Response interceptor that handles 401 errors
// - Automatic redirect to login on auth failure
// - Event dispatching for auth failures

export default api;