import api from './api';

const notificationService = {
  // Get all notifications for a user
  getUserNotifications: () => api.get('/api/notification/my'),
  
  // Get unread count
  getUnreadCount: () => api.get('/api/notification/my/unread-count'),
  
  // Mark as read
  markAsRead: (notificationId) => api.put(`/api/notification/${notificationId}/read`),
  
  // Mark all as read
  markAllAsRead: () => api.put('/api/notification/my/read-all'),
  
  // Delete notification
  deleteNotification: (notificationId) => api.delete(`/api/notification/${notificationId}`),
  
  // Delete all notifications for the current user
  deleteAllNotifications: () => api.delete('/api/notification/my'),
  
  // Send single notification (convenience method for frontend-triggered notifications)
  sendNotification: (data) => api.post('/api/notification/send', {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
        targetEmail: data.targetEmail
    }),
    
    // Send bulk notification
    sendBulkNotification: (data) => api.post('/api/notification/bulk', {
        userIds: data.userIds,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType
    }),
    
    // Get all notifications (Admin only)
    getAllNotifications: () => api.get('/api/notification/all')
};

export default notificationService;
