import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import userSlice from './slices/userSlice'
import expenseSlice from './slices/expenseSlice'
import groupSlice from './slices/groupSlice'
import chatSlice from './slices/chatSlice'
import aiSlice from './slices/aiSlice'
import paymentSlice from './slices/paymentSlice'
import analyticsSlice from './slices/analyticsSlice'
import uiSlice from './slices/uiSlice'
import notificationSlice from './slices/notificationSlice'

export const store = configureStore({
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
    notifications: notificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

// Export types for TypeScript users
// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch