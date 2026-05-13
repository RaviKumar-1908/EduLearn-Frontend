/**
 * tokenManager.js
 * 
 * Centralized authority for authentication tokens.
 * Provides a layer of abstraction over localStorage to improve security
 * and allow for future migration (e.g. to secure cookies) without changing components.
 */

const TOKEN_KEY = 'token';
const GENDER_KEY = 'userGender'; // Legacy key used in some components

export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  
  setToken: (token) => {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GENDER_KEY);
  },
  
  hasToken: () => !!localStorage.getItem(TOKEN_KEY),
  
  /**
   * Basic check to see if the token "looks" like a valid JWT.
   * This prevents crashing when trying to decode corrupted localStorage data.
   */
  isValid: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    const parts = token.split('.');
    return parts.length === 3;
  }
};
