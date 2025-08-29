// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone number validation (Indian format)
export const isValidIndianPhone = (phone) => {
  const phoneRegex = /^[+]?[91]?[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// International phone validation
export const isValidInternationalPhone = (phone) => {
  const phoneRegex = /^[+]?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

// Password strength validation
export const validatePasswordStrength = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noCommonPatterns: !/(123|abc|password|qwerty)/i.test(password)
  }

  const score = Object.values(checks).filter(Boolean).length
  
  let strength = 'weak'
  if (score >= 5) strength = 'strong'
  else if (score >= 3) strength = 'medium'

  return {
    isValid: score >= 4,
    strength,
    score,
    checks
  }
}

// URL validation
export const isValidURL = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Credit card validation (Luhn algorithm)
export const isValidCreditCard = (cardNumber) => {
  const num = cardNumber.replace(/\s+/g, '')
  
  if (!/^\d+$/.test(num)) return false
  if (num.length < 13 || num.length > 19) return false

  let sum = 0
  let shouldDouble = false

  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i))

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

// UPI VPA validation
export const isValidUPIVPA = (vpa) => {
  const upiRegex = /^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{2,64}$/
  return upiRegex.test(vpa)
}

// IFSC code validation
export const isValidIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
  return ifscRegex.test(ifsc)
}

// PAN number validation
export const isValidPAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/
  return panRegex.test(pan)
}

// Aadhaar number validation
export const isValidAadhaar = (aadhaar) => {
  const aadhaarRegex = /^\d{12}$/
  if (!aadhaarRegex.test(aadhaar)) return false

  // Verify checksum using Verhoeff algorithm
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ]

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ]

  let c = 0
  const aadhaarArray = aadhaar.split('').map(Number).reverse()

  for (let i = 0; i < aadhaarArray.length; i++) {
    c = d[c][p[i % 8][aadhaarArray[i]]]
  }

  return c === 0
}

// Date validation
export const isValidDate = (dateString) => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date) && date.toString() !== 'Invalid Date'
}

// Future date validation
export const isFutureDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  return date > now
}

// Past date validation
export const isPastDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  return date < now
}

// Age validation
export const isValidAge = (dateOfBirth, minAge = 0, maxAge = 120) => {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  
  if (birth > today) return false
  
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) 
    ? age - 1 
    : age

  return actualAge >= minAge && actualAge <= maxAge
}

// Currency code validation
export const isValidCurrencyCode = (currency) => {
  const validCurrencies = [
    'INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD'
  ]
  return validCurrencies.includes(currency.toUpperCase())
}

// Amount validation
export const isValidAmount = (amount, min = 0, max = Infinity) => {
  const num = parseFloat(amount)
  return !isNaN(num) && num >= min && num <= max && num.toString().match(/^\d+(\.\d{1,2})?$/)
}

// Percentage validation
export const isValidPercentage = (percentage, min = 0, max = 100) => {
  const num = parseFloat(percentage)
  return !isNaN(num) && num >= min && num <= max
}

// Postal code validation (Indian PIN code)
export const isValidIndianPincode = (pincode) => {
  const pincodeRegex = /^[1-9][0-9]{5}$/
  return pincodeRegex.test(pincode)
}

// Username validation
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/
  return usernameRegex.test(username)
}

// File type validation
export const isValidFileType = (filename, allowedTypes) => {
  const extension = filename.split('.').pop().toLowerCase()
  return allowedTypes.includes(extension)
}

// File size validation
export const isValidFileSize = (size, maxSize) => {
  return size <= maxSize
}

// JSON validation
export const isValidJSON = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// MongoDB ObjectId validation
export const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  return objectIdRegex.test(id)
}

// Hex color validation
export const isValidHexColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexRegex.test(color)
}

// IP address validation
export const isValidIPAddress = (ip) => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Latitude validation
export const isValidLatitude = (lat) => {
  const num = parseFloat(lat)
  return !isNaN(num) && num >= -90 && num <= 90
}

// Longitude validation
export const isValidLongitude = (lng) => {
  const num = parseFloat(lng)
  return !isNaN(num) && num >= -180 && num <= 180
}

// Domain validation
export const isValidDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/
  return domainRegex.test(domain)
}

// Social security number validation (for reference)
export const isValidSSN = (ssn) => {
  const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/
  return ssnRegex.test(ssn)
}

// Validate required fields
export const validateRequiredFields = (obj, requiredFields) => {
  const missingFields = []
  
  requiredFields.forEach(field => {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missingFields.push(field)
    }
  })
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

// Validate object against schema
export const validateSchema = (obj, schema) => {
  const errors = {}
  
  Object.keys(schema).forEach(key => {
    const rules = schema[key]
    const value = obj[key]
    
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[key] = `${key} is required`
      return
    }
    
    if (value && rules.type && typeof value !== rules.type) {
      errors[key] = `${key} must be of type ${rules.type}`
      return
    }
    
    if (value && rules.min && (typeof value === 'number' ? value < rules.min : value.length < rules.min)) {
      errors[key] = `${key} must be at least ${rules.min}`
      return
    }
    
    if (value && rules.max && (typeof value === 'number' ? value > rules.max : value.length > rules.max)) {
      errors[key] = `${key} must not exceed ${rules.max}`
      return
    }
    
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors[key] = `${key} format is invalid`
      return
    }
    
    if (value && rules.enum && !rules.enum.includes(value)) {
      errors[key] = `${key} must be one of: ${rules.enum.join(', ')}`
      return
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
}

// Validate and sanitize email
export const validateAndSanitizeEmail = (email) => {
  const sanitized = sanitizeInput(email).toLowerCase()
  return {
    isValid: isValidEmail(sanitized),
    sanitized
  }
}

// Validate business hours
export const isWithinBusinessHours = (date = new Date(), startHour = 9, endHour = 17) => {
  const hour = date.getHours()
  const day = date.getDay()
  
  // Check if it's weekend (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) return false
  
  return hour >= startHour && hour < endHour
}