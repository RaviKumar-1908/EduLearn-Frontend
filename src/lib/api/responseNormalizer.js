/**
 * responseNormalizer.js
 * 
 * Centralized logic to handle inconsistent backend response shapes.
 * This layer ensures that frontend components always receive a predictable structure
 * regardless of whether the backend returns a raw array, a wrapped object, or a paginated response.
 */

/**
 * Extracts a collection (array) from various backend response shapes.
 * Handles: [] | { data: [] } | { content: [] } | { items: [] } | { payload: [] }
 * 
 * @param {any} payload - The raw response data from axios
 * @param {string[]} candidateKeys - Optional keys to check specifically for this endpoint
 * @returns {Array} - Always returns an array
 */
export const extractCollection = (payload, candidateKeys = []) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  // Check custom candidate keys provided by the service
  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  // Check common Spring and generic patterns
  if (Array.isArray(payload.content)) return payload.content; // Spring Page object
  if (Array.isArray(payload.data)) return payload.data;       // Generic wrapper
  if (Array.isArray(payload.items)) return payload.items;     // API items wrapper
  if (Array.isArray(payload.payload)) return payload.payload; // Payload wrapper
  if (Array.isArray(payload.results)) return payload.results; // Search results wrapper

  return [];
};

/**
 * Extracts a single object payload from various wrappers.
 * Handles: { data: {} } | { payload: {} } | {}
 * 
 * @param {any} payload - The raw response data
 * @returns {any} - The unwrapped payload or the payload itself
 */
export const extractPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  
  // If it's an Axios response object, always unwrap the 'data' field
  if (payload.config && payload.headers && 'data' in payload) {
    return payload.data;
  }
  
  if ('data' in payload && !Array.isArray(payload.data)) return payload.data;
  if ('payload' in payload && !Array.isArray(payload.payload)) return payload.payload;
  
  return payload;
};

/**
 * Normalizes paginated responses into a consistent frontend format.
 * 
 * @param {any} payload - Raw response
 * @returns {Object} - { items: Array, total: number, page: number, size: number, totalPages: number }
 */
export const normalizePagination = (payload) => {
  const items = extractCollection(payload);
  
  return {
    items,
    total: payload.totalElements ?? payload.total ?? items.length,
    page: payload.number ?? payload.page ?? 0,
    size: payload.size ?? payload.pageSize ?? items.length,
    totalPages: payload.totalPages ?? 1,
    hasMore: !(payload.last ?? (payload.page >= payload.totalPages - 1))
  };
};
