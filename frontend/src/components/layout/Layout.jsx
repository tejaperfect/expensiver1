import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ConversationList from '../chat/ConversationList'
import AIAssistant from '../ai/AIAssistant'
import NotificationList from '../notifications/NotificationList'
import { toggleSidebar } from '../../store/slices/uiSlice'

const Layout = ({ children }) => {
  const dispatch = useDispatch()
  const { sidebarCollapsed } = useSelector((state) => state.ui)
  const { unreadCounts } = useSelector((state) => state.chat)
  const location = useLocation()
  const [showChat, setShowChat] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts || {}).reduce((total, count) => total + count, 0)
  }

  const handleSidebarToggle = () => {
    dispatch(toggleSidebar())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={handleSidebarToggle}
        currentPath={location.pathname}
      />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Header */}
        <Header onSidebarToggle={handleSidebarToggle} />
        
        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3">
        {/* Notifications Button */}
        <button
          onClick={() => setShowNotifications(true)}
          className="w-14 h-14 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          title="Notifications"
        >
          <span className="text-xl">🔔</span>
          {getTotalUnreadCount() > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {getTotalUnreadCount() > 99 ? '99+' : getTotalUnreadCount()}
            </span>
          )}
        </button>
        
        {/* AI Assistant Button */}
        <button
          onClick={() => setShowAI(true)}
          className="w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          title="AI Assistant"
        >
          <span className="text-xl">🤖</span>
        </button>
        
        {/* Chat Button */}
        <button
          onClick={() => setShowChat(true)}
          className="w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          title="Open Chat"
        >
          <span className="text-xl">💬</span>
        </button>
      </div>
      
      {/* Notifications */}
      <NotificationList
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      
      {/* Chat Interface */}
      <ConversationList
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
      
      {/* AI Assistant */}
      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />
      
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={handleSidebarToggle}
        />
      )}
    </div>
  )
}

export default Layout