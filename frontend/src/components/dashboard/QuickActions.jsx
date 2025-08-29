import React from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const QuickActions = () => {
  const actions = [
    {
      title: 'Add Expense',
      description: 'Record a new expense',
      icon: '💰',
      color: 'bg-primary-500',
      onClick: () => console.log('Add expense')
    },
    {
      title: 'Create Group',
      description: 'Start a new expense group',
      icon: '👥',
      color: 'bg-success-500',
      onClick: () => console.log('Create group')
    },
    {
      title: 'Split Bill',
      description: 'Split an expense with friends',
      icon: '🧾',
      color: 'bg-warning-500',
      onClick: () => console.log('Split bill')
    },
    {
      title: 'Send Money',
      description: 'Send payment to a friend',
      icon: '💸',
      color: 'bg-error-500',
      onClick: () => console.log('Send money')
    }
  ]

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={action.onClick}
            className="p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
                <span className="text-lg">{action.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  {action.title}
                </h4>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default QuickActions