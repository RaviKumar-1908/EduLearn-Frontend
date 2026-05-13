import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getAuthUser } from '../utils/auth';
import api from '../services/api';

const UserContext = createContext();

const PROFILE_CACHE_KEY = 'lms_profile_cache';

const getCachedProfile = (userId) => {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const { id, data } = JSON.parse(raw);
    return id === userId ? data : null;
  } catch { return null; }
};

const setCachedProfile = (userId, data) => {
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ id: userId, data }));
  } catch {}
};

const clearCachedProfile = () => {
  try { sessionStorage.removeItem(PROFILE_CACHE_KEY); } catch {}
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => getAuthUser());
  const [profile, setProfile] = useState(() => {
    // Hydrate from cache on first render — zero network cost
    const authUser = getAuthUser();
    return authUser?.userId ? getCachedProfile(authUser.userId) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return;

    // Serve from cache if available — no network request
    const cached = getCachedProfile(userId);
    if (cached) {
      setProfile(cached);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/auth/profile/${userId}`);
      setProfile(response.data);
      setCachedProfile(userId, response.data);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const authUser = getAuthUser();
    setUser(authUser);
    if (authUser?.userId) {
      fetchProfile(authUser.userId);
    } else {
      setProfile(null);
    }
  }, [fetchProfile]);

  const refreshUser = useCallback(() => {
    const authUser = getAuthUser();
    setUser(authUser);
    if (authUser?.userId) {
      fetchProfile(authUser.userId);
    } else {
      setProfile(null);
      clearCachedProfile();
    }
  }, [fetchProfile]);

  // Allow explicit profile update (e.g. after profile edit) and refresh cache
  const updateProfile = useCallback((newProfile) => {
    setProfile(newProfile);
    const authUser = getAuthUser();
    if (authUser?.userId) setCachedProfile(authUser.userId, newProfile);
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    error,
    refreshUser,
    setProfile: updateProfile,
  }), [user, profile, loading, error, refreshUser, updateProfile]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
