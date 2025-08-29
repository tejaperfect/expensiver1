import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const CategoryBreakdown = ({ expenses, showPercentages = true }) => {
  const categoryData = useMemo(() => {
    if (!expenses || expenses.length === 0) return []

    const categories = {}
    let total = 0

    expenses.forEach(expense => {
      const category = expense.category || 'Other'
      const amount = parseFloat(expense.amount || 0)
      categories[category] = (categories[category] || 0) + amount
      total += amount
    })

    return Object.entries(categories)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses])

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

  const getCategoryColor = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-gray-500'
    ]
    return colors[index % colors.length]
  }

  const getBorderColor = (index) => {
    const colors = [
      'border-blue-500',
      'border-green-500',
      'border-purple-500',
      'border-orange-500',
      'border-red-500',
      'border-yellow-500',
      'border-pink-500',
      'border-indigo-500',
      'border-teal-500',
      'border-gray-500'
    ]
    return colors[index % colors.length]
  }

  const totalAmount = categoryData.reduce((sum, cat) => sum + cat.amount, 0)

  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Categories</h4>
            <p className="text-gray-500">Add expenses to see category breakdown</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
        <div className="text-sm text-gray-500">
          Total: ₹{totalAmount.toLocaleString()}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart Representation */}
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            {/* Simplified pie chart using border radius */}
            <div className="w-full h-full rounded-full overflow-hidden relative">
              {categoryData.map((category, index) => {
                const percentage = category.percentage
                const cumulativePercentage = categoryData
                  .slice(0, index)
                  .reduce((sum, cat) => sum + cat.percentage, 0)
                
                return (
                  <motion.div
                    key={category.name}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`absolute inset-0 ${getCategoryColor(index)}`}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${
                        50 + 50 * Math.cos((cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2)
                      }% ${
                        50 + 50 * Math.sin((cumulativePercentage / 100) * 2 * Math.PI - Math.PI / 2)
                      }%, ${
                        50 + 50 * Math.cos(((cumulativePercentage + percentage) / 100) * 2 * Math.PI - Math.PI / 2)
                      }% ${
                        50 + 50 * Math.sin(((cumulativePercentage + percentage) / 100) * 2 * Math.PI - Math.PI / 2)
                      }%)`
                    }}
                  />
                )
              })}
              
              {/* Center hole */}
              <div className="absolute inset-6 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-sm font-semibold text-gray-900">
                    ₹{(totalAmount / 1000).toFixed(1)}K
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-3">
          {categoryData.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getCategoryColor(index)}`} />
                <span className="text-lg">{getCategoryIcon(category.name)}</span>
                <div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                  {showPercentages && (
                    <div className="text-sm text-gray-500">
                      {category.percentage.toFixed(1)}% of total
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ₹{category.amount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {expenses.filter(e => (e.category || 'Other') === category.name).length} transactions
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Top Categories Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Top Category</div>
            <div className="font-semibold text-gray-900 flex items-center justify-center space-x-1">
              <span>{getCategoryIcon(categoryData[0]?.name)}</span>
              <span>{categoryData[0]?.name}</span>
            </div>
            <div className="text-sm text-gray-600">
              ₹{categoryData[0]?.amount.toLocaleString()}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">Categories</div>
            <div className="text-lg font-semibold text-gray-900">
              {categoryData.length}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">Avg per Category</div>
            <div className="text-lg font-semibold text-gray-900">
              ₹{Math.round(totalAmount / categoryData.length).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryBreakdown