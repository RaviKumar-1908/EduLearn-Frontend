import api from '../services/api';
import { clearAuth, getAuthUser } from './auth';

export async function fetchCurrentUserProfile() {
  const authUser = getAuthUser();
  const userId = authUser?.userId || authUser?.id;

  if (!authUser || !userId) {
    return { authUser: null, profile: null, isActive: false };
  }

  const response = await api.get(`/auth/profile/${userId}`);
  const profile = response.data || null;
  const isActive = profile?.active !== false;

  return { authUser, profile, isActive };
}

export async function enforceActiveSession() {
  const { authUser, profile, isActive } = await fetchCurrentUserProfile();

  if (!authUser) {
    return { allowed: false, reason: 'no-auth', profile: null };
  }

  if (!isActive) {
    clearAuth();
    return { allowed: false, reason: 'suspended', profile };
  }

  return { allowed: true, reason: null, profile };
}
