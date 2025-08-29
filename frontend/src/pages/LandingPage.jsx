import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const LandingPage = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary-50 to-primary-100'>
      {/* Navigation */}
      <nav className='container mx-auto px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-xl'>E</span>
            </div>
            <span className='text-2xl font-bold text-gray-900'>Expensiver</span>
          </div>
          <div className='flex items-center space-x-4'>
            <Link to='/login' className='btn btn-ghost'>
              Login
            </Link>
            <Link to='/register' className='btn btn-primary'>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className='container mx-auto px-6 py-16'>
        <div className='text-center'>
          <motion.h1
            className='text-5xl md:text-6xl font-bold text-gray-900 mb-6'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Manage Your Finances
            <span className='text-primary-600'> Smarter</span>
          </motion.h1>

          <motion.p
            className='text-xl text-gray-600 mb-8 max-w-3xl mx-auto'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Take control of your personal and group expenses with our
            intelligent finance management platform. Track spending, split
            bills, and get AI-powered insights.
          </motion.p>

          <motion.div
            className='flex flex-col sm:flex-row gap-4 justify-center'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link to='/register' className='btn btn-primary btn-lg px-8'>
              Start Free Trial
            </Link>
            <Link to='/login' className='btn btn-outline btn-lg px-8'>
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          className='grid md:grid-cols-3 gap-8 mt-20'
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className='text-center'>
            <div className='w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-primary-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Personal Finance
            </h3>
            <p className='text-gray-600'>
              Track your personal expenses, set budgets, and monitor your
              financial health with detailed analytics.
            </p>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-success-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              Group Expenses
            </h3>
            <p className='text-gray-600'>
              Create groups, split bills, track shared expenses, and manage
              group finances with ease.
            </p>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-4'>
              <svg
                className='w-8 h-8 text-warning-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                />
              </svg>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              AI Insights
            </h3>
            <p className='text-gray-600'>
              Get personalized recommendations, spending insights, and smart
              budgeting suggestions powered by AI.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LandingPage
