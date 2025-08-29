import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // Modal states
  modals: {
    addExpense: false,
    editExpense: false,
    createGroup: false,
    joinGroup: false,
    paymentModal: false,
    settingsModal: false,
    confirmDialog: false,
  },
  
  // Loading states
  loading: {
    global: false,
    expenses: false,
    groups: false,
    payments: false,
    analytics: false,
  },
  
  // UI preferences
  theme: localStorage.getItem('theme') || 'light',
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  
  // Notifications
  notifications: [],
  
  // Toast messages
  toasts: [],
  
  // Current view states
  currentView: 'dashboard',
  activeTab: 'overview',
  
  // Form states
  forms: {
    expense: {
      isEditing: false,
      data: null,
    },
    group: {
      isEditing: false,
      data: null,
    },
  },
  
  // Confirmation dialog
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Modal actions
    openModal: (state, action) => {
      const { modalName, data } = action.payload
      state.modals[modalName] = true
      if (data && state.forms[modalName.replace('Modal', '')]) {
        state.forms[modalName.replace('Modal', '')].data = data
        state.forms[modalName.replace('Modal', '')].isEditing = !!data.id
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload
      state.modals[modalName] = false
      // Clear form data when closing modal
      const formName = modalName.replace('Modal', '')
      if (state.forms[formName]) {
        state.forms[formName].data = null
        state.forms[formName].isEditing = false
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modal => {
        state.modals[modal] = false
      })
      // Clear all form data
      Object.keys(state.forms).forEach(form => {
        state.forms[form].data = null
        state.forms[form].isEditing = false
      })
    },
    
    // Loading actions
    setLoading: (state, action) => {
      const { key, value } = action.payload
      if (state.loading.hasOwnProperty(key)) {
        state.loading[key] = value
      }
    },
    
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload
    },
    
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
      localStorage.setItem('sidebarCollapsed', state.sidebarCollapsed.toString())
    },
    
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload
      localStorage.setItem('sidebarCollapsed', action.payload.toString())
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      }
      state.notifications.unshift(notification)
    },
    
    markNotificationAsRead: (state, action) => {
      const notificationId = action.payload
      const notification = state.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true
      })
    },
    
    removeNotification: (state, action) => {
      const notificationId = action.payload
      state.notifications = state.notifications.filter(n => n.id !== notificationId)
    },
    
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // Toast actions
    addToast: (state, action) => {
      const toast = {
        id: Date.now(),
        type: 'info',
        duration: 5000,
        ...action.payload,
      }
      state.toasts.push(toast)
    },
    
    removeToast: (state, action) => {
      const toastId = action.payload
      state.toasts = state.toasts.filter(t => t.id !== toastId)
    },
    
    clearToasts: (state) => {
      state.toasts = []
    },
    
    // View actions
    setCurrentView: (state, action) => {
      state.currentView = action.payload
    },
    
    setActiveTab: (state, action) => {
      state.activeTab = action.payload
    },
    
    // Confirmation dialog actions
    showConfirmDialog: (state, action) => {
      state.confirmDialog = {
        isOpen: true,
        ...action.payload,
      }
    },
    
    hideConfirmDialog: (state) => {
      state.confirmDialog = {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
      }
    },
    
    // Form actions
    setFormData: (state, action) => {
      const { formName, data } = action.payload
      if (state.forms[formName]) {
        state.forms[formName].data = data
      }
    },
    
    clearFormData: (state, action) => {
      const formName = action.payload
      if (state.forms[formName]) {
        state.forms[formName].data = null
        state.forms[formName].isEditing = false
      }
    },
    
    setFormEditing: (state, action) => {
      const { formName, isEditing } = action.payload
      if (state.forms[formName]) {
        state.forms[formName].isEditing = isEditing
      }
    },
  },
})

export const {
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setGlobalLoading,
  setTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarCollapsed,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  addToast,
  removeToast,
  clearToasts,
  setCurrentView,
  setActiveTab,
  showConfirmDialog,
  hideConfirmDialog,
  setFormData,
  clearFormData,
  setFormEditing,
} = uiSlice.actions

export default uiSlice.reducer