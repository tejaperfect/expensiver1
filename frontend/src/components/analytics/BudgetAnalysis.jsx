import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const BudgetAnalysis = ({ expenses, budgets = [], period = 'month' }) => {
  const analysisData = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      return {
        noBudgets: true,
        suggestions: [
          'Set monthly budgets for different categories',
          'Track your spending against budget limits',
          'Get alerts when approaching budget limits',
          'Analyze budget vs actual spending trends'
        ]
      }
    }

    const now = new Date()
    let startDate = new Date()

    // Set date range based on period
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth())
        startDate.setDate(1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear())
        startDate.setMonth(0)
        startDate.setDate(1)
        break
    }

    // Filter expenses for the period
    const periodExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate >= startDate && expenseDate <= now
    })

    // Calculate spending by category
    const spendingByCategory = {}
    periodExpenses.forEach(expense => {
      const category = expense.category || 'Other'
      spendingByCategory[category] = (spendingByCategory[category] || 0) + parseFloat(expense.amount || 0)
    })

    // Analyze each budget
    const budgetAnalysis = budgets.map(budget => {
      const actualSpent = spendingByCategory[budget.category] || 0
      const budgetAmount = parseFloat(budget.amount || 0)
      const remaining = budgetAmount - actualSpent
      const percentageUsed = budgetAmount > 0 ? (actualSpent / budgetAmount) * 100 : 0
      const variance = actualSpent - budgetAmount

      let status = 'on-track'
      if (percentageUsed > 100) {
        status = 'over-budget'
      } else if (percentageUsed > 80) {
        status = 'warning'
      } else if (percentageUsed > 60) {
        status = 'approaching'
      }

      return {
        ...budget,
        actualSpent,
        remaining,
        percentageUsed,
        variance,
        status
      }
    })

    // Calculate totals
    const totalBudget = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount || 0), 0)
    const totalSpent = Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0)
    const totalRemaining = totalBudget - totalSpent
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // Budget performance insights
    const overBudgetCategories = budgetAnalysis.filter(b => b.status === 'over-budget')
    const warningCategories = budgetAnalysis.filter(b => b.status === 'warning')
    const onTrackCategories = budgetAnalysis.filter(b => b.status === 'on-track' || b.status === 'approaching')

    return {
      budgetAnalysis,
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      overBudgetCategories,
      warningCategories,
      onTrackCategories,
      noBudgets: false
    }
  }, [expenses, budgets, period])

  const getCategoryIcon = (category) => {
    const icons = {
      'Food & Dining': '🍽️',
      'food': '🍽️',
      'Transportation': '🚗',
      'transport': '🚗',
      'Entertainment': '🎬',
      'entertainment': '🎬',
      'Shopping': '🛍️',
      'shopping': '🛍️',
      'Utilities': '⚡',
      'utilities': '⚡',
      'Healthcare': '🏥',
      'healthcare': '🏥',
      'Education': '📚',
      'education': '📚',
      'Travel': '✈️',
      'travel': '✈️',
      'Other': '📋'
    }
    return icons[category] || icons[category.toLowerCase()] || '📋'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'over-budget':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'approaching':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'on-track':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'over-budget':
        return '🚨'
      case 'warning':
        return '⚠️'
      case 'approaching':
        return '📊'
      case 'on-track':
        return '✅'
      default:
        return '📊'
    }
  }

  if (analysisData.noBudgets) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Analysis</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎯</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Budgets Set</h4>
          <p className="text-gray-500 mb-6">Create budgets to track your spending and get insights</p>
          
          <div className="max-w-md mx-auto">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-blue-800 mb-2">💡 Budget Benefits:</h5>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                {analysisData.suggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
            
            <button className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Create Your First Budget
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Budget Analysis</h3>
        <div className="text-sm text-gray-500">
          {period === 'month' ? 'This Month' : period === 'week' ? 'This Week' : 'This Period'}
        </div>
      </div>

      {/* Overall Budget Summary */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-600">🎯</span>
            <span className="text-sm font-medium text-blue-800">Total Budget</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            ₹{analysisData.totalBudget.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-purple-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-purple-600">💳</span>
            <span className="text-sm font-medium text-purple-800">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            ₹{analysisData.totalSpent.toLocaleString()}
          </div>
          <div className="text-sm text-purple-700">
            {analysisData.overallPercentage.toFixed(1)}% of budget
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg p-4 ${
            analysisData.totalRemaining >= 0 ? 'bg-green-50' : 'bg-red-50'
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className={analysisData.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}>
              {analysisData.totalRemaining >= 0 ? '💰' : '🚨'}
            </span>
            <span className={`text-sm font-medium ${
              analysisData.totalRemaining >= 0 ? 'text-green-800' : 'text-red-800'
            }`}>
              {analysisData.totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
            </span>
          </div>
          <div className={`text-2xl font-bold ${
            analysisData.totalRemaining >= 0 ? 'text-green-900' : 'text-red-900'
          }`}>
            ₹{Math.abs(analysisData.totalRemaining).toLocaleString()}
          </div>
        </motion.div>
      </div>

      {/* Budget Progress Bars */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Budget vs Actual Spending</h4>
        <div className="space-y-4">
          {analysisData.budgetAnalysis.map((budget, index) => (
            <motion.div
              key={budget.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 ${getStatusColor(budget.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getCategoryIcon(budget.category)}</span>
                  <div>
                    <div className="font-medium">{budget.category}</div>
                    <div className="text-sm opacity-75">
                      ₹{budget.actualSpent.toLocaleString()} of ₹{parseFloat(budget.amount).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{getStatusIcon(budget.status)}</span>
                  <span className="text-sm font-medium">
                    {budget.percentageUsed.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-white bg-opacity-50 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      budget.status === 'over-budget' ? 'bg-red-500' :
                      budget.status === 'warning' ? 'bg-orange-500' :
                      budget.status === 'approaching' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                  />
                </div>
                {budget.percentageUsed > 100 && (
                  <div className="absolute right-0 top-0 h-3 w-1 bg-red-600 rounded-r-full" />
                )}
              </div>

              {/* Status Message */}
              <div className="mt-2 text-sm">
                {budget.status === 'over-budget' && (
                  <span>💸 Over budget by ₹{Math.abs(budget.variance).toLocaleString()}</span>
                )}
                {budget.status === 'warning' && (
                  <span>⚠️ Approaching budget limit - ₹{budget.remaining.toLocaleString()} remaining</span>
                )}
                {budget.status === 'approaching' && (
                  <span>📊 Good progress - ₹{budget.remaining.toLocaleString()} remaining</span>
                )}
                {budget.status === 'on-track' && (
                  <span>✅ On track - ₹{budget.remaining.toLocaleString()} remaining</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Budget Insights */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl mb-2">🚨</div>
          <div className="text-lg font-bold text-red-900">
            {analysisData.overBudgetCategories.length}
          </div>
          <div className="text-sm text-red-700">Over Budget</div>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-lg font-bold text-orange-900">
            {analysisData.warningCategories.length}
          </div>
          <div className="text-sm text-orange-700">Need Attention</div>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-lg font-bold text-green-900">
            {analysisData.onTrackCategories.length}
          </div>
          <div className="text-sm text-green-700">On Track</div>
        </div>
      </div>
    </div>
  )
}

export default BudgetAnalysis