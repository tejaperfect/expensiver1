import React, { useState, useMemo, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'
import { deleteExpenseAsync, fetchExpenses, fetchCategories } from '../../store/slices/expenseSlice'
import { openModal, showConfirmDialog } from '../../store/slices/uiSlice'
import toast from 'react-hot-toast'

const ExpenseList = () => {
  const dispatch = useDispatch()
  const { expenses, categories, isLoading, error } = useSelector((state) => state.expense)
  
  // Fetch expenses and categories on component mount
  useEffect(() => {
    dispatch(fetchExpenses())
    dispatch(fetchCategories())
  }, [dispatch])
  
  const [filters, setFilters] = useState({
    category: '',
    dateRange: 'all',
    search: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  
  const [viewMode, setViewMode] = useState('list') // list or grid
  
  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    // Ensure expenses is always an array
    const expensesArray = Array.isArray(expenses) ? expenses : []
    let filtered = [...expensesArray]
    
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        expense.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        (expense.tags && expense.tags.some(tag =>
          tag.toLowerCase().includes(filters.search.toLowerCase())
        ))
      )
    }
    
    // Category filter
    if (filters.category) {
      filtered = filtered.filter(expense => expense.category === filters.category)
    }
    
    // Date range filter
    const now = new Date()
    if (filters.dateRange !== 'all') {
      const startDate = new Date()
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      filtered = filtered.filter(expense => new Date(expense.date) >= startDate)
    }
    
    // Sort expenses
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (filters.sortBy) {
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'description':
          aValue = a.description
          bValue = b.description
          break
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return filtered
  }, [expenses, filters])
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const handleEditExpense = (expense) => {
    dispatch(openModal({ modalName: 'editExpense', data: expense }))
  }
  
  const handleDeleteExpense = (expense) => {
    dispatch(showConfirmDialog({
      title: 'Delete Expense',
      message: `Are you sure you want to delete "${expense.description}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await dispatch(deleteExpenseAsync(expense.id)).unwrap()
          toast.success('Expense deleted successfully')
        } catch (error) {
          toast.error(error || 'Failed to delete expense')
        }
      }
    }))
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }
  
  const getCategoryIcon = (category) => {
    const icons = {
      'Food & Dining': '🍽️',
      'Transportation': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Bills & Utilities': '💡',
      'Healthcare': '🏥',
      'Travel': '✈️',
      'Education': '📚',
      'Other': '📦'
    }
    return icons[category] || '📦'
  }
  
  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && expenses.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Loading expenses...</span>
        </div>
      )}
      
      {/* Error State */}
      {error && !isLoading && (
        <div className="card p-8 text-center border-red-200">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load expenses</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => dispatch(fetchExpenses())}
            variant="primary"
          >
            Try Again
          </Button>
        </div>
      )}
      
      {/* Main Content - only show if not loading or has data */}
      {(!isLoading || expenses.length > 0) && !error && (
      <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-600">
            {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? '⊞' : '☰'} {viewMode === 'list' ? 'Grid' : 'List'} View
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => dispatch(openModal({ modalName: 'addExpense' }))}
          >
            ➕ Add Expense
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input w-full"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input"
          >
            <option value="">All Categories</option>
            {Array.isArray(categories) && categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* Date Range Filter */}
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="input"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          
          {/* Sort Options */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-')
              handleFilterChange('sortBy', sortBy)
              handleFilterChange('sortOrder', sortOrder)
            }}
            className="input"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="category-asc">Category A-Z</option>
            <option value="description-asc">Description A-Z</option>
          </select>
        </div>
      </div>
      
      {/* Expense List/Grid */}
      {filteredExpenses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">💰</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-500 mb-4">
            {filters.search || filters.category || filters.dateRange !== 'all'
              ? 'Try adjusting your filters to see more results'
              : 'Start tracking your expenses to see them here'
            }
          </p>
          {!filters.search && !filters.category && filters.dateRange === 'all' && (
            <Button
              variant="primary"
              onClick={() => dispatch(openModal({ modalName: 'addExpense' }))}
            >
              Add Your First Expense
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          <AnimatePresence>
            {filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`card card-hover p-6 ${
                  viewMode === 'list' ? 'flex items-center space-x-4' : 'space-y-4'
                }`}
              >
                {/* Icon and Category */}
                <div className={`flex items-center space-x-3 ${
                  viewMode === 'grid' ? 'justify-between' : ''
                }`}>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">{getCategoryIcon(expense.category)}</span>
                  </div>
                  {viewMode === 'grid' && (
                    <span className="text-2xl font-bold text-gray-900">
                      ${expense.amount.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* Expense Details */}
                <div className={`flex-1 ${viewMode === 'grid' ? 'space-y-2' : ''}`}>
                  <div className={`flex items-center justify-between ${
                    viewMode === 'list' ? '' : 'flex-col items-start space-y-1'
                  }`}>
                    <h4 className="font-medium text-gray-900">{expense.description}</h4>
                    {viewMode === 'list' && (
                      <span className="text-xl font-bold text-gray-900">
                        ${expense.amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  <div className={`flex items-center text-sm text-gray-500 ${
                    viewMode === 'grid' ? 'flex-col items-start space-y-1' : 'space-x-3'
                  }`}>
                    <span>{expense.category}</span>
                    {viewMode === 'list' && <span>•</span>}
                    <span>{formatDate(expense.date)}</span>
                  </div>
                  
                  {expense.tags && expense.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {expense.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {expense.tags.length > 3 && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          +{expense.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className={`flex space-x-2 ${
                  viewMode === 'grid' ? 'justify-end' : ''
                }`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditExpense(expense)}
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExpense(expense)}
                  >
                    🗑️
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      </>
      )}
    </div>
  )
}

export default ExpenseList