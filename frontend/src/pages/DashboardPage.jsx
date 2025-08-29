import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import StatsCard from '../components/dashboard/StatsCard'
import QuickActions from '../components/dashboard/QuickActions'
import RecentExpenses from '../components/dashboard/RecentExpenses'
import SpendingChart from '../components/dashboard/SpendingChart'
import AIInsightsWidget from '../components/ai/AIInsightsWidget'
import AIAssistant from '../components/ai/AIAssistant'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { addToast } from '../store/slices/uiSlice'
import { getDashboardAnalytics, getBudgetAnalysis } from '../store/slices/analyticsSlice'

const DashboardPage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { 
    dashboardData, 
    budgetAnalysis, 
    loading: analyticsLoading, 
    error: analyticsError 
  } = useSelector((state) => state.analytics)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showAI, setShowAI] = useState(false)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false)
  
  // Fetch dashboard analytics on component mount
  useEffect(() => {
    if (!hasAttemptedLoad) {
      setHasAttemptedLoad(true)
      dispatch(getDashboardAnalytics('30d'))
      dispatch(getBudgetAnalysis('30d'))
    }
  }, [dispatch, hasAttemptedLoad])
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])
  
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }
  
  // Generate stats data from backend analytics or use fallback
  const statsData = [
    {
      title: 'Total Spent This Month',
      value: `$${(dashboardData?.overview?.totalAmount || 0).toFixed(2)}`,
      icon: '💰',
      change: `${dashboardData?.comparison?.change >= 0 ? '+' : ''}${(dashboardData?.comparison?.change?.toFixed(1) || '0')}%`,
      changeType: (dashboardData?.comparison?.change || 0) >= 0 ? 'negative' : 'positive',
      subtitle: 'Compared to last month'
    },
    {
      title: 'Budget Remaining',
      value: `$${(dashboardData?.overview?.totalAmount ? (4000 - dashboardData.overview.totalAmount) : 0).toFixed(2)}`,
      icon: '🎯',
      change: `${dashboardData?.overview?.totalAmount ? Math.round(((4000 - dashboardData.overview.totalAmount) / 4000) * 100) : 0}%`,
      changeType: 'positive',
      subtitle: 'Of $4,000 budget'
    },
    {
      title: 'Active Groups',
      value: (dashboardData?.overview?.totalExpenses?.toString() || '0'),
      icon: '👥',
      change: '+2',
      changeType: 'positive',
      subtitle: 'This month'
    },
    {
      title: 'Money Saved',
      value: `$${(dashboardData?.overview?.totalAmount ? (dashboardData.overview.totalAmount * 0.2) : 0).toFixed(2)}`,
      icon: '💎',
      change: '+25%',
      changeType: 'positive',
      subtitle: 'Smart spending habits'
    }
  ]
  
  const handleStatsClick = (title) => {
    dispatch(addToast({
      type: 'info',
      message: `Navigating to ${title} details...`,
      duration: 2000
    }))
  }
  
  // Always render the dashboard, even during loading or errors
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName || user?.name || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's your financial overview for today
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button variant="outline" size="md">
            📊 View Reports
          </Button>
          <Button variant="primary" size="md">
            ➕ Add Expense
          </Button>
        </div>
      </motion.div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <StatsCard
              {...stat}
              onClick={() => handleStatsClick(stat.title)}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts and Recent Expenses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Spending Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <SpendingChart />
          </motion.div>
          
          {/* Recent Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <RecentExpenses />
          </motion.div>
        </div>
        
        {/* Right Column - Quick Actions and Widgets */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <QuickActions />
          </motion.div>
          
          {/* Budget Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
            
            <div className="space-y-4">
              {[
                { category: 'Food & Dining', spent: 0, budget: 0, color: 'bg-red-500' },
                { category: 'Transportation', spent: 0, budget: 0, color: 'bg-blue-500' },
                { category: 'Entertainment', spent: 0, budget: 0, color: 'bg-green-500' },
                { category: 'Shopping', spent: 0, budget: 0, color: 'bg-yellow-500' }
              ].map((item, index) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.category}</span>
                    <span className="text-gray-500">
                      ${item.spent} / ${item.budget}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 0.8, delay: 0.9 + index * 0.1 }}
                      className={`h-2 rounded-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Recent Groups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="card p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Groups</h3>
            
            <div className="space-y-3">
              {[
                { name: 'Office Team', members: 0, balance: 0, avatar: '🏢' },
                { name: 'College Friends', members: 0, balance: 0, avatar: '🎓' },
                { name: 'Family Trip', members: 0, balance: 0, avatar: '✈️' }
              ].map((group, index) => (
                <div key={group.name} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{group.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{group.name}</h4>
                    <p className="text-sm text-gray-500">{group.members} members</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-semibold ${
                      group.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {group.balance >= 0 ? '+' : ''}${Math.abs(group.balance).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="ghost" className="w-full mt-4">
              View All Groups
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Error Message */}
      {analyticsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{analyticsError}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    dispatch(getDashboardAnalytics('30d'))
                    dispatch(getBudgetAnalysis('30d'))
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Assistant Modal */}
      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />
    </div>
  )
}

export default DashboardPage