import axios from 'axios';
import { setupAuthInterceptors } from './authInterceptors';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management (keeping existing functions for backward compatibility)
const getToken = () => localStorage.getItem('authToken'); // Updated to match authInterceptors
const getRefreshToken = () => localStorage.getItem('refreshToken');
const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('authToken', accessToken); // Updated to match authInterceptors
  localStorage.setItem('refreshToken', refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem('authToken'); // Updated to match authInterceptors
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Setup shared auth interceptors
setupAuthInterceptors(api);

// Auth API functions
export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  register: async (userData: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  refreshToken: async () => {
    const refreshToken = getRefreshToken();
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export { api, getToken, getRefreshToken, setTokens, clearTokens };