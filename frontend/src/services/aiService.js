import { api } from './api'

export const aiService = {
  // Expense categorization
  async categorizeExpense(expenseData) {
    const response = await api.post('/ai/categorize', expenseData)
    return response.data
  },

  async bulkCategorizeExpenses(expenses) {
    const response = await api.post('/ai/categorize/bulk', { expenses })
    return response.data
  },

  async improveCategorizationModel(feedback) {
    const response = await api.post('/ai/categorize/feedback', feedback)
    return response.data
  },

  // AI insights and recommendations
  async getPersonalInsights(period = '30d') {
    const response = await api.get(`/ai/insights/personal?period=${period}`)
    return response.data
  },

  async getSpendingInsights(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/ai/insights/spending?${queryParams.toString()}`)
    return response.data
  },

  async getBudgetRecommendations() {
    const response = await api.get('/ai/insights/budget-recommendations')
    return response.data
  },

  async getSavingsRecommendations() {
    const response = await api.get('/ai/insights/savings-recommendations')
    return response.data
  },

  async getInvestmentSuggestions(riskProfile = 'moderate') {
    const response = await api.get(`/ai/insights/investment-suggestions?riskProfile=${riskProfile}`)
    return response.data
  },

  // Predictive analytics
  async predictNextMonthSpending() {
    const response = await api.get('/ai/predictions/next-month-spending')
    return response.data
  },

  async predictBudgetOverrun(budgetId) {
    const response = await api.get(`/ai/predictions/budget-overrun/${budgetId}`)
    return response.data
  },

  async predictOptimalSavings() {
    const response = await api.get('/ai/predictions/optimal-savings')
    return response.data
  },

  async predictCashFlow(months = 3) {
    const response = await api.get(`/ai/predictions/cash-flow?months=${months}`)
    return response.data
  },

  // Expense analysis
  async analyzeSpendingPatterns() {
    const response = await api.get('/ai/analysis/spending-patterns')
    return response.data
  },

  async detectAnomalies(period = '30d') {
    const response = await api.get(`/ai/analysis/anomalies?period=${period}`)
    return response.data
  },

  async analyzeCategoryTrends(category, period = '90d') {
    const response = await api.get(`/ai/analysis/category-trends?category=${category}&period=${period}`)
    return response.data
  },

  async compareSpendingBehavior(comparisonType = 'peer', params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/ai/analysis/spending-comparison?type=${comparisonType}&${queryParams.toString()}`)
    return response.data
  },

  // Smart suggestions
  async getSmartExpenseSuggestions(context = {}) {
    const response = await api.post('/ai/suggestions/expenses', context)
    return response.data
  },

  async getRecurringExpenseSuggestions() {
    const response = await api.get('/ai/suggestions/recurring-expenses')
    return response.data
  },

  async getBudgetOptimizationSuggestions() {
    const response = await api.get('/ai/suggestions/budget-optimization')
    return response.data
  },

  async getDebtReductionSuggestions() {
    const response = await api.get('/ai/suggestions/debt-reduction')
    return response.data
  },

  // Financial health assessment
  async getFinancialHealthScore() {
    const response = await api.get('/ai/health/score')
    return response.data
  },

  async getDetailedHealthAnalysis() {
    const response = await api.get('/ai/health/detailed-analysis')
    return response.data
  },

  async getHealthImprovementPlan() {
    const response = await api.get('/ai/health/improvement-plan')
    return response.data
  },

  async updateRiskProfile(riskData) {
    const response = await api.put('/ai/profile/risk', riskData)
    return response.data
  },

  // AI chat and assistance
  async askFinancialQuestion(question, context = {}) {
    const response = await api.post('/ai/chat/ask', {
      question,
      context
    })
    return response.data
  },

  async getChatHistory(limit = 50) {
    const response = await api.get(`/ai/chat/history?limit=${limit}`)
    return response.data
  },

  async clearChatHistory() {
    const response = await api.delete('/ai/chat/history')
    return response.data
  },

  async provideFeedback(messageId, feedback) {
    const response = await api.post(`/ai/chat/feedback/${messageId}`, feedback)
    return response.data
  },

  // Receipt processing
  async processReceipt(receiptFile) {
    const formData = new FormData()
    formData.append('receipt', receiptFile)
    
    const response = await api.post('/ai/receipt/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async extractReceiptData(receiptId) {
    const response = await api.get(`/ai/receipt/extract/${receiptId}`)
    return response.data
  },

  async validateReceiptData(receiptId, validatedData) {
    const response = await api.post(`/ai/receipt/validate/${receiptId}`, validatedData)
    return response.data
  },

  // Goal tracking and recommendations
  async setFinancialGoals(goals) {
    const response = await api.post('/ai/goals/set', goals)
    return response.data
  },

  async getGoalProgress() {
    const response = await api.get('/ai/goals/progress')
    return response.data
  },

  async getGoalRecommendations() {
    const response = await api.get('/ai/goals/recommendations')
    return response.data
  },

  async updateGoalStrategy(goalId, strategy) {
    const response = await api.put(`/ai/goals/${goalId}/strategy`, strategy)
    return response.data
  },

  // Smart notifications
  async getSmartNotifications() {
    const response = await api.get('/ai/notifications/smart')
    return response.data
  },

  async updateNotificationPreferences(preferences) {
    const response = await api.put('/ai/notifications/preferences', preferences)
    return response.data
  },

  async dismissNotification(notificationId) {
    const response = await api.delete(`/ai/notifications/${notificationId}`)
    return response.data
  },

  // AI model training
  async trainPersonalModel(trainingData) {
    const response = await api.post('/ai/model/train', trainingData)
    return response.data
  },

  async getModelAccuracy() {
    const response = await api.get('/ai/model/accuracy')
    return response.data
  },

  async resetPersonalModel() {
    const response = await api.delete('/ai/model/reset')
    return response.data
  },

  // Premium AI features
  async getAdvancedAnalytics() {
    const response = await api.get('/ai/premium/advanced-analytics')
    return response.data
  },

  async getPersonalizedReports() {
    const response = await api.get('/ai/premium/personalized-reports')
    return response.data
  },

  async getExpertConsultation(topic) {
    const response = await api.post('/ai/premium/expert-consultation', { topic })
    return response.data
  },
}

export default aiService