import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import { fetchMessages, sendMessage, markMessageAsRead } from '../../store/slices/chatSlice'
import { addToast } from '../../store/slices/uiSlice'
import socketService from '../../services/socketService'

const ChatInterface = ({ group, isOpen, onClose }) => {
  const dispatch = useDispatch()
  const chatContainerRef = useRef(null)
  const { 
    messages, 
    loading, 
    sendingMessage, 
    error,
    onlineUsers 
  } = useSelector(state => state.chat)
  
  const { user } = useSelector(state => state.auth)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])

  useEffect(() => {
    if (isOpen && group?.id) {
      dispatch(fetchMessages(group.id))
      // Join group room
      socketService.joinGroup(group.id)
    }
    
    return () => {
      // Leave group room
      if (group?.id) {
        socketService.leaveGroup(group.id)
      }
    }
  }, [dispatch, isOpen, group?.id])

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (messageData) => {
    if (!messageData.content.trim()) return

    try {
      // Send via socket for real-time
      socketService.sendMessage({
        groupId: group.id,
        ...messageData
      })
      
      // Also send via API for persistence
      await dispatch(sendMessage({
        groupId: group.id,
        ...messageData
      })).unwrap()
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to send message. Please try again.'
      }))
    }
  }

  const handleTyping = (isTyping) => {
    setIsTyping(isTyping)
    // In a real app, this would send typing indicators via Socket.IO
  }

  const getGroupMessages = () => {
    return messages[group?.id] || []
  }

  const getOnlineCount = () => {
    const groupOnlineUsers = onlineUsers[group?.id] || []
    return groupOnlineUsers.length
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Chat Header */}
        <ChatHeader
          group={group}
          onlineCount={getOnlineCount()}
          onClose={onClose}
        />

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : (
            <MessageList
              messages={getGroupMessages()}
              currentUser={user}
              group={group}
            />
          )}

          {/* Typing Indicators */}
          <AnimatePresence>
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 text-sm text-gray-500"
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} is typing...`
                    : `${typingUsers.length} people are typing...`
                  }
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white">
          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            loading={sendingMessage}
            placeholder={`Message ${group?.name}...`}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ChatInterface