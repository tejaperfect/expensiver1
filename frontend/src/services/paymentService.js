import { api } from './api'

export const paymentService = {
  // Razorpay integration
  async createRazorpayOrder(orderData) {
    const response = await api.post('/payments/razorpay/create-order', orderData)
    return response.data
  },

  async verifyRazorpayPayment(paymentData) {
    const response = await api.post('/payments/razorpay/verify', paymentData)
    return response.data
  },

  async getRazorpayKey() {
    const response = await api.get('/payments/razorpay/key')
    return response.data
  },

  // UPI integration
  async generateUPIQR(paymentData) {
    const response = await api.post('/payments/upi/generate-qr', paymentData)
    return response.data
  },

  async createUPIPaymentLink(paymentData) {
    const response = await api.post('/payments/upi/create-link', paymentData)
    return response.data
  },

  async verifyUPIPayment(transactionId) {
    const response = await api.post('/payments/upi/verify', { transactionId })
    return response.data
  },

  // Payment methods management
  async getPaymentMethods(userId) {
    const response = await api.get(`/payments/methods/${userId}`)
    return response.data
  },

  async addPaymentMethod(methodData) {
    const response = await api.post('/payments/methods', methodData)
    return response.data
  },

  async updatePaymentMethod(methodId, methodData) {
    const response = await api.put(`/payments/methods/${methodId}`, methodData)
    return response.data
  },

  async deletePaymentMethod(methodId) {
    const response = await api.delete(`/payments/methods/${methodId}`)
    return response.data
  },

  async setDefaultPaymentMethod(methodId) {
    const response = await api.put(`/payments/methods/${methodId}/default`)
    return response.data
  },

  // Group payments
  async createGroupPayment(groupId, paymentData) {
    const response = await api.post(`/payments/groups/${groupId}/create`, paymentData)
    return response.data
  },

  async settleGroupExpense(groupId, expenseId, paymentData) {
    const response = await api.post(`/payments/groups/${groupId}/expenses/${expenseId}/settle`, paymentData)
    return response.data
  },

  async getGroupPaymentHistory(groupId, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/payments/groups/${groupId}/history?${queryParams.toString()}`)
    return response.data
  },

  // Individual payments
  async makePayment(paymentData) {
    const response = await api.post('/payments/make-payment', paymentData)
    return response.data
  },

  async getPaymentHistory(userId, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/payments/history/${userId}?${queryParams.toString()}`)
    return response.data
  },

  // Payment status and tracking
  async getPaymentStatus(paymentId) {
    const response = await api.get(`/payments/status/${paymentId}`)
    return response.data
  },

  async cancelPayment(paymentId, reason = '') {
    const response = await api.post(`/payments/${paymentId}/cancel`, { reason })
    return response.data
  },

  async refundPayment(paymentId, refundData) {
    const response = await api.post(`/payments/${paymentId}/refund`, refundData)
    return response.data
  },

  // Wallet integration
  async getWalletBalance(userId) {
    const response = await api.get(`/payments/wallet/${userId}/balance`)
    return response.data
  },

  async addMoneyToWallet(userId, amount, paymentMethod) {
    const response = await api.post(`/payments/wallet/${userId}/add-money`, {
      amount,
      paymentMethod
    })
    return response.data
  },

  async withdrawFromWallet(userId, amount, withdrawalMethod) {
    const response = await api.post(`/payments/wallet/${userId}/withdraw`, {
      amount,
      withdrawalMethod
    })
    return response.data
  },

  async getWalletTransactions(userId, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/payments/wallet/${userId}/transactions?${queryParams.toString()}`)
    return response.data
  },

  // Payment analytics
  async getPaymentAnalytics(userId, period = '30d') {
    const response = await api.get(`/payments/analytics/${userId}?period=${period}`)
    return response.data
  },

  async getSpendingByMethod(userId, period = '30d') {
    const response = await api.get(`/payments/analytics/${userId}/by-method?period=${period}`)
    return response.data
  },

  // Split payments
  async createSplitPayment(splitData) {
    const response = await api.post('/payments/split/create', splitData)
    return response.data
  },

  async acceptSplitPayment(splitId, acceptanceData) {
    const response = await api.post(`/payments/split/${splitId}/accept`, acceptanceData)
    return response.data
  },

  async rejectSplitPayment(splitId, reason = '') {
    const response = await api.post(`/payments/split/${splitId}/reject`, { reason })
    return response.data
  },

  async getSplitPayments(userId, status = 'all') {
    const response = await api.get(`/payments/split/${userId}?status=${status}`)
    return response.data
  },

  // Recurring payments
  async createRecurringPayment(recurringData) {
    const response = await api.post('/payments/recurring/create', recurringData)
    return response.data
  },

  async updateRecurringPayment(recurringId, updates) {
    const response = await api.put(`/payments/recurring/${recurringId}`, updates)
    return response.data
  },

  async cancelRecurringPayment(recurringId) {
    const response = await api.delete(`/payments/recurring/${recurringId}`)
    return response.data
  },

  async getRecurringPayments(userId) {
    const response = await api.get(`/payments/recurring/${userId}`)
    return response.data
  },

  // Payment utilities
  formatAmount(amount, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  },

  validateUPIId(upiId) {
    const upiRegex = /^[\w.-]+@[\w.-]+$/
    return upiRegex.test(upiId)
  },

  generateTransactionId() {
    return 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  },

  async downloadPaymentReceipt(paymentId) {
    const response = await api.get(`/payments/${paymentId}/receipt`, {
      responseType: 'blob',
    })
    
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment-receipt-${paymentId}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  }
}

export default paymentService