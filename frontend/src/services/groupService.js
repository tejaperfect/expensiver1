import { api } from './api'

export const groupService = {
  // Get all groups for the user
  async getGroups() {
    const response = await api.get('/groups')
    return response.data
  },

  // Get a specific group by ID
  async getGroup(id) {
    const response = await api.get(`/groups/${id}`)
    return response.data
  },

  // Create a new group
  async createGroup(groupData) {
    const response = await api.post('/groups', groupData)
    return response.data
  },

  // Update group information
  async updateGroup(id, groupData) {
    const response = await api.put(`/groups/${id}`, groupData)
    return response.data
  },

  // Delete a group
  async deleteGroup(id) {
    const response = await api.delete(`/groups/${id}`)
    return response.data
  },

  // Join a group
  async joinGroup(inviteCode) {
    const response = await api.post('/groups/join', { inviteCode })
    return response.data
  },

  // Leave a group
  async leaveGroup(id) {
    const response = await api.post(`/groups/${id}/leave`)
    return response.data
  },

  // Group member management
  async getGroupMembers(id) {
    const response = await api.get(`/groups/${id}/members`)
    return response.data
  },

  async inviteToGroup(id, inviteData) {
    const response = await api.post(`/groups/${id}/invite`, inviteData)
    return response.data
  },

  async removeMember(id, memberId) {
    const response = await api.delete(`/groups/${id}/members/${memberId}`)
    return response.data
  },

  async updateMemberRole(id, memberId, role) {
    const response = await api.put(`/groups/${id}/members/${memberId}`, { role })
    return response.data
  },

  // Group expenses
  async getGroupExpenses(id, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/groups/${id}/expenses?${queryParams.toString()}`)
    return response.data
  },

  async addGroupExpense(id, expenseData) {
    const response = await api.post(`/groups/${id}/expenses`, expenseData)
    return response.data
  },

  async updateGroupExpense(id, expenseId, expenseData) {
    const response = await api.put(`/groups/${id}/expenses/${expenseId}`, expenseData)
    return response.data
  },

  async deleteGroupExpense(id, expenseId) {
    const response = await api.delete(`/groups/${id}/expenses/${expenseId}`)
    return response.data
  },

  // Group settlements
  async getGroupBalances(id) {
    const response = await api.get(`/groups/${id}/balances`)
    return response.data
  },

  async getSettlements(id) {
    const response = await api.get(`/groups/${id}/settlements`)
    return response.data
  },

  async createSettlement(id, settlementData) {
    const response = await api.post(`/groups/${id}/settlements`, settlementData)
    return response.data
  },

  async updateSettlement(id, settlementId, settlementData) {
    const response = await api.put(`/groups/${id}/settlements/${settlementId}`, settlementData)
    return response.data
  },

  async settleUp(id, memberId, amount) {
    const response = await api.post(`/groups/${id}/settle-up`, {
      memberId,
      amount
    })
    return response.data
  },

  // Group activities
  async getGroupActivities(id, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/groups/${id}/activities?${queryParams.toString()}`)
    return response.data
  },

  // Group analytics
  async getGroupAnalytics(id, period = '30d') {
    const response = await api.get(`/groups/${id}/analytics?period=${period}`)
    return response.data
  },

  async getGroupSpendingPatterns(id, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/groups/${id}/spending-patterns?${queryParams.toString()}`)
    return response.data
  },

  // Group settings
  async updateGroupSettings(id, settings) {
    const response = await api.put(`/groups/${id}/settings`, settings)
    return response.data
  },

  async getGroupSettings(id) {
    const response = await api.get(`/groups/${id}/settings`)
    return response.data
  },

  // Group invitations
  async getGroupInvitations() {
    const response = await api.get('/groups/invitations')
    return response.data
  },

  async respondToInvitation(invitationId, response) {
    const res = await api.post(`/groups/invitations/${invitationId}/respond`, {
      response
    })
    return res.data
  },

  async cancelInvitation(invitationId) {
    const response = await api.delete(`/groups/invitations/${invitationId}`)
    return response.data
  },

  // Group search and discovery
  async searchGroups(query) {
    const response = await api.get(`/groups/search?q=${encodeURIComponent(query)}`)
    return response.data
  },

  async getPublicGroups() {
    const response = await api.get('/groups/public')
    return response.data
  },

  // Group export
  async exportGroupData(id, format = 'csv') {
    const response = await api.get(`/groups/${id}/export?format=${format}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `group-${id}-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  },
}

export default groupService