import crypto from 'crypto'
import slugify from 'slugify'

// Generate random string
export const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex')
}

// Generate random code (uppercase alphanumeric)
export const generateRandomCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate unique slug
export const generateSlug = (text, suffix = '') => {
  const baseSlug = slugify(text, { lower: true, strict: true })
  return suffix ? `${baseSlug}-${suffix}` : baseSlug
}

// Hash password
export const hashPassword = async (password) => {
  const bcrypt = await import('bcryptjs')
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  return await bcrypt.hash(password, saltRounds)
}

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  const bcrypt = await import('bcryptjs')
  return await bcrypt.compare(password, hashedPassword)
}

// Generate OTP
export const generateOTP = (length = 6) => {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return otp
}

// Mask sensitive data
export const maskEmail = (email) => {
  const [username, domain] = email.split('@')
  const maskedUsername = username.length > 2 
    ? username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1)
    : username
  return `${maskedUsername}@${domain}`
}

export const maskPhone = (phone) => {
  if (phone.length <= 4) return phone
  return '*'.repeat(phone.length - 4) + phone.slice(-4)
}

export const maskCardNumber = (cardNumber) => {
  if (cardNumber.length <= 4) return cardNumber
  return '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4)
}

// Deep clone object
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}

// Remove undefined/null values from object
export const cleanObject = (obj) => {
  const cleaned = {}
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key]
    }
  })
  return cleaned
}

// Pagination helper
export const getPaginationData = (page, limit, total) => {
  const currentPage = parseInt(page) || 1
  const itemsPerPage = parseInt(limit) || 20
  const totalPages = Math.ceil(total / itemsPerPage)
  const skip = (currentPage - 1) * itemsPerPage

  return {
    page: currentPage,
    limit: itemsPerPage,
    total,
    pages: totalPages,
    skip,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }
}

// Array chunk helper
export const chunkArray = (array, size) => {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get file extension
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// Generate random color
export const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Validate MongoDB ObjectId
export const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  return objectIdRegex.test(id)
}

// Convert string to title case
export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

// Generate initials from name
export const generateInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}

// Safe JSON parse
export const safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str)
  } catch {
    return defaultValue
  }
}

// Check if object is empty
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

// Sort object by keys
export const sortObjectByKeys = (obj) => {
  return Object.keys(obj)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = obj[key]
      return sorted
    }, {})
}

// Get nested object property safely
export const getNestedProperty = (obj, path, defaultValue = undefined) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue
  }, obj)
}

// Set nested object property
export const setNestedProperty = (obj, path, value) => {
  const keys = path.split('.')
  const lastKey = keys.pop()
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {}
    }
    return current[key]
  }, obj)
  target[lastKey] = value
}

// Remove duplicates from array
export const removeDuplicates = (arr, key = null) => {
  if (key) {
    const seen = new Set()
    return arr.filter(item => {
      const value = item[key]
      return seen.has(value) ? false : seen.add(value)
    })
  }
  return [...new Set(arr)]
}

// Generate UUID v4
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Sanitize filename
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// Calculate percentage
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * 100) / 100
}

// Get random element from array
export const getRandomElement = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Sleep function
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}