import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import ExpenseChart from '../components/analytics/ExpenseChart'
import CategoryBreakdown from '../components/analytics/CategoryBreakdown'
import SpendingTrends from '../components/analytics/SpendingTrends'
import MonthlyReport from '../components/analytics/MonthlyReport'
import BudgetAnalysis from '../components/analytics/BudgetAnalysis'
import GroupExpenseAnalytics from '../components/analytics/GroupExpenseAnalytics'
import AIExpenseAnalytics from '../components/ai/AIExpenseAnalytics'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getDashboardAnalytics, getSpendingPatterns, getBudgetAnalysis, generateReport } from '../store/slices/analyticsSlice'
import { addToast } from '../store/slices/uiSlice'

const AnalyticsPage = () => {
  const dispatch = useDispatch()
  const { expenses } = useSelector(state => state.expense)
  const { groups } = useSelector(state => state.groups)
  const { user } = useSelector(state => state.auth)
  const { 
    dashboardData, 
    spendingPatterns, 
    budgetAnalysis, 
    loading, 
    error 
  } = useSelector(state => state.analytics)
  
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)

  // Fetch analytics data when period or category changes
  useEffect(() => {
    const periodMap = {
      'week': '7d',
      'month': '30d',
      'quarter': '90d',
      'year': '365d'
    }
    
    dispatch(getDashboardAnalytics(periodMap[selectedPeriod] || '30d'))
    dispatch(getSpendingPatterns({ 
      period: periodMap[selectedPeriod] || '30d',
      category: selectedCategory !== 'all' ? selectedCategory : undefined 
    }))
    dispatch(getBudgetAnalysis(periodMap[selectedPeriod] || '30d'))
  }, [dispatch, selectedPeriod, selectedCategory])

  const periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transportation' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'trends', name: 'Trends', icon: '📈' },
    { id: 'categories', name: 'Categories', icon: '📋' },
    { id: 'groups', name: 'Group Analytics', icon: '👥' },
    { id: 'budgets', name: 'Budget Analysis', icon: '🎯' },
    { id: 'reports', name: 'Reports', icon: '📄' }
  ]

  // Use backend analytics data or fallback to calculated data
  const getAnalyticsData = () => {
    if (dashboardData && spendingPatterns) {
      return {
        totalAmount: dashboardData.totalSpent || 0,
        avgTransaction: dashboardData.avgTransaction || 0,
        highestTransaction: dashboardData.highestTransaction || 0,
        transactionCount: dashboardData.transactionCount || 0,
        categoryData: spendingPatterns.categoryBreakdown || {},
        expenses: spendingPatterns.expenses || []
      }
    }
    
    // Fallback to local calculation if backend data not available
    const now = new Date()
    let startDate = new Date()

    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const filteredExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      const categoryMatch = selectedCategory === 'all' || 
                           expense.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      return expenseDate >= startDate && categoryMatch
    })

    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    const avgTransaction = totalAmount / (filteredExpenses.length || 1)
    const highestTransaction = Math.max(...filteredExpenses.map(exp => parseFloat(exp.amount || 0)), 0)

    // Category breakdown
    const categoryData = {}
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Other'
      categoryData[category] = (categoryData[category] || 0) + parseFloat(expense.amount || 0)
    })

    return {
      totalAmount,
      avgTransaction,
      highestTransaction,
      transactionCount: filteredExpenses.length,
      categoryData,
      expenses: filteredExpenses
    }
  }

  const handleGenerateReport = async () => {
    try {
      await dispatch(generateReport({
        period: selectedPeriod,
        category: selectedCategory,
        expenses: getAnalyticsData().expenses
      })).unwrap()
      
      dispatch(addToast({
        type: 'success',
        message: 'Report generated successfully!'
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to generate report. Please try again.'
      }))
    }
  }

  const analyticsData = getAnalyticsData()

  // Show loading state
  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  // Show error state
  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => {
              dispatch(getDashboardAnalytics('30d'))
              dispatch(getSpendingPatterns({ period: '30d' }))
              dispatch(getBudgetAnalysis('30d'))
            }}
            variant="primary"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your spending patterns
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowAIAnalysis(true)}
          >
            🤖 AI Analysis
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerateReport}
          >
            📄 Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedPeriod('month')
                setSelectedCategory('all')
              }}
            >
              🔄 Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{analyticsData.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{analyticsData.avgTransaction.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">🔢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.transactionCount}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Highest</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{analyticsData.highestTransaction.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-6 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ExpenseChart 
                  data={analyticsData.expenses} 
                  period={selectedPeriod}
                />
                <CategoryBreakdown 
                  data={analyticsData.categoryData}
                />
              </div>
              <SpendingTrends 
                expenses={analyticsData.expenses}
                period={selectedPeriod}
              />
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SpendingTrends 
                expenses={analyticsData.expenses}
                period={selectedPeriod}
                detailed={true}
              />
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CategoryBreakdown 
                data={analyticsData.categoryData}
                detailed={true}
              />
            </motion.div>
          )}

          {activeTab === 'groups' && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GroupExpenseAnalytics 
                groups={groups}
                period={selectedPeriod}
              />
            </motion.div>
          )}

          {activeTab === 'budgets' && (
            <motion.div
              key="budgets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BudgetAnalysis 
                expenses={analyticsData.expenses}
                period={selectedPeriod}
              />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MonthlyReport 
                expenses={analyticsData.expenses}
                categoryData={analyticsData.categoryData}
                period={selectedPeriod}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* AI Analysis Modal */}
      {showAIAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                AI Expense Analytics
              </h3>
              <button
                onClick={() => setShowAIAnalysis(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <AIExpenseAnalytics />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage