import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../common/Button'
import FormInput from '../common/FormInput'
import { addBudget, updateBudget, deleteBudget } from '../../store/slices/expenseSlice'
import { showConfirmDialog, addToast } from '../../store/slices/uiSlice'
import toast from 'react-hot-toast'

const BudgetManagement = () => {
  const dispatch = useDispatch()
  const { budgets, expenses, categories } = useSelector((state) => state.expense)
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    startDate: new Date().toISOString().split('T')[0]
  })
  const [formErrors, setFormErrors] = useState({})
  
  // Calculate budget progress
  const calculateBudgetProgress = (budget) => {
    const now = new Date()
    const startDate = new Date(budget.startDate)
    let endDate = new Date(startDate)
    
    switch (budget.period) {
      case 'weekly':
        endDate.setDate(startDate.getDate() + 7)
        break
      case 'monthly':
        endDate.setMonth(startDate.getMonth() + 1)
        break
      case 'yearly':
        endDate.setFullYear(startDate.getFullYear() + 1)
        break
    }
    
    const periodExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expense.category === budget.category &&
             expenseDate >= startDate &&
             expenseDate <= endDate
    })
    
    const spent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const remaining = Math.max(0, budget.amount - spent)
    const percentage = Math.min(100, (spent / budget.amount) * 100)
    
    return {
      spent,
      remaining,
      percentage,
      isOverBudget: spent > budget.amount,
      daysLeft: Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)))
    }
  }
  
  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.category) {
      errors.category = 'Please select a category'
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount'
    }
    
    // Check for duplicate category budget
    const existingBudget = budgets.find(budget => 
      budget.category === formData.category && 
      (!editingBudget || budget.id !== editingBudget.id)
    )
    
    if (existingBudget) {
      errors.category = 'Budget already exists for this category'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }
    
    const budgetData = {
      ...formData,
      amount: parseFloat(formData.amount),
      id: editingBudget ? editingBudget.id : Date.now(),
      createdAt: editingBudget ? editingBudget.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (editingBudget) {
      dispatch(updateBudget(budgetData))
      toast.success('Budget updated successfully!')
    } else {
      dispatch(addBudget(budgetData))
      toast.success('Budget created successfully!')
    }
    
    resetForm()
  }
  
  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0]
    })
    setFormErrors({})
    setShowAddForm(false)
    setEditingBudget(null)
  }
  
  const handleEdit = (budget) => {
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      startDate: budget.startDate.split('T')[0]
    })
    setEditingBudget(budget)
    setShowAddForm(true)
  }
  
  const handleDelete = (budget) => {
    dispatch(showConfirmDialog({
      title: 'Delete Budget',
      message: `Are you sure you want to delete the budget for "${budget.category}"?`,
      onConfirm: () => {
        dispatch(deleteBudget(budget.id))
        toast.success('Budget deleted successfully')
      }
    }))
  }
  
  const getProgressColor = (percentage, isOverBudget) => {
    if (isOverBudget) return 'bg-red-500'
    if (percentage > 80) return 'bg-yellow-500'
    if (percentage > 60) return 'bg-blue-500'
    return 'bg-green-500'
  }
  
  const getBudgetStatus = (progress) => {
    if (progress.isOverBudget) return { text: 'Over Budget', color: 'text-red-600' }
    if (progress.percentage > 80) return { text: 'Almost Full', color: 'text-yellow-600' }
    if (progress.percentage > 60) return { text: 'On Track', color: 'text-blue-600' }
    return { text: 'Good', color: 'text-green-600' }
  }
  
  // Available categories for budgets (exclude those that already have budgets)
  const availableCategories = categories.filter(category => 
    !budgets.some(budget => budget.category === category) ||
    (editingBudget && editingBudget.category === category)
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Management</h2>
          <p className="text-gray-600">Set and track your spending limits by category</p>
        </div>
        
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowAddForm(true)}
          disabled={availableCategories.length === 0 && !editingBudget}
        >
          ➕ Create Budget
        </Button>
      </div>
      
      {/* Add/Edit Budget Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBudget ? 'Edit Budget' : 'Create New Budget'}
            </h3>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className={`input ${formErrors.category ? 'input-error' : ''}`}
                  required
                >
                  <option value="">Select Category</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-sm text-red-600">{formErrors.category}</p>
                )}
              </div>
              
              {/* Amount */}
              <FormInput
                label="Budget Amount"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                error={formErrors.amount}
                placeholder="0.00"
                required
                step="0.01"
                min="0"
              />
              
              {/* Period */}
              <div className="space-y-1">
                <label htmlFor="period" className="block text-sm font-medium text-gray-700">
                  Period
                </label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleFormChange}
                  className="input"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              {/* Start Date */}
              <FormInput
                label="Start Date"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleFormChange}
                required
              />
              
              {/* Form Actions */}
              <div className="md:col-span-2 lg:col-span-4 flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Budget List */}
      {budgets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">🎯</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No budgets created yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first budget to start tracking your spending limits
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            disabled={categories.length === 0}
          >
            Create Your First Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget, index) => {
            const progress = calculateBudgetProgress(budget)
            const status = getBudgetStatus(progress)
            
            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="card p-6 space-y-4"
              >
                {/* Budget Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{budget.category}</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(budget)}
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(budget)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
                
                {/* Budget Amount and Period */}
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ${budget.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 capitalize">
                    {budget.period} Budget
                  </p>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spent</span>
                    <span className={status.color}>
                      ${progress.spent.toFixed(2)} / ${budget.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, progress.percentage)}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`h-3 rounded-full ${getProgressColor(progress.percentage, progress.isOverBudget)}`}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{progress.percentage.toFixed(1)}% used</span>
                    <span>{progress.daysLeft} days left</span>
                  </div>
                </div>
                
                {/* Status and Remaining */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className={`text-sm font-medium ${status.color}`}>
                    {status.text}
                  </span>
                  <span className="text-sm text-gray-600">
                    ${progress.remaining.toFixed(2)} left
                  </span>
                </div>
                
                {/* Over Budget Warning */}
                {progress.isOverBudget && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">
                      ⚠️ You've exceeded this budget by ${(progress.spent - budget.amount).toFixed(2)}
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* Budget Summary */}
      {budgets.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{budgets.length}</p>
              <p className="text-sm text-gray-600">Active Budgets</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {budgets.filter(budget => !calculateBudgetProgress(budget).isOverBudget).length}
              </p>
              <p className="text-sm text-gray-600">On Track</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {budgets.filter(budget => calculateBudgetProgress(budget).isOverBudget).length}
              </p>
              <p className="text-sm text-gray-600">Over Budget</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BudgetManagement