import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { registerUser, clearError } from '../store/slices/authSlice'
import FormInput from '../components/common/FormInput'
import Button from '../components/common/Button'
import PasswordStrengthIndicator from '../components/auth/PasswordStrengthIndicator'
import { validateEmail, validatePassword, validateConfirmPassword, validateName } from '../utils/validation'
import toast from 'react-hot-toast'

const RegisterPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])
  
  // Clear error on mount
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
    
    // Real-time validation for specific fields
    if (name === 'email' && value) {
      const emailError = validateEmail(value)
      setFormErrors(prev => ({ ...prev, email: emailError }))
    }
    
    if (name === 'password' && value) {
      const passwordError = validatePassword(value)
      setFormErrors(prev => ({ ...prev, password: passwordError }))
      
      // Also validate confirm password if it has a value
      if (formData.confirmPassword) {
        const confirmPasswordError = validateConfirmPassword(value, formData.confirmPassword)
        setFormErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }))
      }
    }
    
    if (name === 'confirmPassword' && value) {
      const confirmPasswordError = validateConfirmPassword(formData.password, value)
      setFormErrors(prev => ({ ...prev, confirmPassword: confirmPasswordError }))
    }
    
    if (name === 'firstName' && value) {
      const firstNameError = validateName(value)
      setFormErrors(prev => ({ ...prev, firstName: firstNameError }))
    }
    
    if (name === 'lastName' && value) {
      const lastNameError = validateName(value)
      setFormErrors(prev => ({ ...prev, lastName: lastNameError }))
    }
  }
  
  // Validate form
  const validateForm = () => {
    const errors = {}
    
    const firstNameError = validateName(formData.firstName)
    if (firstNameError) errors.firstName = firstNameError
    
    const lastNameError = validateName(formData.lastName)
    if (lastNameError) errors.lastName = lastNameError
    
    // Validate combined name length for backend compatibility
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
    if (fullName.length < 2) {
      errors.firstName = errors.firstName || 'Full name must be at least 2 characters'
    }
    if (fullName.length > 50) {
      errors.lastName = errors.lastName || 'Full name cannot exceed 50 characters'
    }
    
    const emailError = validateEmail(formData.email)
    if (emailError) errors.email = emailError
    
    const passwordError = validatePassword(formData.password)
    if (passwordError) errors.password = passwordError
    
    const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword)
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError
    
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear any previous errors
    dispatch(clearError())
    
    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }
    
    try {
      // Combine firstName and lastName into name for backend
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`
      
      const result = await dispatch(registerUser({
        name: fullName,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        passwordConfirm: formData.confirmPassword
      }))
      
      if (registerUser.fulfilled.match(result)) {
        toast.success('Registration successful! Welcome to Expensiver!')
        navigate('/dashboard', { replace: true })
      } else {
        // Handle rejected case
        const errorMessage = result.payload || 'Registration failed. Please try again.'
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error('Registration error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    }
  }
  
  // Handle Enter key press for form submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Expensiver</span>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
        
        {/* Registration Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-8 shadow-lg bg-white rounded-xl"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="First Name"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                error={formErrors.firstName}
                placeholder="John"
                required
                icon="👤"
                onKeyPress={handleKeyPress}
              />
              
              <FormInput
                label="Last Name"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                error={formErrors.lastName}
                placeholder="Doe"
                required
                icon="👤"
                onKeyPress={handleKeyPress}
              />
            </div>
            
            {/* Email Field */}
            <FormInput
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email || (error && error.includes('email') ? error : null)}
              placeholder="john@example.com"
              required
              icon="📧"
              onKeyPress={handleKeyPress}
            />
            
            {/* Password Field */}
            <div className="relative">
              <FormInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={formErrors.password}
                placeholder="Create a strong password"
                required
                icon="🔒"
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              <PasswordStrengthIndicator password={formData.password} />
            </div>
            
            {/* Confirm Password Field */}
            <div className="relative">
              <FormInput
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={formErrors.confirmPassword}
                placeholder="Confirm your password"
                required
                icon="🔒"
                onKeyPress={handleKeyPress}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {/* Terms and Conditions */}
            <div className="space-y-2">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {formErrors.acceptTerms && (
                <p className="text-sm text-red-600">{formErrors.acceptTerms}</p>
              )}
            </div>
            
            {/* Error Display */}
            {error && !formErrors.email && !formErrors.password && !formErrors.confirmPassword && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          
          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => toast.info('Google signup coming soon!')}
                disabled={isLoading}
              >
                <span className="mr-2">🔍</span>
                Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => toast.info('Microsoft signup coming soon!')}
                disabled={isLoading}
              >
                <span className="mr-2">🟦</span>
                Microsoft
              </Button>
            </div>
          </div>
        </motion.div>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="text-primary-600 hover:text-primary-500">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export default RegisterPage