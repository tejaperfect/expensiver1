import React from 'react'

// Validation utility functions

export const validateEmail = (email) => {
  if (!email) return 'Email is required'
  if (email.length > 254) return 'Email is too long'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address'
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (password.length > 128) return 'Password cannot exceed 128 characters'
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number'
  
  // Additional validation for stronger passwords
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  if (password.length < 12 && !hasSpecialChar) {
    return 'Password must contain a special character or be at least 12 characters long'
  }
  
  return null
}

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password'
  if (password !== confirmPassword) return 'Passwords do not match'
  return null
}

export const validateName = (name) => {
  if (!name) return 'Name is required'
  if (name.length < 2) return 'Name must be at least 2 characters long'
  if (name.length > 50) return 'Name must be less than 50 characters'
  if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces'
  return null
}

export const validatePhone = (phone) => {
  if (!phone) return null // Optional field
  if (phone.length > 20) return 'Phone number is too long'
  const phoneRegex = /^[+]?[1-9]?[0-9]{7,15}$/
  if (!phoneRegex.test(phone)) return 'Please enter a valid phone number'
  return null
}

// Form validation helper
export const validateForm = (values, rules) => {
  const errors = {}
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field]
    const value = values[field]
    
    if (typeof rule === 'function') {
      const error = rule(value, values)
      if (error) errors[field] = error
    } else if (Array.isArray(rule)) {
      for (const validator of rule) {
        const error = validator(value, values)
        if (error) {
          errors[field] = error
          break
        }
      }
    }
  })
  
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  }
}

// Password strength calculator
export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Very Weak', color: 'red' }
  
  let score = 0
  
  // Length
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  
  // Character types
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  
  // Complexity
  if (password.length >= 16) score += 1
  if (/[^\w\s]/.test(password)) score += 1
  
  const strengthLevels = [
    { score: 0, label: 'Very Weak', color: 'red' },
    { score: 1, label: 'Very Weak', color: 'red' },
    { score: 2, label: 'Weak', color: 'orange' },
    { score: 3, label: 'Fair', color: 'yellow' },
    { score: 4, label: 'Good', color: 'blue' },
    { score: 5, label: 'Strong', color: 'green' },
    { score: 6, label: 'Very Strong', color: 'green' },
    { score: 7, label: 'Excellent', color: 'green' },
    { score: 8, label: 'Excellent', color: 'green' }
  ]
  
  return strengthLevels[Math.min(score, 8)]
}

// Username validation
export const validateUsername = (username) => {
  if (!username) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters long'
  if (username.length > 30) return 'Username must be less than 30 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores'
  return null
}

// Custom hooks for form handling
export const useFormValidation = (initialValues, validationRules) => {
  const [values, setValues] = React.useState(initialValues)
  const [errors, setErrors] = React.useState({})
  const [touched, setTouched] = React.useState({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate field on blur
    if (validationRules[name]) {
      const rule = validationRules[name]
      const error = typeof rule === 'function' 
        ? rule(values[name], values)
        : rule.reduce((err, validator) => err || validator(values[name], values), null)
      
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }
  
  const validate = () => {
    const { errors: validationErrors, isValid } = validateForm(values, validationRules)
    setErrors(validationErrors)
    return isValid
  }
  
  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validate,
    reset
  }
}