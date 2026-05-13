import api from './api';

const normalizeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.courses)) return payload.courses;
  return [];
};

const courseService = {
  getAll: async () => {
    const response = await api.get('/api/course');
    return normalizeArray(response.data);
  },
  getAllPublished: () => api.get('/api/course/published'),
  getFeatured: async () => {
    const response = await api.get('/api/course/featured');
    return normalizeArray(response.data);
  },
  getById: (id) => api.get(`/api/course/${id}`),
  getBulk: async (ids = []) => {
    const uniqueIds = [...new Set(ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];
    if (uniqueIds.length === 0) return [];
    const params = new URLSearchParams();
    uniqueIds.forEach((id) => params.append('ids', id));
    const response = await api.get(`/api/course/bulk?${params.toString()}`);
    return normalizeArray(response.data);
  },
  getInstructorCourses: async (instructorId) => {
    const response = await api.get(`/api/course/instructor/${Number(instructorId)}`);
    return normalizeArray(response.data);
  },
  search: (keyword) => api.get(`/api/course/search?keyword=${keyword}`),
  getByCategory: (category) => api.get(`/api/course/category/${category}`),
  getByPrice: (maxPrice) => api.get(`/api/course/price?maxPrice=${maxPrice}`),
  getCategories: async () => {
    // Try to fetch from a dedicated endpoint first if it exists in the future
    // For now, we fetch all published courses and extract unique categories
    try {
      const response = await api.get('/api/course/published');
      const courses = normalizeArray(response.data);
      const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
      return categories.sort();
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }
};

export default courseService;
