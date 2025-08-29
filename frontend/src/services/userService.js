import { api } from './api'

export const userService = {
  // User profile management
  async getProfile() {
    const response = await api.get('/user/profile')
    return response.data
  },

  async updateProfile(profileData) {
    const response = await api.put('/user/profile', profileData)
    return response.data
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await api.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async deleteAvatar() {
    const response = await api.delete('/user/avatar')
    return response.data
  },

  // User preferences and settings
  async getSettings() {
    const response = await api.get('/user/settings')
    return response.data
  },

  async updateSettings(settings) {
    const response = await api.put('/user/settings', settings)
    return response.data
  },

  async getCurrency() {
    const response = await api.get('/user/currency')
    return response.data
  },

  async updateCurrency(currency) {
    const response = await api.put('/user/currency', { currency })
    return response.data
  },

  async getLanguage() {
    const response = await api.get('/user/language')
    return response.data
  },

  async updateLanguage(language) {
    const response = await api.put('/user/language', { language })
    return response.data
  },

  async getTimezone() {
    const response = await api.get('/user/timezone')
    return response.data
  },

  async updateTimezone(timezone) {
    const response = await api.put('/user/timezone', { timezone })
    return response.data
  },

  // Notification preferences
  async getNotificationSettings() {
    const response = await api.get('/user/notifications/settings')
    return response.data
  },

  async updateNotificationSettings(settings) {
    const response = await api.put('/user/notifications/settings', settings)
    return response.data
  },

  async getNotifications(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/user/notifications?${queryParams.toString()}`)
    return response.data
  },

  async markNotificationAsRead(notificationId) {
    const response = await api.put(`/user/notifications/${notificationId}/read`)
    return response.data
  },

  async markAllNotificationsAsRead() {
    const response = await api.put('/user/notifications/read-all')
    return response.data
  },

  async deleteNotification(notificationId) {
    const response = await api.delete(`/user/notifications/${notificationId}`)
    return response.data
  },

  async clearAllNotifications() {
    const response = await api.delete('/user/notifications')
    return response.data
  },

  // Privacy and security
  async getPrivacySettings() {
    const response = await api.get('/user/privacy')
    return response.data
  },

  async updatePrivacySettings(settings) {
    const response = await api.put('/user/privacy', settings)
    return response.data
  },

  async getSecuritySettings() {
    const response = await api.get('/user/security')
    return response.data
  },

  async updateSecuritySettings(settings) {
    const response = await api.put('/user/security', settings)
    return response.data
  },

  async getLoginHistory(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/user/security/login-history?${queryParams.toString()}`)
    return response.data
  },

  async getActiveSessions() {
    const response = await api.get('/user/security/sessions')
    return response.data
  },

  async revokeSession(sessionId) {
    const response = await api.delete(`/user/security/sessions/${sessionId}`)
    return response.data
  },

  async revokeAllSessions() {
    const response = await api.delete('/user/security/sessions')
    return response.data
  },

  // Data management
  async exportUserData(format = 'json') {
    const response = await api.get(`/user/export?format=${format}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `user-data-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  },

  async importUserData(file, format = 'json') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)
    
    const response = await api.post('/user/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async deleteUserData() {
    const response = await api.delete('/user/data')
    return response.data
  },

  // User statistics and analytics
  async getUserStats() {
    const response = await api.get('/user/stats')
    return response.data
  },

  async getUsageAnalytics(period = '30d') {
    const response = await api.get(`/user/analytics?period=${period}`)
    return response.data
  },

  async getAchievements() {
    const response = await api.get('/user/achievements')
    return response.data
  },

  async getBadges() {
    const response = await api.get('/user/badges')
    return response.data
  },

  // Connected accounts
  async getConnectedAccounts() {
    const response = await api.get('/user/connected-accounts')
    return response.data
  },

  async connectBankAccount(bankData) {
    const response = await api.post('/user/connected-accounts/bank', bankData)
    return response.data
  },

  async disconnectAccount(accountId) {
    const response = await api.delete(`/user/connected-accounts/${accountId}`)
    return response.data
  },

  async syncConnectedAccount(accountId) {
    const response = await api.post(`/user/connected-accounts/${accountId}/sync`)
    return response.data
  },

  // Subscription and billing
  async getSubscription() {
    const response = await api.get('/user/subscription')
    return response.data
  },

  async updateSubscription(plan) {
    const response = await api.put('/user/subscription', { plan })
    return response.data
  },

  async cancelSubscription() {
    const response = await api.delete('/user/subscription')
    return response.data
  },

  async getBillingHistory() {
    const response = await api.get('/user/billing/history')
    return response.data
  },

  async downloadInvoice(invoiceId) {
    const response = await api.get(`/user/billing/invoices/${invoiceId}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoiceId}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  },

  // Support and feedback
  async submitFeedback(feedback) {
    const response = await api.post('/user/feedback', feedback)
    return response.data
  },

  async createSupportTicket(ticketData) {
    const response = await api.post('/user/support/tickets', ticketData)
    return response.data
  },

  async getSupportTickets() {
    const response = await api.get('/user/support/tickets')
    return response.data
  },

  async updateSupportTicket(ticketId, update) {
    const response = await api.put(`/user/support/tickets/${ticketId}`, update)
    return response.data
  },

  async closeSupportTicket(ticketId) {
    const response = await api.delete(`/user/support/tickets/${ticketId}`)
    return response.data
  },

  // Referrals and invitations
  async getReferralCode() {
    const response = await api.get('/user/referral/code')
    return response.data
  },

  async generateReferralCode() {
    const response = await api.post('/user/referral/generate')
    return response.data
  },

  async getReferralStats() {
    const response = await api.get('/user/referral/stats')
    return response.data
  },

  async inviteFriend(email, message = '') {
    const response = await api.post('/user/invite', { email, message })
    return response.data
  },
}

export default userService