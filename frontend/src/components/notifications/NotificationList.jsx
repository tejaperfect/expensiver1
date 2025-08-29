import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../../store/slices/notificationSlice'
import Button from '../common/Button'

const NotificationList = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const { notifications, loading, error } = useSelector(state => state.notifications)

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications())
    }
  }, [dispatch, isOpen])

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id))
  }

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead())
  }

  const handleDelete = (id) => {
    dispatch(deleteNotification(id))
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now - date) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'urgent': return 'border-l-red-600'
      default: return 'border-l-blue-500'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, x: 300 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md h-[600px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {notifications.filter(n => !n.channels?.inApp?.read).length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {notifications.filter(n => !n.channels?.inApp?.read).length} unread
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {notifications.filter(n => !n.channels?.inApp?.read).length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading notifications...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl text-red-500">⚠️</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading notifications</h3>
                  <p className="text-sm text-gray-500 mb-4">{error}</p>
                  <Button variant="primary" onClick={() => dispatch(fetchNotifications())}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl text-gray-400">🔔</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-sm text-gray-500">You're all caught up!</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      notification.channels?.inApp?.read 
                        ? 'bg-white' 
                        : 'bg-blue-50 border-l-4 ' + getPriorityColor(notification.priority)
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {notification.category}
                          </span>
                          
                          <div className="flex space-x-2">
                            {!notification.channels?.inApp?.read && (
                              <Button 
                                variant="ghost" 
                                size="xs" 
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                Mark read
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="xs" 
                              onClick={() => handleDelete(notification.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default NotificationList