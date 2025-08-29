import { api } from './api'

export const notificationService = {
  // Get user notifications
  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/notifications?${queryParams.toString()}`)
    return response.data
  },

  // Mark notification as read
  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`)
    return response.data
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all')
    return response.data
  },

  // Delete notification
  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`)
    return response.data
  },

  // Get unread count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count')
    return response.data
  }
}

export default notificationService