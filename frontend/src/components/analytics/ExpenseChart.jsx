import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const ExpenseChart = ({ expenses, period = 'month', height = 300 }) => {
  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return []

    // Group expenses by date based on period
    const groupBy = period === 'week' ? 'day' : period === 'month' ? 'day' : 'month'
    const dateGroups = {}

    expenses.forEach(expense => {
      const date = new Date(expense.date)
      let key

      if (groupBy === 'day') {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (groupBy === 'month') {
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }

      if (!dateGroups[key]) {
        dateGroups[key] = 0
      }
      dateGroups[key] += parseFloat(expense.amount || 0)
    })

    return Object.entries(dateGroups)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-15) // Show last 15 data points
  }, [expenses, period])

  const maxAmount = Math.max(...chartData.map(d => d.amount), 1)

  const getBarColor = (amount) => {
    const intensity = amount / maxAmount
    if (intensity > 0.8) return 'bg-red-500'
    if (intensity > 0.6) return 'bg-orange-500'
    if (intensity > 0.4) return 'bg-yellow-500'
    if (intensity > 0.2) return 'bg-blue-500'
    return 'bg-green-500'
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Trends</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h4>
            <p className="text-gray-500">Add some expenses to see your spending trends</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Expense Trends</h3>
        <div className="text-sm text-gray-500">
          {period === 'week' ? 'Daily' : period === 'month' ? 'Daily' : 'Monthly'} spending
        </div>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <span>₹{Math.round(maxAmount).toLocaleString()}</span>
          <span>₹{Math.round(maxAmount * 0.75).toLocaleString()}</span>
          <span>₹{Math.round(maxAmount * 0.5).toLocaleString()}</span>
          <span>₹{Math.round(maxAmount * 0.25).toLocaleString()}</span>
          <span>₹0</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full flex items-end space-x-1">
          {chartData.map((data, index) => (
            <motion.div
              key={data.date}
              initial={{ height: 0 }}
              animate={{ height: `${(data.amount / maxAmount) * 100}%` }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex-1 min-w-0 flex flex-col items-center group relative"
            >
              {/* Bar */}
              <div
                className={`w-full rounded-t ${getBarColor(data.amount)} hover:opacity-80 transition-opacity cursor-pointer`}
                style={{ height: `${(data.amount / maxAmount) * (height - 40)}px` }}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                <div className="font-medium">₹{data.amount.toLocaleString()}</div>
                <div>{data.date}</div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-2 border-transparent border-t-gray-800"></div>
              </div>
              
              {/* X-axis label */}
              <div className="text-xs text-gray-500 mt-2 text-center transform -rotate-45 origin-center">
                {data.date.length > 6 ? data.date.slice(0, 6) : data.date}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 ml-12 pointer-events-none">
          {[0.25, 0.5, 0.75].map((ratio) => (
            <div
              key={ratio}
              className="absolute w-full border-t border-gray-200 border-dashed"
              style={{ bottom: `${ratio * (height - 40)}px` }}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-semibold text-gray-900">
              ₹{chartData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Average</div>
            <div className="text-lg font-semibold text-gray-900">
              ₹{Math.round(chartData.reduce((sum, d) => sum + d.amount, 0) / chartData.length).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Highest Day</div>
            <div className="text-lg font-semibold text-gray-900">
              ₹{Math.round(maxAmount).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpenseChart