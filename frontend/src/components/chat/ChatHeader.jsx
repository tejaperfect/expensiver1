import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const ChatHeader = ({ group, onlineCount, onClose, onToggleInfo }) => {
  const [showInfo, setShowInfo] = useState(false)

  const handleToggleInfo = () => {
    setShowInfo(!showInfo)
    if (onToggleInfo) {
      onToggleInfo(!showInfo)
    }
  }

  const getCategoryIcon = (category) => {
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

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Group Avatar */}
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-lg">{getCategoryIcon(group?.category)}</span>
          </div>

          {/* Group Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{group?.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{group?.totalMembers || 0} members</span>
              {onlineCount > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{onlineCount} online</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          {/* Group Info Toggle */}
          <button
            onClick={handleToggleInfo}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Group Information"
          >
            <span className="text-gray-500">ℹ️</span>
          </button>

          {/* Video Call Button */}
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Start Video Call"
          >
            <span className="text-gray-500">📹</span>
          </button>

          {/* Voice Call Button */}
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Start Voice Call"
          >
            <span className="text-gray-500">📞</span>
          </button>

          {/* More Options */}
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="More Options"
          >
            <span className="text-gray-500">⋮</span>
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close Chat"
            >
              <span className="text-gray-400">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Group Info Panel */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Description</div>
              <div className="text-gray-900 mt-1">
                {group?.description || 'No description'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Category</div>
              <div className="text-gray-900 mt-1 capitalize">
                {group?.category || 'General'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Created</div>
              <div className="text-gray-900 mt-1">
                {group?.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Total Expenses</div>
              <div className="text-gray-900 mt-1">
                ${group?.totalExpenses?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" size="sm">
              Add Expense
            </Button>
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button variant="outline" size="sm">
              Manage Members
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ChatHeader