import { io } from 'socket.io-client'
import { store } from '../store/store'
import { addMessage, setOnlineUsers } from '../store/slices/chatSlice'
import { addNotification } from '../store/slices/notificationSlice'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect() {
    // Connect to the Socket.IO server
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      withCredentials: true
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id)
      this.isConnected = true
      
      // Join user room
      const state = store.getState()
      if (state.auth.user) {
        this.joinUserRoom(state.auth.user.id)
      }
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
      this.isConnected = false
    })

    // Handle real-time events
    this.setupEventListeners()
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.isConnected = false
    }
  }

  setupEventListeners() {
    // New message
    this.socket.on('new-message', (data) => {
      console.log('New message received:', data)
      store.dispatch(addMessage(data.message))
    })

    // Message edited
    this.socket.on('message-edited', (data) => {
      console.log('Message edited:', data)
      // Handle message edit in store
    })

    // Message deleted
    this.socket.on('message-deleted', (data) => {
      console.log('Message deleted:', data)
      // Handle message delete in store
    })

    // Reaction added
    this.socket.on('reaction-added', (data) => {
      console.log('Reaction added:', data)
      // Handle reaction in store
    })

    // User joined group
    this.socket.on('user-joined', (data) => {
      console.log('User joined:', data)
      // Handle user join in store
    })

    // User left group
    this.socket.on('user-left', (data) => {
      console.log('User left:', data)
      // Handle user leave in store
    })

    // New notification
    this.socket.on('new-notification', (data) => {
      console.log('New notification:', data)
      store.dispatch(addNotification(data.notification))
    })

    // Online users update
    this.socket.on('online-users', (data) => {
      console.log('Online users:', data)
      store.dispatch(setOnlineUsers({ groupId: data.groupId, users: data.users }))
    })

    // Typing indicator
    this.socket.on('typing', (data) => {
      console.log('User typing:', data)
      // Handle typing indicator
    })
  }

  joinUserRoom(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-user-room', userId)
    }
  }

  joinGroup(groupId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-group', groupId)
    }
  }

  leaveGroup(groupId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-group', groupId)
    }
  }

  sendMessage(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', data)
    }
  }

  sendTyping(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', data)
    }
  }

  markMessageAsRead(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message-read', data)
    }
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService