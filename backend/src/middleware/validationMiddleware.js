import { validationResult } from 'express-validator'
import { AppError, formatValidationError, sendErrorResponse } from './errorMiddleware.js'
import { logger } from '../utils/logger.js'

// Main validation middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationError(errors.array())
    logger.warn('Validation failed:', { 
      url: req.originalUrl, 
      method: req.method,
      errors: formattedErrors,
      body: req.body
    })
    
    return sendErrorResponse(res, 400, 'Validation failed', formattedErrors)
  }
  
  next()
}

// Custom validation functions
export const validateObjectId = (value) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  if (!objectIdRegex.test(value)) {
    throw new Error('Invalid ID format')
  }
  return true
}

export const validateDate = (value) => {
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format')
  }
  return true
}

export const validateCurrency = (value) => {
  const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']
  if (!validCurrencies.includes(value)) {
    throw new Error('Invalid currency code')
  }
  return true
}

export const validateAmount = (value) => {
  const amount = parseFloat(value)
  if (isNaN(amount) || amount < 0) {
    throw new Error('Amount must be a positive number')
  }
  if (amount > 1000000) {
    throw new Error('Amount cannot exceed 1,000,000')
  }
  return true
}

export const validatePhone = (value) => {
  // Indian phone number validation
  const phoneRegex = /^[+]?[91]?[6-9]\d{9}$/
  if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
    throw new Error('Invalid phone number format')
  }
  return true
}

export const validatePassword = (value) => {
  if (value.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(value)) {
    throw new Error('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(value)) {
    throw new Error('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(value)) {
    throw new Error('Password must contain at least one number')
  }
  
  if (!/(?=.*[@$!%*?&])/.test(value)) {
    throw new Error('Password must contain at least one special character (@$!%*?&)')
  }
  
  return true
}

export const validateEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    throw new Error('Invalid email format')
  }
  return true
}

export const validateURL = (value) => {
  try {
    new URL(value)
    return true
  } catch {
    throw new Error('Invalid URL format')
  }
}

export const validateFileType = (allowedTypes) => {
  return (value) => {
    if (!allowedTypes.includes(value)) {
      throw new Error(`File type must be one of: ${allowedTypes.join(', ')}`)
    }
    return true
  }
}

export const validateArrayLength = (min = 0, max = 100) => {
  return (value) => {
    if (!Array.isArray(value)) {
      throw new Error('Value must be an array')
    }
    if (value.length < min) {
      throw new Error(`Array must have at least ${min} items`)
    }
    if (value.length > max) {
      throw new Error(`Array cannot have more than ${max} items`)
    }
    return true
  }
}

export const validateEnum = (allowedValues) => {
  return (value) => {
    if (!allowedValues.includes(value)) {
      throw new Error(`Value must be one of: ${allowedValues.join(', ')}`)
    }
    return true
  }
}

// Sanitization functions
export const sanitizeString = (value) => {
  return value.trim().replace(/\s+/g, ' ')
}

export const sanitizeEmail = (value) => {
  return value.toLowerCase().trim()
}

export const sanitizePhone = (value) => {
  return value.replace(/\D/g, '')
}

export const sanitizeAmount = (value) => {
  return parseFloat(value).toFixed(2)
}

// Conditional validation middleware
export const conditionalValidation = (condition, validations) => {
  return (req, res, next) => {
    if (condition(req)) {
      // Apply validations if condition is true
      let errors = []
      validations.forEach(validation => {
        try {
          validation.run(req)
        } catch (error) {
          errors.push(error)
        }
      })
      
      if (errors.length > 0) {
        const formattedErrors = formatValidationError(errors)
        return sendErrorResponse(res, 400, 'Conditional validation failed', formattedErrors)
      }
    }
    next()
  }
}

// Skip validation for certain routes
export const skipValidation = (routes = []) => {
  return (req, res, next) => {
    if (routes.includes(req.route.path)) {
      return next()
    }
    validate(req, res, next)
  }
}

// Custom validation for file uploads
export const validateUpload = (options = {}) => {
  const {
    maxFileSize = 5 * 1024 * 1024, // 5MB
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxFiles = 1
  } = options

  return (req, res, next) => {
    if (!req.files && !req.file) {
      return next()
    }

    const files = req.files || [req.file]
    
    if (files.length > maxFiles) {
      return next(new AppError(`Maximum ${maxFiles} files allowed`, 400))
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        return next(new AppError(`File size cannot exceed ${maxFileSize / 1024 / 1024}MB`, 400))
      }
      
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return next(new AppError(`File type ${file.mimetype} not allowed`, 400))
      }
    }

    next()
  }
}