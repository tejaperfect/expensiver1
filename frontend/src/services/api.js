import axios from 'axios'
import toast from 'react-hot-toast'

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable cookies for auth
})

// Token management utilities
const TOKEN_KEY = 'token'

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
  }
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken()
    // Only add token if it exists and is not the string 'undefined' or 'null'
    if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const { response, config } = error
    
    // Handle network errors
    if (!response) {
      toast.error('Network error. Please check your internet connection.')
      return Promise.reject(new Error('Network error'))
    }
    
    // Handle specific status codes
    switch (response.status) {
      case 400:
        // Bad request - validation errors
        const validationErrors = response.data?.errors
        if (validationErrors && Array.isArray(validationErrors)) {
          const errorMessages = validationErrors.map(err => err.msg || err.message).join(', ')
          toast.error(`Validation Error: ${errorMessages}`)
        } else {
          toast.error(response.data?.message || 'Bad request')
        }
        break
        
      case 401:
        // Unauthorized - clear token and redirect to login
        tokenManager.removeToken()
        window.location.href = '/login'
        toast.error('Session expired. Please log in again.')
        break
        
      case 403:
        toast.error(response.data?.message || 'Access denied. You don\'t have permission to perform this action.')
        break
        
      case 404:
        toast.error(response.data?.message || 'Resource not found.')
        break
        
      case 409:
        toast.error(response.data?.message || 'Conflict occurred. Please try again.')
        break
        
      case 422:
        toast.error(response.data?.message || 'Unprocessable entity. Please check your input.')
        break
        
      case 423:
        toast.error(response.data?.message || 'Resource is locked. Please try again later.')
        break
        
      case 429:
        toast.error(response.data?.message || 'Too many requests. Please try again later.')
        break
        
      case 500:
        toast.error(response.data?.message || 'Internal server error. Please try again later.')
        break
        
      case 502:
      case 503:
      case 504:
        toast.error('Service temporarily unavailable. Please try again later.')
        break
        
      default:
        toast.error(response.data?.message || `An unexpected error occurred (${response.status}).`)
    }
    
    // Handle token refresh for 401 errors (but not for login endpoint)
    if (response.status === 401 && !config.url.includes('/auth/login') && !config.url.includes('/auth/refresh-token')) {
      try {
        // Try to refresh the token
        const refreshResponse = await apiClient.post('/auth/refresh-token')
        if (refreshResponse.data?.data?.token) {
          tokenManager.setToken(refreshResponse.data.data.token)
          // Retry the original request
          return apiClient(config)
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        tokenManager.removeToken()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// Generic API methods
export const api = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
}

// Helper function for handling file uploads
export const uploadFile = async (file, onProgress = null) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      onProgress(percentCompleted)
    }
  }
  
  return api.post('/upload', formData, config)
}

// Helper function for downloading files
export const downloadFile = async (url, filename) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    })
    
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    toast.error('Failed to download file.')
    throw error
  }
}

// Health check function
export const apiHealthCheck = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    console.error('API health check failed:', error)
    throw error
  }
}

// API version info
export const getApiVersion = async () => {
  try {
    const response = await api.get('/version')
    return response.data
  } catch (error) {
    console.error('Failed to get API version:', error)
    return null
  }
}

export default apiClient