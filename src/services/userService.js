import api from './api';

const normalizeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.profiles)) return payload.profiles;
  return [];
};

const mapByUserId = (profiles = []) =>
  profiles.reduce((acc, profile) => {
    const userId = profile?.userId ?? profile?.id;
    if (userId != null) {
      acc[userId] = profile;
      acc[String(userId)] = profile;
    }
    return acc;
  }, {});

let profileCache = {};

const userService = {
  getById: async (userId) => {
    const id = Number(userId);
    if (profileCache[id]) return profileCache[id];
    
    const response = await api.get(`/auth/profile/${id}`);
    const data = response.data?.data || response.data || null;
    if (data) profileCache[id] = data;
    return data;
  },

  getBulkProfiles: async (userIds = []) => {
    const ids = [...new Set(userIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
    const missingIds = ids.filter((id) => !profileCache[id]);

    if (missingIds.length > 0) {
      const params = new URLSearchParams();
      missingIds.forEach((id) => params.append('userIds', id));

      const response = await api.get(`/auth/profile/bulk?${params.toString()}`);
      const fetched = mapByUserId(normalizeArray(response.data));
      profileCache = { ...profileCache, ...fetched };
    }

    return ids.reduce((acc, id) => {
      if (profileCache[id]) {
        acc[id] = profileCache[id];
        acc[String(id)] = profileCache[id];
      }
      return acc;
    }, {});
  },

  getAllAdminUsers: async () => {
    const response = await api.get('/api/v1/admin/users/all');
    return normalizeArray(response.data);
  },
};

export default userService;
