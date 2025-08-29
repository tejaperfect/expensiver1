import { api } from './api'

export const analyticsService = {
  // Dashboard analytics
  async getDashboardAnalytics(period = '30d') {
    try {
      const response = await api.get(`/analytics/dashboard?period=${period}`)
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error)
      throw error
    }
  },

  // Spending patterns
  async getSpendingPatterns(params = {}) {
    try {
      const queryParams = new URLSearchParams(params)
      const response = await api.get(`/analytics/spending-patterns?${queryParams.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching spending patterns:', error)
      throw error
    }
  },

  async getCategorySpending(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/category-spending?${queryParams.toString()}`)
    return response.data
  },

  async getMonthlyTrends(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/monthly-trends?${queryParams.toString()}`)
    return response.data
  },

  async getDailySpending(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/daily-spending?${queryParams.toString()}`)
    return response.data
  },

  // Budget analysis
  async getBudgetAnalysis(period = '30d') {
    try {
      const response = await api.get(`/analytics/budget-analysis?period=${period}`)
      return response.data
    } catch (error) {
      console.error('Error fetching budget analysis:', error)
      throw error
    }
  },

  async getBudgetPerformance() {
    const response = await api.get('/analytics/budget-performance')
    return response.data
  },

  async getBudgetAlerts() {
    const response = await api.get('/analytics/budget-alerts')
    return response.data
  },

  // Group analytics
  async getGroupAnalytics(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/groups?${queryParams.toString()}`)
    return response.data
  },

  async getGroupComparison(groupIds, period = '30d') {
    const response = await api.post('/analytics/group-comparison', {
      groupIds,
      period
    })
    return response.data
  },

  // Financial reports
  async getFinancialReport(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/financial-report?${queryParams.toString()}`)
    return response.data
  },

  async getIncomeVsExpenses(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/income-vs-expenses?${queryParams.toString()}`)
    return response.data
  },

  async getCashFlow(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/cash-flow?${queryParams.toString()}`)
    return response.data
  },

  // Expense insights
  async getExpenseInsights(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/expense-insights?${queryParams.toString()}`)
    return response.data
  },

  async getAnomalies(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/anomalies?${queryParams.toString()}`)
    return response.data
  },

  async getPredictions(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/predictions?${queryParams.toString()}`)
    return response.data
  },

  // Savings analysis
  async getSavingsAnalysis(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/savings?${queryParams.toString()}`)
    return response.data
  },

  async getSavingsGoals() {
    const response = await api.get('/analytics/savings-goals')
    return response.data
  },

  async updateSavingsGoal(goalId, goalData) {
    const response = await api.put(`/analytics/savings-goals/${goalId}`, goalData)
    return response.data
  },

  // Custom reports
  async createCustomReport(reportData) {
    const response = await api.post('/analytics/custom-reports', reportData)
    return response.data
  },

  async getCustomReports() {
    const response = await api.get('/analytics/custom-reports')
    return response.data
  },

  async updateCustomReport(reportId, reportData) {
    const response = await api.put(`/analytics/custom-reports/${reportId}`, reportData)
    return response.data
  },

  async deleteCustomReport(reportId) {
    const response = await api.delete(`/analytics/custom-reports/${reportId}`)
    return response.data
  },

  async generateCustomReport(reportId, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/custom-reports/${reportId}/generate?${queryParams.toString()}`)
    return response.data
  },

  // Export analytics
  async exportAnalytics(type, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/export/${type}?${queryParams.toString()}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${type}-analytics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  },

  // Real-time analytics
  async getRealTimeStats() {
    const response = await api.get('/analytics/real-time')
    return response.data
  },

  async getWeeklyDigest() {
    const response = await api.get('/analytics/weekly-digest')
    return response.data
  },

  async getMonthlyDigest() {
    const response = await api.get('/analytics/monthly-digest')
    return response.data
  },

  // Benchmarking
  async getBenchmarks(category = 'all') {
    const response = await api.get(`/analytics/benchmarks?category=${category}`)
    return response.data
  },

  async compareWithPeers(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/analytics/peer-comparison?${queryParams.toString()}`)
    return response.data
  },
}

export default analyticsService