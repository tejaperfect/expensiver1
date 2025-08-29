import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const Sidebar = ({ isCollapsed, onToggle, currentPath }) => {
  const location = useLocation()
  
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      description: 'Overview & insights'
    },
    {
      name: 'Expenses',
      path: '/expenses',
      icon: '💰',
      description: 'Track spending'
    },
    {
      name: 'Wallet',
      path: '/wallet',
      icon: '👛',
      description: 'Manage funds'
    },
    {
      name: 'Budget',
      path: '/budget',
      icon: '🎯',
      description: 'Set limits'
    },
    {
      name: 'Groups',
      path: '/groups',
      icon: '👥',
      description: 'Shared expenses'
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: '📈',
      description: 'Reports & trends'
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: '👤',
      description: 'Account settings'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: '⚙️',
      description: 'Preferences'
    }
  ]

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? '64px' : '256px' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm z-40"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center p-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="ml-3 text-xl font-bold text-gray-900"
            >
              Expensiver
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="ml-3 flex-1"
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </motion.div>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-1 h-6 bg-primary-600 rounded-full absolute right-0"
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-lg">
              {isCollapsed ? '👉' : '👈'}
            </span>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="ml-2 text-sm font-medium"
              >
                Collapse
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default Sidebar