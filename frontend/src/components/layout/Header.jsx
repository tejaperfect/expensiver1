import React from 'react'
import { useSelector } from 'react-redux'

const Header = ({ onSidebarToggle }) => {
  const { user } = useSelector(state => state.auth)

  return (
    <header className='bg-white border-b border-gray-200 px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Mobile menu button */}
        <button
          onClick={onSidebarToggle}
          className='p-2 rounded-lg hover:bg-gray-100 lg:hidden'
        >
          <span className='text-gray-500'>☰</span>
        </button>

        {/* Search bar */}
        <div className='flex-1 max-w-lg mx-4'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Search expenses, groups...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
            />
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center'>
              <span className='text-gray-400'>🔍</span>
            </div>
          </div>
        </div>

        {/* User menu */}
        <div className='flex items-center space-x-4'>
          {/* Notifications */}
          <button className='p-2 rounded-lg hover:bg-gray-100 relative'>
            <span className='text-gray-500'>🔔</span>
            <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
          </button>

          {/* User avatar */}
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center'>
              <span className='text-white text-sm font-medium'>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className='hidden md:block'>
              <p className='text-sm font-medium text-gray-900'>
                {user?.name || 'User'}
              </p>
              <p className='text-xs text-gray-500'>
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
