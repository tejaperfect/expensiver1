import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Async thunks
export const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return settings
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Settings update failed')
    }
  }
)

export const exportData = createAsyncThunk(
  'user/exportData',
  async ({ format }, { rejectWithValue }) => {
    try {
      // Simulate API call for data export
      await new Promise(resolve => setTimeout(resolve, 3000))
      return {
        format,
        downloadUrl: `/api/exports/user-data-${Date.now()}.${format}`,
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Data export failed')
    }
  }
)

export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call for account deletion
      await new Promise(resolve => setTimeout(resolve, 2000))
      return { message: 'Account deletion initiated' }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Account deletion failed')
    }
  }
)

const initialState = {
  profile: null,
  settings: {
    language: 'en',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'indian',
    theme: 'light',
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    expenseReminders: true,
    groupUpdates: true,
    paymentAlerts: true,
    weeklyReports: true,
    monthlyReports: true,
    budgetAlerts: true,
    profileVisibility: 'public',
    dataAnalytics: true,
    thirdPartySharing: false,
    locationTracking: false,
    activityHistory: true,
    searchableProfile: true
  },
  preferences: {
    currency: 'USD',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      showProfile: true,
      showActivity: false,
    },
  },
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload }
    },
    setPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    setSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    clearProfile: (state) => {
      state.profile = null
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Update Settings
      .addCase(updateSettings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.loading = false
        state.settings = { ...state.settings, ...action.payload }
        state.error = null
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Export Data
      .addCase(exportData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(exportData.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(exportData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Delete Account
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false
        state.profile = null
        state.settings = initialState.settings
        state.error = null
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { 
  setProfile, 
  updateProfile, 
  setPreferences, 
  setSettings, 
  clearProfile, 
  setLoading, 
  setError 
} = userSlice.actions
export default userSlice.reducer