import React from 'react'
import { render as rtlRender } from '@testing-library/react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Import all the slices
import authSlice from '../store/slices/authSlice'
import userSlice from '../store/slices/userSlice'
import expenseSlice from '../store/slices/expenseSlice'
import groupSlice from '../store/slices/groupSlice'
import chatSlice from '../store/slices/chatSlice'
import aiSlice from '../store/slices/aiSlice'
import paymentSlice from '../store/slices/paymentSlice'
import analyticsSlice from '../store/slices/analyticsSlice'
import uiSlice from '../store/slices/uiSlice'

// Mock user data
export const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'test-avatar.jpg',
  createdAt: '2024-01-01T00:00:00Z'
}

// Mock expenses data
export const mockExpenses = [
  {
    id: '1',
    description: 'Lunch',
    amount: 250,
    category: 'Food & Dining',
    date: '2024-01-15',
    paidBy: 'user123'
  },
  {
    id: '2',
    description: 'Uber ride',
    amount: 120,
    category: 'Transportation',
    date: '2024-01-14',
    paidBy: 'user123'
  }
]

// Mock groups data
export const mockGroups = [
  {
    id: 'group1',
    name: 'Office Team',
    category: 'work',
    members: [
      { id: 'user123', name: 'Test User', email: 'test@example.com' },
      { id: 'user456', name: 'John Doe', email: 'john@example.com' }
    ]
  }
]

// Default initial state
const defaultInitialState = {
  auth: {
    user: mockUser,
    token: 'mock-token',
    isAuthenticated: true,
    loading: false,
    error: null
  },
  user: {
    profile: mockUser,
    settings: {
      language: 'en',
      currency: 'INR',
      theme: 'light'
    },
    loading: false,
    error: null
  },
  expense: {
    expenses: mockExpenses,
    loading: false,
    error: null
  },
  groups: {
    groups: mockGroups,
    currentGroup: null,
    loading: false,
    error: null
  },
  chat: {
    conversations: [],
    messages: {},
    loading: false,
    error: null
  },
  ai: {
    messages: [],
    loading: false,
    error: null
  },
  payment: {
    transactions: [],
    loading: false,
    error: null
  },
  analytics: {
    reports: [],
    insights: [],
    loading: false,
    error: null
  },
  ui: {
    sidebarCollapsed: false,
    toasts: []
  }
}

function createTestStore(initialState = {}) {
  const mergedState = {
    ...defaultInitialState,
    ...initialState
  }

  return configureStore({
    reducer: {
      auth: authSlice,
      user: userSlice,
      expense: expenseSlice,
      groups: groupSlice,
      chat: chatSlice,
      ai: aiSlice,
      payment: paymentSlice,
      analytics: analyticsSlice,
      ui: uiSlice,
    },
    preloadedState: mergedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })
}

function render(
  ui,
  {
    initialState = {},
    store = createTestStore(initialState),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    )
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock functions for common use cases
export const mockDispatch = vi.fn()
export const mockNavigate = vi.fn()

// Mock React Router hooks
export const mockUseNavigate = () => mockNavigate
export const mockUseLocation = () => ({ pathname: '/' })
export const mockUseParams = () => ({})

// Mock framer-motion
export const mockFramerMotion = {
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    form: ({ children, ...props }) => React.createElement('form', props, children),
    button: ({ children, ...props }) => React.createElement('button', props, children),
  },
  AnimatePresence: ({ children }) => children,
}

// Re-export everything
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { render, createTestStore }