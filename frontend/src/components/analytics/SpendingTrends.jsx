import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const SpendingTrends = ({ expenses, period = 'month' }) => {
  const trendData = useMemo(() => {
    if (!expenses || expenses.length === 0) return null

    const now = new Date()
    const currentAmount = expenses
      .filter(exp => {
        const expDate = new Date(exp.date)
        if (period === 'month') {
          return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
        } else if (period === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return expDate >= weekAgo
        }
        return true
      })
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)

    let previousAmount = 0
    if (period === 'month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
      previousAmount = expenses
        .filter(exp => {
          const expDate = new Date(exp.date)
          return expDate.getMonth() === lastMonth.getMonth() && 
                 expDate.getFullYear() === lastMonth.getFullYear()
        })
        .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    } else if (period === 'week') {
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousAmount = expenses
        .filter(exp => {
          const expDate = new Date(exp.date)
          return expDate >= twoWeeksAgo && expDate < oneWeekAgo
        })
        .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
    }

    const change = currentAmount - previousAmount
    const changePercentage = previousAmount > 0 ? (change / previousAmount) * 100 : 0

    // Daily/Weekly pattern analysis
    const patterns = expenses.reduce((acc, exp) => {
      const date = new Date(exp.date)
      const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
      const hour = date.getHours()
      
      acc.byDay[dayOfWeek] = (acc.byDay[dayOfWeek] || 0) + parseFloat(exp.amount || 0)
      acc.byHour[hour] = (acc.byHour[hour] || 0) + parseFloat(exp.amount || 0)
      
      return acc
    }, { byDay: {}, byHour: {} })

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const mostExpensiveDay = Object.entries(patterns.byDay)
      .sort(([,a], [,b]) => b - a)[0]
    
    const peakHour = Object.entries(patterns.byHour)
      .sort(([,a], [,b]) => b - a)[0]

    return {
      currentAmount,
      previousAmount,
      change,
      changePercentage,
      mostExpensiveDay: mostExpensiveDay ? dayNames[mostExpensiveDay[0]] : null,
      mostExpensiveDayAmount: mostExpensiveDay ? mostExpensiveDay[1] : 0,
      peakHour: peakHour ? parseInt(peakHour[0]) : null,
      peakHourAmount: peakHour ? peakHour[1] : 0,
      patterns
    }
  }, [expenses, period])

  const getSpendingInsights = () => {
    if (!trendData) return []

    const insights = []
    
    if (Math.abs(trendData.changePercentage) > 20) {
      insights.push({
        type: trendData.change > 0 ? 'warning' : 'success',
        title: trendData.change > 0 ? 'Spending Increased' : 'Spending Decreased',
        message: `Your spending ${trendData.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(trendData.changePercentage).toFixed(1)}% compared to last ${period}`
      })
    }

    if (trendData.mostExpensiveDay) {
      insights.push({
        type: 'info',
        title: 'Spending Pattern',
        message: `You tend to spend most on ${trendData.mostExpensiveDay}s (₹${trendData.mostExpensiveDayAmount.toLocaleString()})`
      })
    }

    if (trendData.peakHour !== null) {
      const timeOfDay = trendData.peakHour < 12 ? 'morning' : 
                       trendData.peakHour < 17 ? 'afternoon' : 'evening'
      insights.push({
        type: 'info',
        title: 'Peak Spending Time',
        message: `Most of your spending happens in the ${timeOfDay} (around ${trendData.peakHour}:00)`
      })
    }

    return insights
  }

  if (!trendData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trends</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">📈</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Trend Data</h4>
            <p className="text-gray-500">Add more expenses to see spending trends</p>
          </div>
        </div>
      </div>
    )
  }

  const insights = getSpendingInsights()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Spending Trends</h3>

      {/* Current vs Previous Comparison */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-600">📊</span>
            <span className="text-sm font-medium text-blue-800">
              This {period === 'month' ? 'Month' : 'Week'}
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            ₹{trendData.currentAmount.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-gray-600">📊</span>
            <span className="text-sm font-medium text-gray-700">
              Last {period === 'month' ? 'Month' : 'Week'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{trendData.previousAmount.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-lg p-4 ${
            trendData.change > 0 
              ? 'bg-red-50' 
              : trendData.change < 0 
                ? 'bg-green-50' 
                : 'bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <span className={
              trendData.change > 0 
                ? 'text-red-600' 
                : trendData.change < 0 
                  ? 'text-green-600' 
                  : 'text-gray-600'
            }>
              {trendData.change > 0 ? '📈' : trendData.change < 0 ? '📉' : '➖'}
            </span>
            <span className={`text-sm font-medium ${
              trendData.change > 0 
                ? 'text-red-800' 
                : trendData.change < 0 
                  ? 'text-green-800' 
                  : 'text-gray-700'
            }`}>
              Change
            </span>
          </div>
          <div className={`text-2xl font-bold ${
            trendData.change > 0 
              ? 'text-red-900' 
              : trendData.change < 0 
                ? 'text-green-900' 
                : 'text-gray-900'
          }`}>
            {trendData.change > 0 ? '+' : ''}₹{Math.abs(trendData.change).toLocaleString()}
          </div>
          <div className={`text-sm ${
            trendData.change > 0 
              ? 'text-red-700' 
              : trendData.change < 0 
                ? 'text-green-700' 
                : 'text-gray-600'
          }`}>
            {Math.abs(trendData.changePercentage).toFixed(1)}%
          </div>
        </motion.div>
      </div>

      {/* Day of Week Pattern */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Spending by Day of Week</h4>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
            const amount = trendData.patterns.byDay[index] || 0
            const maxDayAmount = Math.max(...Object.values(trendData.patterns.byDay))
            const height = maxDayAmount > 0 ? (amount / maxDayAmount) * 100 : 0
            
            return (
              <div key={day} className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.1 }}
                    className={`w-full rounded-t ${
                      amount === maxDayAmount ? 'bg-primary-500' : 'bg-gray-300'
                    } min-h-1`}
                  />
                </div>
                <div className="text-xs font-medium text-gray-700">{day}</div>
                <div className="text-xs text-gray-500">₹{amount.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Insights</h4>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border-l-4 ${
                  insight.type === 'warning' 
                    ? 'bg-orange-50 border-orange-400' 
                    : insight.type === 'success'
                      ? 'bg-green-50 border-green-400'
                      : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className={`font-medium mb-1 ${
                  insight.type === 'warning' 
                    ? 'text-orange-800' 
                    : insight.type === 'success'
                      ? 'text-green-800'
                      : 'text-blue-800'
                }`}>
                  {insight.title}
                </div>
                <div className={`text-sm ${
                  insight.type === 'warning' 
                    ? 'text-orange-700' 
                    : insight.type === 'success'
                      ? 'text-green-700'
                      : 'text-blue-700'
                }`}>
                  {insight.message}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SpendingTrends