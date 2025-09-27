import axios from 'axios';
import Cookies from 'js-cookie';
import { config } from './environment';

// Use configuration from environment.ts
export const API_BASE_URL = config.apiBaseUrl;
export const NODE_ENV = config.nodeEnv;
export const API_TIMEOUT = config.timeout;

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
