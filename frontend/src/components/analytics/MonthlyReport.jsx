import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const MonthlyReport = ({ expenses, selectedMonth = new Date() }) => {
  const reportData = useMemo(() => {
    if (!expenses || expenses.length === 0) return null

    const month = selectedMonth.getMonth()
    const year = selectedMonth.getFullYear()
    
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === month && expenseDate.getFullYear() === year
    })

    if (monthlyExpenses.length === 0) return null

    // Calculate totals
    const totalAmount = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    const transactionCount = monthlyExpenses.length
    const avgTransaction = totalAmount / transactionCount
    const dailyAverage = totalAmount / new Date(year, month + 1, 0).getDate()

    // Category breakdown
    const categories = {}
    monthlyExpenses.forEach(expense => {
      const category = expense.category || 'Other'
      categories[category] = (categories[category] || 0) + parseFloat(expense.amount || 0)
    })

    const topCategories = Object.entries(categories)
      .map(([name, amount]) => ({ name, amount, percentage: (amount / totalAmount) * 100 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Daily breakdown
    const dailyBreakdown = {}
    monthlyExpenses.forEach(expense => {
      const day = new Date(expense.date).getDate()
      dailyBreakdown[day] = (dailyBreakdown[day] || 0) + parseFloat(expense.amount || 0)
    })

    const topSpendingDays = Object.entries(dailyBreakdown)
      .map(([day, amount]) => ({ day: parseInt(day), amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Week breakdown
    const weeklyBreakdown = {}
    monthlyExpenses.forEach(expense => {
      const date = new Date(expense.date)
      const weekNumber = Math.ceil(date.getDate() / 7)
      weeklyBreakdown[weekNumber] = (weeklyBreakdown[weekNumber] || 0) + parseFloat(expense.amount || 0)
    })

    // Trends
    const firstHalf = monthlyExpenses
      .filter(exp => new Date(exp.date).getDate() <= 15)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    
    const secondHalf = totalAmount - firstHalf
    const spendingTrend = secondHalf > firstHalf ? 'increasing' : 'decreasing'

    // Largest transactions
    const largestTransactions = monthlyExpenses
      .sort((a, b) => parseFloat(b.amount || 0) - parseFloat(a.amount || 0))
      .slice(0, 5)

    // Payment methods
    const paymentMethods = {}
    monthlyExpenses.forEach(expense => {
      const method = expense.paymentMethod || 'Unknown'
      paymentMethods[method] = (paymentMethods[method] || 0) + parseFloat(expense.amount || 0)
    })

    return {
      month: selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      totalAmount,
      transactionCount,
      avgTransaction,
      dailyAverage,
      topCategories,
      topSpendingDays,
      weeklyBreakdown,
      spendingTrend,
      firstHalf,
      secondHalf,
      largestTransactions,
      paymentMethods
    }
  }, [expenses, selectedMonth])

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

  if (!reportData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Report</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">📄</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Data for This Month</h4>
            <p className="text-gray-500">No expenses found for the selected month</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Report</h3>
        <div className="text-sm text-gray-500">{reportData.month}</div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-4 text-center"
        >
          <div className="text-2xl mb-1">💰</div>
          <div className="text-sm text-blue-600 font-medium">Total Spent</div>
          <div className="text-lg font-bold text-blue-900">
            ₹{reportData.totalAmount.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-green-50 rounded-lg p-4 text-center"
        >
          <div className="text-2xl mb-1">📊</div>
          <div className="text-sm text-green-600 font-medium">Transactions</div>
          <div className="text-lg font-bold text-green-900">
            {reportData.transactionCount}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-purple-50 rounded-lg p-4 text-center"
        >
          <div className="text-2xl mb-1">📈</div>
          <div className="text-sm text-purple-600 font-medium">Daily Avg</div>
          <div className="text-lg font-bold text-purple-900">
            ₹{Math.round(reportData.dailyAverage).toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-orange-50 rounded-lg p-4 text-center"
        >
          <div className="text-2xl mb-1">💳</div>
          <div className="text-sm text-orange-600 font-medium">Avg Transaction</div>
          <div className="text-lg font-bold text-orange-900">
            ₹{Math.round(reportData.avgTransaction).toLocaleString()}
          </div>
        </motion.div>
      </div>

      {/* Spending Trend */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Spending Pattern</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">First Half</span>
              <span className="text-lg font-bold text-gray-900">
                ₹{reportData.firstHalf.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(reportData.firstHalf / reportData.totalAmount) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Second Half</span>
              <span className="text-lg font-bold text-gray-900">
                ₹{reportData.secondHalf.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(reportData.secondHalf / reportData.totalAmount) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className={`mt-3 p-3 rounded-lg ${
          reportData.spendingTrend === 'increasing' ? 'bg-orange-50' : 'bg-green-50'
        }`}>
          <div className={`text-sm font-medium ${
            reportData.spendingTrend === 'increasing' ? 'text-orange-800' : 'text-green-800'
          }`}>
            {reportData.spendingTrend === 'increasing' ? '📈' : '📉'} 
            Spending Trend: {reportData.spendingTrend === 'increasing' ? 'Increasing' : 'Decreasing'}
          </div>
          <div className={`text-xs ${
            reportData.spendingTrend === 'increasing' ? 'text-orange-600' : 'text-green-600'
          }`}>
            You spent {reportData.spendingTrend === 'increasing' ? 'more' : 'less'} in the second half of the month
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Top Categories</h4>
        <div className="space-y-2">
          {reportData.topCategories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getCategoryIcon(category.name)}</span>
                <div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-500">
                    {category.percentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ₹{category.amount.toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Spending Days */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Highest Spending Days</h4>
        <div className="grid grid-cols-5 gap-2">
          {reportData.topSpendingDays.map((day, index) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-3 bg-primary-50 rounded-lg"
            >
              <div className="text-lg font-bold text-primary-900">{day.day}</div>
              <div className="text-xs text-primary-600">
                ₹{day.amount.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Largest Transactions */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">Largest Transactions</h4>
        <div className="space-y-2">
          {reportData.largestTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
                <div>
                  <div className="font-medium text-gray-900">
                    {transaction.description || 'No description'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">
                  ₹{parseFloat(transaction.amount || 0).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MonthlyReport