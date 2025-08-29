import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'

// Utility function to get initial state from localStorage
const getInitialState = () => {
  const token = authService.getStoredToken()
  const user = authService.getStoredUser()
  
  return {
    user: user || null,
    token: token || null,
    isAuthenticated: !!(token && user),
    isLoading: false,
    error: null,
  }
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      
      if (response?.success === false) {
        return rejectWithValue(response?.message || 'Login failed')
      }
      
      return response?.data || response
    } catch (error) {
      console.error('Login error in thunk:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Login failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData)
      
      if (response?.success === false) {
        return rejectWithValue(response?.message || 'Registration failed')
      }
      
      toast.success('Registration successful! Welcome to Expensiver!')
      return response?.data || response
    } catch (error) {
      console.error('Registration error in thunk:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Registration failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout()
      return { success: true }
    } catch (error) {
      console.error('Logout error in thunk:', error)
      // Still proceed with local cleanup even if API call fails
      authService.clearStoredData()
      return { success: true }
    }
  }
)

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.verifyToken()
      
      if (response?.success === false) {
        authService.clearStoredData()
        return rejectWithValue(response?.message || 'Token verification failed')
      }
      
      return response?.data || response
    } catch (error) {
      console.error('Token verification error in thunk:', error)
      authService.clearStoredData()
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Token verification failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData)
      
      if (response?.success === false) {
        return rejectWithValue(response?.message || 'Profile update failed')
      }
      
      toast.success('Profile updated successfully!')
      return response?.data || response
    } catch (error) {
      console.error('Profile update error in thunk:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Profile update failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword, confirmNewPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword, confirmNewPassword)
      
      if (response?.success === false) {
        return rejectWithValue(response?.message || 'Password change failed')
      }
      
      toast.success('Password changed successfully!')
      return response?.data || response
    } catch (error) {
      console.error('Password change error in thunk:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Password change failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const response = await authService.uploadAvatar(file)
      
      if (response?.success === false) {
        return rejectWithValue(response?.message || 'Avatar upload failed')
      }
      
      toast.success('Avatar updated successfully!')
      return response?.data || response
    } catch (error) {
      console.error('Avatar upload error in thunk:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Avatar upload failed'
      return rejectWithValue(errorMessage)
    }
  }
)

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email)
      
      if (response?.success === false) {
        return rejectWithValue(response?.message || 'Failed to send reset email')
      }
      
      toast.success('Password reset instructions sent to your email!')
      return response?.data || response
    } catch (error) {
      console.error('Forgot password error in thunk:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to send reset email'
      return rejectWithValue(errorMessage)
    }
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(token, password, confirmPassword)
      
      if (response?.success === false) {
        return rejectWithValue(response?.message || 'Password reset failed')
      }
      
      toast.success('Password reset successfully!')
      return response?.data || response
    } catch (error) {
      console.error('Reset password error in thunk:', error)
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Password reset failed'
      return rejectWithValue(errorMessage)
    }
  }
)

const initialState = getInitialState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCredentials: (state, action) => {
      const data = action.payload?.data || action.payload
      state.user = data?.user || null
      state.token = data?.token || null
      state.isAuthenticated = !!(data?.user && data?.token)
      
      // Update localStorage
      if (data?.token) {
        authService.setStoredToken(data.token)
      }
      if (data?.user) {
        authService.setStoredUser(data.user)
      }
    },
    clearCredentials: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      authService.clearStoredData()
    },
    // Initialize auth state from localStorage
    initializeAuth: (state) => {
      const newState = getInitialState()
      state.user = newState.user
      state.token = newState.token
      state.isAuthenticated = newState.isAuthenticated
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        const data = action.payload?.data || action.payload
        state.user = data?.user || null
        state.token = data?.token || null
        state.isAuthenticated = !!(data?.user && data?.token)
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isAuthenticated = false
        state.user = null
        state.token = null
        authService.clearStoredData()
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        const data = action.payload?.data || action.payload
        state.user = data?.user || null
        state.token = data?.token || null
        state.isAuthenticated = !!(data?.user && data?.token)
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even on rejection, clear local state
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
      })
      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.isLoading = true
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.isLoading = false
        const data = action.payload?.data || action.payload
        state.user = data?.user || null
        state.isAuthenticated = !!(data?.user)
        state.error = null
      })
      .addCase(verifyToken.rejected, (state) => {
        state.isLoading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        const data = action.payload?.data || action.payload
        state.user = data?.user ? { ...state.user, ...data.user } : state.user
        state.error = null
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Upload Avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isLoading = false
        const data = action.payload?.data || action.payload
        state.user = data?.user ? { ...state.user, ...data.user } : state.user
        state.error = null
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const { clearError, setCredentials, clearCredentials } = authSlice.actions
export default authSlice.reducer