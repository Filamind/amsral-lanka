import axios from 'axios';
import Cookies from 'js-cookie';

// Debug: Log all environment variables
console.log('🔍 Environment Variables Debug:', {
  'import.meta.env': import.meta.env,
  'VITE_API_BASE_URL': import.meta.env.VITE_API_BASE_URL,
  'VITE_NODE_ENV': import.meta.env.VITE_NODE_ENV,
  'VITE_API_TIMEOUT': import.meta.env.VITE_API_TIMEOUT,
  'import.meta.env.MODE': import.meta.env.MODE,
  'import.meta.env.DEV': import.meta.env.DEV,
  'import.meta.env.PROD': import.meta.env.PROD
});

// Check if we're in production mode
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Environment variables with fallbacks
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const envNodeEnv = import.meta.env.VITE_NODE_ENV;
const envTimeout = import.meta.env.VITE_API_TIMEOUT;

// Determine the API URL based on environment


export const API_BASE_URL = "http://localhost:3000/api";
export const NODE_ENV = envNodeEnv || (isProduction ? 'production' : 'development');
export const API_TIMEOUT = Number(envTimeout) || 10000;

// Always log environment info for debugging
console.log('🌐 Final API Configuration:', {
  baseURL: API_BASE_URL,
  environment: NODE_ENV,
  timeout: API_TIMEOUT,
  isProduction,
  isDevelopment,
  isUsingEnvVar: !!envApiUrl,
  envVarValue: envApiUrl,
  fallbackReason: envApiUrl ? 'Using env var' : (isProduction ? 'Production fallback' : 'Development fallback')
});

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
