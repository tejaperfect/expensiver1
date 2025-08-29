import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../common/Button'
import StatsCard from '../dashboard/StatsCard'
import { openModal, addToast } from '../../store/slices/uiSlice'

const WalletManagement = () => {
  const dispatch = useDispatch()
  const { expenses } = useSelector((state) => state.expense)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  
  // Calculate wallet statistics
  const calculateStats = () => {
    const now = new Date()
    let startDate = new Date()
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(0) // All time
    }
    
    const periodExpenses = expenses.filter(expense => 
      new Date(expense.date) >= startDate
    )
    
    const totalSpent = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const avgPerDay = totalSpent / Math.max(1, (now - startDate) / (1000 * 60 * 60 * 24))
    
    // Category breakdown
    const categoryTotals = periodExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {})
    
    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]
    
    return {
      totalSpent,
      avgPerDay,
      transactionCount: periodExpenses.length,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      categoryBreakdown: categoryTotals
    }
  }
  
  const stats = calculateStats()
  
  // Recent transactions (last 10)
  const recentTransactions = [...expenses]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10)
  
  const walletStats = [
    {
      title: `Total Spent (${selectedPeriod})`,
      value: `$${stats.totalSpent.toFixed(2)}`,
      icon: '💸',
      change: stats.totalSpent > 0 ? 'Active spending' : 'No expenses',
      changeType: 'neutral',
      subtitle: `${stats.transactionCount} transactions`
    },
    {
      title: 'Daily Average',
      value: `$${stats.avgPerDay.toFixed(2)}`,
      icon: '📊',
      change: stats.avgPerDay > 50 ? 'High' : stats.avgPerDay > 20 ? 'Moderate' : 'Low',
      changeType: stats.avgPerDay > 50 ? 'negative' : stats.avgPerDay > 20 ? 'neutral' : 'positive',
      subtitle: 'Per day spending'
    },
    {
      title: 'Top Category',
      value: stats.topCategory ? `$${stats.topCategory.amount.toFixed(2)}` : '$0.00',
      icon: '🏷️',
      subtitle: stats.topCategory ? stats.topCategory.name : 'No expenses yet'
    },
    {
      title: 'Balance Status',
      value: 'Tracking',
      icon: '💰',
      change: 'Active',
      changeType: 'positive',
      subtitle: 'Expense monitoring'
    }
  ]
  
  const handleAddMoney = () => {
    dispatch(addToast({
      type: 'info',
      message: 'Add money feature coming soon!',
      duration: 3000
    }))
  }
  
  const handleSendMoney = () => {
    dispatch(addToast({
      type: 'info',
      message: 'Send money feature coming soon!',
      duration: 3000
    }))
  }
  
  const formatTransactionDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wallet</h2>
          <p className="text-gray-600">Manage your finances and track transactions</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline" size="md" onClick={handleSendMoney}>
            💸 Send Money
          </Button>
          <Button variant="primary" size="md" onClick={handleAddMoney}>
            💰 Add Money
          </Button>
        </div>
      </div>
      
      {/* Period Selector */}
      <div className="flex space-x-2">
        {['week', 'month', 'year', 'all'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === 'all' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
          </Button>
        ))}
      </div>
      
      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {walletStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(openModal({ modalName: 'addExpense' }))}
              >
                Add Transaction
              </Button>
            </div>
            
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">💳</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
                <p className="text-gray-500 mb-4">Start adding expenses to see your transaction history</p>
                <Button
                  variant="primary"
                  onClick={() => dispatch(openModal({ modalName: 'addExpense' }))}
                >
                  Add First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">💸</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{transaction.description}</h4>
                        <span className="font-semibold text-red-600">
                          -${transaction.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{formatTransactionDate(transaction.date)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions & Category Breakdown */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => dispatch(openModal({ modalName: 'addExpense' }))}
              >
                <span className="mr-3">➕</span>
                Add Expense
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleAddMoney}
              >
                <span className="mr-3">💰</span>
                Add Money
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSendMoney}
              >
                <span className="mr-3">💸</span>
                Send Money
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => dispatch(addToast({ type: 'info', message: 'Request money feature coming soon!' }))}
              >
                <span className="mr-3">💳</span>
                Request Money
              </Button>
            </div>
          </div>
          
          {/* Category Breakdown */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
            
            {Object.keys(stats.categoryBreakdown).length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expenses to categorize yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.categoryBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, amount], index) => {
                    const percentage = (amount / stats.totalSpent) * 100
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{category}</span>
                          <span className="text-gray-500">
                            ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="h-2 rounded-full bg-primary-500"
                          />
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WalletManagement