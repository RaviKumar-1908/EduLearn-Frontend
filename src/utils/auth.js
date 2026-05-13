import { tokenManager } from '../lib/auth/tokenManager';

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

export function parseJwt(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(decodeBase64Url(payload));
    return decoded;
  } catch (err) {
    console.error("JWT Parse Error:", err);
    return null;
  }
}

let memoizedUser = null;
let lastToken = null;

export function getAuthUser() {
  const token = tokenManager.getToken();
  
  if (!token) {
    memoizedUser = null;
    lastToken = null;
    return null;
  }

  if (token === lastToken && memoizedUser) {
    return memoizedUser;
  }

  const payload = parseJwt(token);
  if (!payload) {
    tokenManager.clear();
    memoizedUser = null;
    lastToken = null;
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    tokenManager.clear();
    memoizedUser = null;
    lastToken = null;
    return null;
  }

  let userRole = payload.role;
  if (Array.isArray(userRole)) userRole = userRole[0];
  if (typeof userRole === 'string' && userRole.startsWith('ROLE_')) {
    userRole = userRole.substring(5);
  }

  memoizedUser = {
    token,
    email: payload.sub,
    role: userRole || 'STUDENT',
    userId: payload.userId ?? null,
    fullName: payload.fullName ?? null,
    profilePicUrl: payload.profilePicUrl ?? null,
    gender: payload.gender ?? null,
  };
  lastToken = token;

  return memoizedUser;
}

export function clearAuth() {
  tokenManager.clear();
  sessionStorage.clear();
  memoizedUser = null;
  lastToken = null;
}