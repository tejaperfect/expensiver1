import React, { useState } from 'react'
import { motion } from 'framer-motion'
import ExpenseList from '../components/expense/ExpenseList'
import WalletManagement from '../components/wallet/WalletManagement'
import BudgetManagement from '../components/budget/BudgetManagement'
import Button from '../components/common/Button'

const ExpensesPage = () => {
  const [activeTab, setActiveTab] = useState('expenses')
  
  const tabs = [
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'wallet', label: 'Wallet', icon: '👛' },
    { id: 'budget', label: 'Budget', icon: '🎯' }
  ]
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'expenses':
        return <ExpenseList />
      case 'wallet':
        return <WalletManagement />
      case 'budget':
        return <BudgetManagement />
      default:
        return <ExpenseList />
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal Finance</h1>
          <p className="text-gray-600 mt-1">
            Manage your expenses, wallet, and budget all in one place
          </p>
        </div>
      </motion.div>
      
      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="border-b border-gray-200"
      >
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </motion.div>
      
      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        {renderTabContent()}
      </motion.div>
    </div>
  )
}

export default ExpensesPage