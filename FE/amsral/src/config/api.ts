import axios from 'axios';
import Cookies from 'js-cookie';

// Environment variables with fallbacks
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
export const NODE_ENV = import.meta.env.VITE_NODE_ENV || 'development';
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Log environment info in development
if (NODE_ENV === 'development') {
  console.log('🌐 API Configuration:', {
    baseURL: API_BASE_URL,
    environment: NODE_ENV,
    timeout: API_TIMEOUT
  });
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT, // Configurable timeout
  withCredentials: true, // Enable credentials for cookies
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('authToken');
      Cookies.remove('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
