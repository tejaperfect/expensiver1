import React from 'react'
import { motion } from 'framer-motion'

const MessageList = ({ messages, currentUser, group }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
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
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true
    
    const currentDate = new Date(currentMessage.timestamp).toDateString()
    const previousDate = new Date(previousMessage.timestamp).toDateString()
    
    return currentDate !== previousDate
  }

  const shouldShowAvatar = (currentMessage, nextMessage) => {
    if (!nextMessage) return true
    if (currentMessage.senderId !== nextMessage.senderId) return true
    
    // Show avatar if messages are more than 5 minutes apart
    const timeDiff = new Date(nextMessage.timestamp) - new Date(currentMessage.timestamp)
    return timeDiff > 5 * 60 * 1000
  }

  const getMessageType = (message) => {
    if (message.type === 'system') return 'system'
    if (message.senderId === currentUser?.id) return 'own'
    return 'other'
  }

  const renderSystemMessage = (message) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center my-4"
    >
      <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600">
        {message.content}
      </div>
    </motion.div>
  )

  const renderMessage = (message, index) => {
    const messageType = getMessageType(message)
    const previousMessage = index > 0 ? messages[index - 1] : null
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null
    const showAvatar = shouldShowAvatar(message, nextMessage)
    const showDateSeparator = shouldShowDateSeparator(message, previousMessage)

    if (message.type === 'system') {
      return (
        <div key={message.id}>
          {showDateSeparator && (
            <div className="flex justify-center my-6">
              <div className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
                {formatDate(message.timestamp)}
              </div>
            </div>
          )}
          {renderSystemMessage(message)}
        </div>
      )
    }

    return (
      <div key={message.id}>
        {showDateSeparator && (
          <div className="flex justify-center my-6">
            <div className="bg-gray-200 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">
              {formatDate(message.timestamp)}
            </div>
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`flex items-end space-x-2 mb-1 ${
            messageType === 'own' ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* Avatar for other users */}
          {messageType === 'other' && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              showAvatar ? 'visible' : 'invisible'
            }`}>
              {showAvatar && (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700">
                    {message.senderName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className={`max-w-xs lg:max-w-md ${messageType === 'own' ? 'order-1' : 'order-2'}`}>
            {/* Sender name for other users */}
            {messageType === 'other' && showAvatar && (
              <div className="text-xs text-gray-500 mb-1 ml-2">
                {message.senderName || 'Unknown User'}
              </div>
            )}

            <div
              className={`px-4 py-2 rounded-2xl break-words ${
                messageType === 'own'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
              }`}
            >
              {/* Message text */}
              <div className="text-sm leading-relaxed">
                {message.content}
              </div>

              {/* Message attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment, attachIndex) => (
                    <div key={attachIndex} className="flex items-center space-x-2">
                      <div className="text-lg">📎</div>
                      <div className="text-xs">
                        <div className="font-medium">{attachment.name}</div>
                        <div className="text-gray-400">{attachment.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamp and status */}
              <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                messageType === 'own' ? 'text-primary-100' : 'text-gray-400'
              }`}>
                <span>{formatTime(message.timestamp)}</span>
                {messageType === 'own' && (
                  <span>
                    {message.status === 'sending' && '⏳'}
                    {message.status === 'sent' && '✓'}
                    {message.status === 'delivered' && '✓✓'}
                    {message.status === 'read' && <span className="text-blue-200">✓✓</span>}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500 text-sm">
            Start the conversation with {group?.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {messages.map((message, index) => renderMessage(message, index))}
    </div>
  )
}

export default MessageList