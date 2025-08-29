import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const GroupExpenseList = ({ expenses, group, onExpenseClick, onSettleUp }) => {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📊' },
    { id: 'food', name: 'Food & Dining', icon: '🍕' },
    { id: 'transport', name: 'Transport', icon: '🚗' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'bills', name: 'Bills & Utilities', icon: '📄' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'health', name: 'Health & Medical', icon: '🏥' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'other', name: 'Other', icon: '📊' }
  ]

  const filters = [
    { id: 'all', name: 'All Expenses' },
    { id: 'pending', name: 'Pending' },
    { id: 'settled', name: 'Settled' },
    { id: 'my-expenses', name: 'Paid by Me' },
    { id: 'involving-me', name: 'Involving Me' }
  ]

  const sortOptions = [
    { id: 'date', name: 'Date' },
    { id: 'amount', name: 'Amount' },
    { id: 'description', name: 'Description' }
  ]

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses || []

    // Filter by status and involvement
    if (filter === 'pending') {
      filtered = filtered.filter(expense => expense.status === 'pending')
    } else if (filter === 'settled') {
      filtered = filtered.filter(expense => expense.status === 'settled')
    } else if (filter === 'my-expenses') {
      filtered = filtered.filter(expense => expense.paidBy === 'current_user')
    } else if (filter === 'involving-me') {
      filtered = filtered.filter(expense => 
        expense.paidBy === 'current_user' || 
        expense.selectedMembers?.includes('current_user')
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedCategory)
    }

    // Sort expenses
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt || a.date)
          bValue = new Date(b.createdAt || b.date)
          break
        case 'amount':
          aValue = parseFloat(a.amount)
          bValue = parseFloat(b.amount)
          break
        case 'description':
          aValue = a.description.toLowerCase()
          bValue = b.description.toLowerCase()
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [expenses, filter, selectedCategory, sortBy, sortOrder])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getMemberName = (memberId) => {
    const member = group?.members?.find(m => m.id === memberId)
    return member ? (member.id === 'current_user' ? 'You' : member.name) : 'Unknown'
  }

  const getMyShare = (expense) => {
    if (!expense.selectedMembers?.includes('current_user')) return 0

    if (expense.splitType === 'equal') {
      return parseFloat(expense.amount) / expense.selectedMembers.length
    } else if (expense.splitType === 'exact') {
      return expense.customSplits?.['current_user'] || 0
    } else if (expense.splitType === 'percentage') {
      const percentage = expense.customSplits?.['current_user'] || 0
      return (parseFloat(expense.amount) * percentage) / 100
    }
    return 0
  }

  const getCategory = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories[0]
  }

  const getTotalExpenses = () => {
    return filteredAndSortedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0)
  }

  const getMyTotalShare = () => {
    return filteredAndSortedExpenses.reduce((sum, expense) => sum + getMyShare(expense), 0)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{getTotalExpenses().toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Your Share</div>
          <div className="text-2xl font-bold text-blue-600">
            ₹{getMyTotalShare().toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Total Count</div>
          <div className="text-2xl font-bold text-gray-900">
            {filteredAndSortedExpenses.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-orange-600">
            {filteredAndSortedExpenses.filter(e => e.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {filters.map(filterOption => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.id
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              {filterOption.name}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 6).map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>

          {onSettleUp && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSettleUp}
            >
              Settle Up
            </Button>
          )}
        </div>
      </div>

      {/* Expense List */}
      <div className="space-y-3">
        {filteredAndSortedExpenses.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-400 text-4xl mb-4">💸</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Expenses Found</h3>
            <p className="text-gray-500">
              {filter === 'all' ? 'No expenses have been added to this group yet.' : 'No expenses match your current filters.'}
            </p>
          </div>
        ) : (
          filteredAndSortedExpenses.map((expense, index) => {
            const category = getCategory(expense.category)
            const myShare = getMyShare(expense)
            const isPaidByMe = expense.paidBy === 'current_user'

            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onExpenseClick && onExpenseClick(expense)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Category Icon */}
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">{category.icon}</span>
                    </div>

                    {/* Expense Details */}
                    <div>
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Paid by {getMemberName(expense.paidBy)}</span>
                        <span>•</span>
                        <span>{formatDate(expense.createdAt || expense.date)}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          expense.status === 'settled'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {expense.status === 'settled' ? 'Settled' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount Details */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ₹{parseFloat(expense.amount).toFixed(2)}
                    </div>
                    {myShare > 0 && (
                      <div className="text-sm text-gray-500">
                        Your share: ₹{myShare.toFixed(2)}
                      </div>
                    )}
                    {isPaidByMe && !myShare && (
                      <div className="text-sm text-green-600 font-medium">
                        You paid
                      </div>
                    )}
                  </div>
                </div>

                {/* Split Info */}
                {expense.selectedMembers && expense.selectedMembers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        Split {expense.splitType} among {expense.selectedMembers.length} members
                      </span>
                      <div className="flex -space-x-1">
                        {expense.selectedMembers.slice(0, 4).map(memberId => {
                          const member = group?.members?.find(m => m.id === memberId)
                          return member ? (
                            <div
                              key={memberId}
                              className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white"
                              title={member.name}
                            >
                              <span className="text-xs font-medium text-primary-700">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ) : null
                        })}
                        {expense.selectedMembers.length > 4 && (
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-xs font-medium text-gray-500">
                              +{expense.selectedMembers.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default GroupExpenseList