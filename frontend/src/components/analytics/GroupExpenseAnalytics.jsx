import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

const GroupExpenseAnalytics = ({ groups, expenses }) => {
  const groupAnalytics = useMemo(() => {
    if (!groups || groups.length === 0) {
      return {
        noGroups: true,
        message: 'Join or create groups to see group analytics'
      }
    }

    const analytics = groups.map(group => {
      // Filter expenses for this group
      const groupExpenses = expenses.filter(expense => expense.groupId === group.id)
      
      if (groupExpenses.length === 0) {
        return {
          ...group,
          totalSpent: 0,
          memberContributions: {},
          expenseCount: 0,
          avgExpense: 0,
          topCategory: null,
          recentActivity: [],
          settlementStatus: 'settled'
        }
      }

      const totalSpent = groupExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      const expenseCount = groupExpenses.length
      const avgExpense = totalSpent / expenseCount

      // Calculate member contributions
      const memberContributions = {}
      const memberDebts = {}
      
      groupExpenses.forEach(expense => {
        const paidBy = expense.paidBy || 'Unknown'
        const amount = parseFloat(expense.amount || 0)
        const splitMembers = expense.splitMembers || group.members || []
        const splitAmount = amount / splitMembers.length

        // Add to paid amount
        memberContributions[paidBy] = (memberContributions[paidBy] || 0) + amount

        // Calculate what each member owes
        splitMembers.forEach(memberId => {
          if (!memberDebts[memberId]) {
            memberDebts[memberId] = { owes: 0, isOwed: 0 }
          }
          
          if (memberId === paidBy) {
            memberDebts[memberId].isOwed += (amount - splitAmount)
          } else {
            memberDebts[memberId].owes += splitAmount
          }
        })
      })

      // Calculate net balances
      const memberBalances = {}
      Object.keys(memberDebts).forEach(memberId => {
        const debt = memberDebts[memberId]
        memberBalances[memberId] = debt.isOwed - debt.owes
      })

      // Category breakdown
      const categories = {}
      groupExpenses.forEach(expense => {
        const category = expense.category || 'Other'
        categories[category] = (categories[category] || 0) + parseFloat(expense.amount || 0)
      })

      const topCategory = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)[0]

      // Recent activity (last 5 expenses)
      const recentActivity = groupExpenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)

      // Settlement status
      const hasUnsettledDebts = Object.values(memberBalances).some(balance => Math.abs(balance) > 1)
      const settlementStatus = hasUnsettledDebts ? 'pending' : 'settled'

      return {
        ...group,
        totalSpent,
        memberContributions,
        memberBalances,
        expenseCount,
        avgExpense,
        topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
        categories,
        recentActivity,
        settlementStatus
      }
    })

    // Overall statistics
    const totalGroupSpending = analytics.reduce((sum, group) => sum + group.totalSpent, 0)
    const totalGroupExpenses = analytics.reduce((sum, group) => sum + group.expenseCount, 0)
    const activeGroups = analytics.filter(group => group.expenseCount > 0).length
    const groupsNeedingSettlement = analytics.filter(group => group.settlementStatus === 'pending').length

    return {
      analytics,
      totalGroupSpending,
      totalGroupExpenses,
      activeGroups,
      groupsNeedingSettlement,
      noGroups: false
    }
  }, [groups, expenses])

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

  const getGroupIcon = (category) => {
    const icons = {
      general: '👥',
      travel: '✈️',
      home: '🏠',
      couple: '💑',
      friends: '👫',
      family: '👨‍👩‍👧‍👦',
      work: '💼',
      event: '🎉',
      roommates: '🏡',
      other: '📋'
    }
    return icons[category] || '👥'
  }

  const getMemberName = (memberId, groupMembers) => {
    const member = groupMembers?.find(m => m.id === memberId)
    return member?.name || `Member ${memberId}`
  }

  if (groupAnalytics.noGroups) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Analytics</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-4xl mb-4">👥</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Group Data</h4>
            <p className="text-gray-500 mb-6">{groupAnalytics.message}</p>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              Create or Join a Group
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Group Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Overview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 rounded-lg p-4 text-center"
          >
            <div className="text-2xl mb-1">💰</div>
            <div className="text-sm text-blue-600 font-medium">Total Spending</div>
            <div className="text-lg font-bold text-blue-900">
              ₹{groupAnalytics.totalGroupSpending.toLocaleString()}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-green-50 rounded-lg p-4 text-center"
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-sm text-green-600 font-medium">Group Expenses</div>
            <div className="text-lg font-bold text-green-900">
              {groupAnalytics.totalGroupExpenses}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-purple-50 rounded-lg p-4 text-center"
          >
            <div className="text-2xl mb-1">👥</div>
            <div className="text-sm text-purple-600 font-medium">Active Groups</div>
            <div className="text-lg font-bold text-purple-900">
              {groupAnalytics.activeGroups}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-orange-50 rounded-lg p-4 text-center"
          >
            <div className="text-2xl mb-1">⚠️</div>
            <div className="text-sm text-orange-600 font-medium">Need Settlement</div>
            <div className="text-lg font-bold text-orange-900">
              {groupAnalytics.groupsNeedingSettlement}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Individual Group Analytics */}
      <div className="grid gap-6">
        {groupAnalytics.analytics.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getGroupIcon(group.category)}</span>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                  <div className="text-sm text-gray-500">
                    {group.members?.length || 0} members • {group.expenseCount} expenses
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                group.settlementStatus === 'settled' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {group.settlementStatus === 'settled' ? '✅ Settled' : '⏳ Pending Settlement'}
              </div>
            </div>

            {group.expenseCount === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <div className="text-gray-500">No expenses yet in this group</div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Group Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-900">
                      ₹{group.totalSpent.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">Total Spent</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-900">
                      ₹{Math.round(group.avgExpense).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Avg Expense</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-900 flex items-center justify-center space-x-1">
                      {group.topCategory && (
                        <>
                          <span>{getCategoryIcon(group.topCategory.name)}</span>
                          <span>{group.topCategory.name}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-purple-600">Top Category</div>
                  </div>
                </div>

                {/* Member Balances */}
                {Object.keys(group.memberBalances).length > 0 && (
                  <div>
                    <h5 className="text-md font-semibold text-gray-900 mb-3">Member Balances</h5>
                    <div className="space-y-2">
                      {Object.entries(group.memberBalances).map(([memberId, balance]) => (
                        <div
                          key={memberId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="font-medium text-gray-900">
                            {getMemberName(memberId, group.members)}
                          </div>
                          <div className={`font-semibold ${
                            balance > 0 
                              ? 'text-green-600' 
                              : balance < 0 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                          }`}>
                            {balance > 0 && '+'}₹{Math.abs(balance).toLocaleString()}
                            {balance > 0 && ' (owed)'}
                            {balance < 0 && ' (owes)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                {group.recentActivity.length > 0 && (
                  <div>
                    <h5 className="text-md font-semibold text-gray-900 mb-3">Recent Activity</h5>
                    <div className="space-y-2">
                      {group.recentActivity.map((expense, idx) => (
                        <div
                          key={expense.id || idx}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {expense.description || 'No description'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(expense.date).toLocaleDateString()} • 
                                Paid by {getMemberName(expense.paidBy, group.members)}
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-gray-900">
                            ₹{parseFloat(expense.amount || 0).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default GroupExpenseAnalytics