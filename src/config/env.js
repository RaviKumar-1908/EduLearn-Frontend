/**
 * Environment configuration validator and provider.
 * Ensures the app doesn't crash due to missing required environment variables.
 */

const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  TIMEOUT: parseInt(import.meta.env.VITE_TIMEOUT || '15000', 10),
  ENV: import.meta.env.VITE_ENVIRONMENT || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
};

// Validate critical variables
if (!env.API_URL) {
  console.error('❌ CRITICAL: VITE_API_URL is not defined in environment variables.');
}

export default env;
