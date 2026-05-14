import axios from 'axios';
import env from '../config/env';
import { normalizeApiError } from '../lib/api/apiErrorHandler';

/**
 * PRODUCTION-GRADE API CLIENT
 * 
 * Centralized axios instance with:
 * - Environment-aware base URL
 * - Automatic token injection
 * - Resilient error handling
 * - 401 Session management
 * - Timeout enforcement
 */

const api = axios.create({
  baseURL: env.API_URL,
  timeout: env.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Auth Token Injection
api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    // Public lesson endpoints should NOT send token
    const isPublicLessonRequest =
      config.url?.includes('/api/lesson/course/') &&
      config.method?.toLowerCase() === 'get';

    if (token && !isPublicLessonRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Support for request cancellation if needed
    if (config.cancelTokenSource) {
      config.cancelToken = config.cancelTokenSource.token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Handling & Resiliency
api.interceptors.response.use(
  (response) => response,
  (error) => {

    const normalizedError = normalizeApiError(error);

    // Logging for developers
    if (env.IS_DEV && !error.config?.skipGlobalErrorLog) {
      console.group('🌐 API Error Context');
      console.error('URL:', error.config?.url);
      console.error('Status:', normalizedError.status);
      console.error('Message:', normalizedError.message);

      if (normalizedError.errors) {
        console.error('Validation Errors:', normalizedError.errors);
      }

      console.groupEnd();
    }

    // Session Management: Handle Unauthorized
    if (normalizedError.status === 401) {

      // Clear sensitive auth data on session expiry
      localStorage.removeItem('token');
      localStorage.removeItem('userGender');

      // Redirect to login only if we're not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }

    // Attach normalized error to the error object for downstream use
    error.normalized = normalizedError;

    return Promise.reject(error);
  }
);

/**
 * Utility to create a cancellation source for requests.
 */
export const createCancelSource = () => axios.CancelToken.source();

export default api;