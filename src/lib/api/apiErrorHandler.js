/**
 * apiErrorHandler.js
 * 
 * Centralized error normalization for the API client.
 */

export const normalizeApiError = (error) => {
  if (!error.response) {
    return {
      message: 'Network error. Please check your internet connection.',
      status: 0,
      code: 'NETWORK_ERROR',
      isNetworkError: true
    };
  }

  const { status, data } = error.response;
  
  return {
    message: data?.message || data?.error || 'An unexpected error occurred.',
    status,
    code: data?.code || `HTTP_${status}`,
    errors: data?.errors || null, // For validation errors
    originalError: error
  };
};
