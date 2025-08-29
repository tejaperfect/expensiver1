import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../../services/api'

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: {}, // Messages by group/conversation ID
  onlineUsers: {}, // Online users by group ID
  typingUsers: [],
  unreadCounts: {},
  isConnected: false,
  loading: false,
  sendingMessage: false,
  error: null,
}



// Async thunks
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/groups/${groupId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages')
    }
  }
)

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ groupId, content, type = 'text', attachments = [] }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/${groupId}/messages`, {
        content,
        type,
        attachments
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message')
    }
  }
)

export const markMessageAsRead = createAsyncThunk(
  'chat/markMessageAsRead',
  async ({ messageId, groupId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/${groupId}/read`, {
        messageId
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark message as read')
    }
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload
    },
    addConversation: (state, action) => {
      state.conversations.push(action.payload)
    },
    updateConversation: (state, action) => {
      const index = state.conversations.findIndex(conv => conv.id === action.payload.id)
      if (index !== -1) {
        state.conversations[index] = action.payload
      }
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload
      // Mark messages as read when opening conversation
      if (action.payload) {
        state.unreadCounts[action.payload.id] = 0
      }
    },
    setMessages: (state, action) => {
      const { groupId, messages } = action.payload
      state.messages[groupId] = messages
    },
    addMessage: (state, action) => {
      const message = action.payload
      const groupId = message.chatId
      if (!state.messages[groupId]) {
        state.messages[groupId] = []
      }
      state.messages[groupId].push(message)
      
      // Update conversation last message
      const conversation = state.conversations.find(conv => conv.id === groupId)
      if (conversation) {
        conversation.lastMessage = message
        conversation.lastMessageTime = message.createdAt
      }
      
      // Update unread count if not current conversation
      if (!state.currentConversation || state.currentConversation.id !== groupId) {
        state.unreadCounts[groupId] = (state.unreadCounts[groupId] || 0) + 1
      }
    },
    updateMessage: (state, action) => {
      const { groupId, messageId, updates } = action.payload
      const messages = state.messages[groupId] || []
      const messageIndex = messages.findIndex(msg => msg.id === messageId)
      if (messageIndex !== -1) {
        state.messages[groupId][messageIndex] = {
          ...state.messages[groupId][messageIndex],
          ...updates
        }
      }
    },
    deleteMessage: (state, action) => {
      const { groupId, messageId } = action.payload
      if (state.messages[groupId]) {
        state.messages[groupId] = state.messages[groupId].filter(msg => msg.id !== messageId)
      }
    },
    markMessageAsReadLocal: (state, action) => {
      const { messageId, groupId } = action.payload
      const messages = state.messages[groupId] || []
      const message = messages.find(msg => msg.id === messageId)
      if (message) {
        message.read = true
      }
    },
    markConversationAsRead: (state, action) => {
      const groupId = action.payload
      state.unreadCounts[groupId] = 0
      // Mark all messages in conversation as read
      const messages = state.messages[groupId] || []
      messages.forEach(message => {
        if (!message.read) {
          message.read = true
        }
      })
    },
    setOnlineUsers: (state, action) => {
      const { groupId, users } = action.payload
      state.onlineUsers[groupId] = users
    },
    addOnlineUser: (state, action) => {
      const { groupId, userId } = action.payload
      if (!state.onlineUsers[groupId]) {
        state.onlineUsers[groupId] = []
      }
      if (!state.onlineUsers[groupId].includes(userId)) {
        state.onlineUsers[groupId].push(userId)
      }
    },
    removeOnlineUser: (state, action) => {
      const { groupId, userId } = action.payload
      if (state.onlineUsers[groupId]) {
        state.onlineUsers[groupId] = state.onlineUsers[groupId].filter(id => id !== userId)
      }
    },
    setTypingUsers: (state, action) => {
      const { conversationId, users } = action.payload
      state.typingUsers = state.typingUsers.filter(typing => typing.conversationId !== conversationId)
      if (users.length > 0) {
        state.typingUsers.push({ conversationId, users })
      }
    },
    addTypingUser: (state, action) => {
      const { conversationId, userId } = action.payload
      const existing = state.typingUsers.find(typing => typing.conversationId === conversationId)
      if (existing) {
        if (!existing.users.includes(userId)) {
          existing.users.push(userId)
        }
      } else {
        state.typingUsers.push({ conversationId, users: [userId] })
      }
    },
    removeTypingUser: (state, action) => {
      const { conversationId, userId } = action.payload
      const existing = state.typingUsers.find(typing => typing.conversationId === conversationId)
      if (existing) {
        existing.users = existing.users.filter(id => id !== userId)
        if (existing.users.length === 0) {
          state.typingUsers = state.typingUsers.filter(typing => typing.conversationId !== conversationId)
        }
      }
    },
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload
    },
    setUnreadCounts: (state, action) => {
      state.unreadCounts = action.payload
    },
    updateUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload
      state.unreadCounts[conversationId] = count
    },
    clearMessages: (state, action) => {
      const groupId = action.payload
      if (groupId) {
        delete state.messages[groupId]
      } else {
        state.messages = {}
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setSendingMessage: (state, action) => {
      state.sendingMessage = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false
        const { chat } = action.payload
        state.messages[chat.id] = chat.messages
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.sendingMessage = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendingMessage = false
        const { message } = action.payload
        const groupId = message.chatId
        if (!state.messages[groupId]) {
          state.messages[groupId] = []
        }
        state.messages[groupId].push(message)
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendingMessage = false
        state.error = action.payload
      })
      
      // Mark Message as Read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { messageId, groupId } = action.payload
        const messages = state.messages[groupId] || []
        const message = messages.find(msg => msg.id === messageId)
        if (message) {
          message.status = 'read'
        }
      })
  }
})

export const {
  setConversations,
  addConversation,
  updateConversation,
  setCurrentConversation,
  setMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  markMessageAsReadLocal,
  markConversationAsRead,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  setConnectionStatus,
  setUnreadCounts,
  updateUnreadCount,
  clearMessages,
  setLoading,
  setSendingMessage,
  setError,
} = chatSlice.actions

export default chatSlice.reducer