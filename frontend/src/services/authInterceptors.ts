import axios, { AxiosInstance } from 'axios';

// Get token from localStorage
const getToken = () => localStorage.getItem('authToken');

// Clear authentication data
const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Setup authentication interceptors for any axios instance
export const setupAuthInterceptors = (api: AxiosInstance) => {
  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.error('Authentication failed:', error.response?.data?.message);
        clearAuthData();
        
        // Dispatch a custom event to notify the app of auth failure
        window.dispatchEvent(new CustomEvent('auth-failed'));
        
        // Also redirect directly as a fallback
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            const currentPath = window.location.pathname;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }, 100);
      }
      return Promise.reject(error);
    }
  );
};

// Create a configured axios instance with auth interceptors
export const createAuthenticatedAPI = (baseURL: string) => {
  const api = axios.create({
    baseURL,
    timeout: 10000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  setupAuthInterceptors(api);
  return api;
};

export { getToken, clearAuthData };