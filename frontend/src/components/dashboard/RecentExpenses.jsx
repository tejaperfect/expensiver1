import React from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const RecentExpenses = () => {
  const recentExpenses = [
    {
      id: 1,
      description: 'Grocery Shopping',
      amount: 125.5,
      category: 'Food & Dining',
      date: '2025-08-27',
      type: 'personal',
      icon: '🛒'
    },
    {
      id: 2,
      description: 'Team Lunch',
      amount: 85.0,
      category: 'Food & Dining',
      date: '2025-08-26',
      type: 'group',
      group: 'Office Team',
      icon: '🍽️'
    },
    {
      id: 3,
      description: 'Uber Ride',
      amount: 24.75,
      category: 'Transportation',
      date: '2025-08-26',
      type: 'personal',
      icon: '🚗'
    },
    {
      id: 4,
      description: 'Monthly Gym',
      amount: 45.0,
      category: 'Health & Fitness',
      date: '2025-08-25',
      type: 'personal',
      icon: '💪'
    },
    {
      id: 5,
      description: 'Movie Night',
      amount: 60.0,
      category: 'Entertainment',
      date: '2025-08-24',
      type: 'group',
      group: 'Friends',
      icon: '🎬'
    }
  ]

  const formatDate = dateString => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <div className='card p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold text-gray-900'>Recent Expenses</h3>
        <Button variant='ghost' size='sm'>
          View All
        </Button>
      </div>

      <div className='space-y-4'>
        {recentExpenses.map((expense, index) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className='flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer'
          >
            <div className='w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center'>
              <span className='text-lg'>{expense.icon}</span>
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <h4 className='font-medium text-gray-900 truncate'>
                  {expense.description}
                </h4>
                <span className='font-semibold text-gray-900'>
                  ${expense.amount.toFixed(2)}
                </span>
              </div>

              <div className='flex items-center space-x-2 mt-1'>
                <span className='text-sm text-gray-500'>
                  {expense.category}
                </span>
                <span className='text-gray-300'>•</span>
                <span className='text-sm text-gray-500'>
                  {formatDate(expense.date)}
                </span>
                {expense.type === 'group' && (
                  <>
                    <span className='text-gray-300'>•</span>
                    <span className='text-sm text-primary-600'>
                      {expense.group}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              {expense.type === 'group' && (
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800'>
                  Group
                </span>
              )}
              <button className='text-gray-400 hover:text-gray-600 transition-colors'>
                <span className='text-lg'>⋯</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {recentExpenses.length === 0 && (
        <div className='text-center py-12'>
          <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <span className='text-2xl text-gray-400'>💰</span>
          </div>
          <h4 className='text-lg font-medium text-gray-900 mb-2'>
            No expenses yet
          </h4>
          <p className='text-gray-500 mb-4'>
            Start tracking your expenses to see them here
          </p>
          <Button variant='primary'>Add Your First Expense</Button>
        </div>
      )}
    </div>
  )
}

export default RecentExpenses
