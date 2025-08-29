import { api } from './api'
import toast from 'react-hot-toast'

// Token management utilities
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const tokenManager = {
  getToken() {
    const token = localStorage.getItem(TOKEN_KEY)
    return token && token !== 'undefined' && token !== 'null' ? token : null
  },
  
  setToken(token) {
    if (token && typeof token === 'string' && token.trim() !== '') {
      localStorage.setItem(TOKEN_KEY, token)
    }
  },
  
  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },
  
  getUser() {
    try {
      const user = localStorage.getItem(USER_KEY)
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem(USER_KEY)
      return null
    }
  },
  
  setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  },
  
  removeUser() {
    localStorage.removeItem(USER_KEY)
  },
  
  clearAll() {
    this.removeToken()
    this.removeUser()
  }
}

export const authService = {
  // User authentication
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      
      if (response.data?.data?.token) {
        tokenManager.setToken(response.data.data.token)
        if (response.data?.data?.user) {
          tokenManager.setUser(response.data.data.user)
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Login error:', error)
      // Don't show toast here, let the component handle it
      throw error
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      
      if (response.data?.data?.token) {
        tokenManager.setToken(response.data.data.token)
        if (response.data?.data?.user) {
          tokenManager.setUser(response.data.data.user)
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  },

  async logout() {
    try {
      // Call logout endpoint
      await api.post('/auth/logout')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Still proceed with local cleanup even if API call fails
      return { success: true }
    } finally {
      // Always clear local data
      tokenManager.clearAll()
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      console.error('Forgot password error:', error)
      throw error
    }
  },

  async resetPassword(token, password, confirmPassword) {
    try {
      const response = await api.patch(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      })
      
      if (response.data?.data?.token) {
        tokenManager.setToken(response.data.data.token)
        if (response.data?.data?.user) {
          tokenManager.setUser(response.data.data.user)
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  },

  async changePassword(currentPassword, newPassword, confirmNewPassword) {
    try {
      const response = await api.patch('/auth/update-password', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      })
      
      if (response.data?.data?.token) {
        tokenManager.setToken(response.data.data.token)
      }
      
      return response.data
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  },

  async verifyToken() {
    try {
      const token = tokenManager.getToken()
      if (!token) {
        throw new Error('No token found')
      }
      
      const response = await api.get('/auth/me')
      
      if (response.data?.data?.user) {
        tokenManager.setUser(response.data.data.user)
      }
      
      return response.data
    } catch (error) {
      console.error('Token verification error:', error)
      tokenManager.clearAll()
      throw error
    }
  },

  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh-token')
      
      if (response.data?.data?.token) {
        tokenManager.setToken(response.data.data.token)
        if (response.data?.data?.user) {
          tokenManager.setUser(response.data.data.user)
        }
      }
      
      return response.data
    } catch (error) {
      console.error('Token refresh error:', error)
      tokenManager.clearAll()
      throw error
    }
  },

  // Profile management
  async getProfile() {
    try {
      const response = await api.get('/auth/me')
      
      if (response.data?.data?.user) {
        tokenManager.setUser(response.data.data.user)
      }
      
      return response.data
    } catch (error) {
      console.error('Get profile error:', error)
      throw error
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData)
      
      if (response.data?.data?.user) {
        tokenManager.setUser(response.data.data.user)
      }
      
      return response.data
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Email verification
  async sendVerificationEmail() {
    try {
      const response = await api.post('/auth/resend-verification')
      return response.data
    } catch (error) {
      console.error('Send verification email error:', error)
      throw error
    }
  },

  async verifyEmail(token) {
    try {
      const response = await api.get(`/auth/verify-email/${token}`)
      return response.data
    } catch (error) {
      console.error('Email verification error:', error)
      throw error
    }
  },

  // Two-factor authentication
  async enable2FA() {
    const response = await api.post('/auth/enable-2fa')
    return response.data
  },

  async disable2FA(code) {
    const response = await api.post('/auth/disable-2fa', { code })
    return response.data
  },

  async verify2FA(code) {
    const response = await api.post('/auth/verify-2fa', { code })
    return response.data
  },

  // Social authentication
  async loginWithGoogle(googleToken) {
    const response = await api.post('/auth/google', { token: googleToken })
    return response.data
  },

  async linkGoogleAccount(googleToken) {
    const response = await api.post('/auth/link-google', { token: googleToken })
    return response.data
  },

  async unlinkGoogleAccount() {
    const response = await api.delete('/auth/unlink-google')
    return response.data
  },

  // Account management
  async deleteAccount(password) {
    const response = await api.delete('/auth/account', {
      data: { password }
    })
    return response.data
  },

  async deactivateAccount() {
    const response = await api.post('/auth/deactivate')
    return response.data
  },

  async reactivateAccount(email, password) {
    const response = await api.post('/auth/reactivate', { email, password })
    return response.data
  },

  // Utility functions
  async checkEmailAvailability(email) {
    try {
      const response = await api.get(`/auth/check-email/${encodeURIComponent(email)}`)
      return response.data
    } catch (error) {
      console.error('Check email availability error:', error)
      throw error
    }
  },

  async checkUsernameAvailability(username) {
    try {
      const response = await api.get(`/auth/check-username/${encodeURIComponent(username)}`)
      return response.data
    } catch (error) {
      console.error('Check username availability error:', error)
      throw error
    }
  },

  // Security functions
  async getSecurityEvents() {
    try {
      const response = await api.get('/auth/security-events')
      return response.data
    } catch (error) {
      console.error('Get security events error:', error)
      throw error
    }
  },

  async getActiveSessions() {
    const response = await api.get('/auth/sessions')
    return response.data
  },

  async revokeSession(sessionId) {
    const response = await api.delete(`/auth/sessions/${sessionId}`)
    return response.data
  },

  async revokeAllSessions() {
    const response = await api.delete('/auth/sessions')
    return response.data
  },
  // Local storage management
  getStoredToken() {
    return tokenManager.getToken()
  },
  
  getStoredUser() {
    return tokenManager.getUser()
  },
  
  clearStoredData() {
    tokenManager.clearAll()
  },
  
  // Session management
  isAuthenticated() {
    const token = tokenManager.getToken()
    const user = tokenManager.getUser()
    return !!(token && user)
  },
  
  // Auto-logout functionality
  setupAutoLogout(callback) {
    // Check for invalid tokens periodically
    const checkInterval = setInterval(() => {
      const token = tokenManager.getToken()
      if (!token || token === 'undefined' || token === 'null') {
        this.clearStoredData()
        if (callback) callback()
        clearInterval(checkInterval)
      }
    }, 60000) // Check every minute
    
    return checkInterval
  }
}