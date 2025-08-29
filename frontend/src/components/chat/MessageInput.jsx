import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const MessageInput = ({ onSendMessage, onTyping, loading, placeholder = "Type a message..." }) => {
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  // Common emojis for quick access
  const quickEmojis = ['😊', '😂', '❤️', '👍', '😮', '😢', '😡', '🎉', '💰', '✅']

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  const handleInputChange = (e) => {
    const value = e.target.value
    setMessage(value)

    // Handle typing indicators
    if (onTyping) {
      onTyping(true)
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false)
      }, 2000)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = () => {
    if ((!message.trim() && attachments.length === 0) || loading) return

    const messageData = {
      content: message.trim(),
      attachments: attachments,
      timestamp: new Date().toISOString(),
      type: 'text'
    }

    onSendMessage(messageData)
    setMessage('')
    setAttachments([])
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Stop typing indicator
    if (onTyping) {
      onTyping(false)
    }
  }

  const handleEmojiClick = (emoji) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      url: URL.createObjectURL(file)
    }))

    setAttachments(prev => [...prev, ...newAttachments])
  }

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== attachmentId)
      // Cleanup object URLs
      const removed = prev.find(att => att.id === attachmentId)
      if (removed?.url) {
        URL.revokeObjectURL(removed.url)
      }
      return updated
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2 text-sm"
            >
              <div className="text-lg">
                {attachment.type.startsWith('image/') ? '🖼️' : '📎'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{attachment.name}</div>
                <div className="text-gray-500 text-xs">{attachment.size}</div>
              </div>
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                ×
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-lg"
        >
          <div className="flex flex-wrap gap-2">
            {quickEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="flex items-end space-x-2">
        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Attach file"
        >
          📎
        </button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
            disabled={loading}
          />
          
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Add emoji"
          >
            😊
          </button>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={(!message.trim() && attachments.length === 0) || loading}
          loading={loading}
          className="px-4 py-2"
        >
          {loading ? '...' : '📤'}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 text-xs text-gray-400 text-center">
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  )
}

export default MessageInput