import api from './api';

const discussionService = {
    // Thread Endpoints
    createThread: (threadData) => api.post('/api/threads', threadData),
    getThreadsByCourse: (courseId, page = 0, size = 10) => api.get(`/api/threads/course/${courseId}?page=${page}&size=${size}`),
    getThreadsByCourses: (courseIds, page = 0, size = 10) => api.get(`/api/threads/courses?ids=${courseIds.join(',')}&page=${page}&size=${size}`),
    getThreadsByLesson: (lessonId, page = 0, size = 10) => api.get(`/api/threads/lesson/${lessonId}?page=${page}&size=${size}`),
    pinThread: (threadId) => api.put(`/api/threads/${threadId}/pin`),
    closeThread: (threadId) => api.put(`/api/threads/${threadId}/close`),
    deleteThread: (threadId) => api.delete(`/api/threads/${threadId}`),

    // Reply Endpoints
    postReply: (threadId, replyData) => api.post(`/api/threads/${threadId}/replies`, replyData),
    getReplies: (threadId, page = 0, size = 20) => api.get(`/api/threads/${threadId}/replies?page=${page}&size=${size}`),
    upvoteReply: (replyId, userId) => api.put(`/api/replies/${replyId}/upvote?userId=${userId}`),
    upvoteThread: (threadId, userId) => api.put(`/api/threads/${threadId}/upvote?userId=${userId}`),
    acceptReply: (replyId) => api.put(`/api/replies/${replyId}/accept`),
    deleteReply: (replyId) => api.delete(`/api/replies/${replyId}`),

    // Helper to handle both Paginated (Page.content) and non-paginated results
    normalizeArray: (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (data.content && Array.isArray(data.content)) return data.content;
        return data.data && Array.isArray(data.data) ? data.data : [];
    }
};

export default discussionService;
