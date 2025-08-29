import { api, uploadFile } from './api'

export const expenseService = {
  // Get expenses with filtering and pagination
  async getExpenses(params = {}) {
    const queryParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key])
      }
    })
    
    const response = await api.get(`/expenses?${queryParams.toString()}`)
    return response.data
  },

  // Get a specific expense by ID
  async getExpense(id) {
    const response = await api.get(`/expenses/${id}`)
    return response.data
  },

  // Create a new expense
  async createExpense(expenseData) {
    const response = await api.post('/expenses', expenseData)
    return response.data
  },

  // Update an expense
  async updateExpense(id, expenseData) {
    const response = await api.put(`/expenses/${id}`, expenseData)
    return response.data
  },

  // Delete an expense
  async deleteExpense(id) {
    const response = await api.delete(`/expenses/${id}`)
    return response.data
  },

  // Upload expense receipt
  async uploadReceipt(expenseId, file, onProgress) {
    const formData = new FormData()
    formData.append('receipt', file)
    
    const response = await api.post(`/expenses/${expenseId}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    })
    return response.data
  },

  // Delete expense receipt
  async deleteReceipt(expenseId) {
    const response = await api.delete(`/expenses/${expenseId}/receipt`)
    return response.data
  },

  // Get expense categories
  async getCategories() {
    const response = await api.get('/expenses/categories')
    return response.data
  },

  // Create custom category
  async createCategory(categoryData) {
    const response = await api.post('/expenses/categories', categoryData)
    return response.data
  },

  // Update category
  async updateCategory(id, categoryData) {
    const response = await api.put(`/expenses/categories/${id}`, categoryData)
    return response.data
  },

  // Delete category
  async deleteCategory(id) {
    const response = await api.delete(`/expenses/categories/${id}`)
    return response.data
  },

  // Get recurring expenses
  async getRecurringExpenses() {
    const response = await api.get('/expenses/recurring')
    return response.data
  },

  // Create recurring expense
  async createRecurringExpense(expenseData) {
    const response = await api.post('/expenses/recurring', expenseData)
    return response.data
  },

  // Update recurring expense
  async updateRecurringExpense(id, expenseData) {
    const response = await api.put(`/expenses/recurring/${id}`, expenseData)
    return response.data
  },

  // Delete recurring expense
  async deleteRecurringExpense(id) {
    const response = await api.delete(`/expenses/recurring/${id}`)
    return response.data
  },

  // Bulk operations
  async bulkCreateExpenses(expenses) {
    const response = await api.post('/expenses/bulk', { expenses })
    return response.data
  },

  async bulkUpdateExpenses(updates) {
    const response = await api.put('/expenses/bulk', { updates })
    return response.data
  },

  async bulkDeleteExpenses(ids) {
    const response = await api.delete('/expenses/bulk', {
      data: { ids }
    })
    return response.data
  },

  // Import/Export
  async importExpenses(file, format = 'csv') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)
    
    const response = await api.post('/expenses/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async exportExpenses(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/expenses/export?${queryParams.toString()}`, {
      responseType: 'blob',
    })
    
    // Create download link
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    return response.data
  },

  // Search expenses
  async searchExpenses(query, filters = {}) {
    const response = await api.post('/expenses/search', {
      query,
      filters
    })
    return response.data
  },

  // Get expense statistics
  async getExpenseStats(params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/expenses/stats?${queryParams.toString()}`)
    return response.data
  },
}

export default expenseService