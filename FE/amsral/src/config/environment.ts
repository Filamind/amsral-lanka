/**
 * Environment Configuration
 * Handles different environments (development, production, staging)
 */

// Environment detection
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// Get environment variables
const envApiUrl = import.meta.env.VITE_API_BASE_URL;
const envNodeEnv = import.meta.env.VITE_NODE_ENV;
const envTimeout = import.meta.env.VITE_API_TIMEOUT;

// API Configuration based on environment
export const getApiConfig = () => {
  let apiBaseUrl: string;
  let nodeEnv: string;
  let timeout: number;

  if (isProduction) {
    // Production configuration
 
    apiBaseUrl = envApiUrl || "https://amsral-lanka-be.vercel.app/api";
    nodeEnv = envNodeEnv || 'production';
    timeout = Number(envTimeout) || 15000;
  } else {
    // Development configuration
    apiBaseUrl = envApiUrl || "http://localhost:3000/api";
    nodeEnv = envNodeEnv || 'development';
    timeout = Number(envTimeout) || 10000;
  }

  return {
    apiBaseUrl,
    nodeEnv,
    timeout,
    isProduction,
    isDevelopment
  };
};

// Export configuration
export const config = getApiConfig();

// Debug logging
console.log('🔧 Environment Configuration:', {
  apiBaseUrl: config.apiBaseUrl,
  nodeEnv: config.nodeEnv,
  timeout: config.timeout,
  isProduction: config.isProduction,
  isDevelopment: config.isDevelopment,
  envVarUsed: !!envApiUrl
});
