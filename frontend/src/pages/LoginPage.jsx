import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { loginUser, clearError } from '../store/slices/authSlice'
import FormInput from '../components/common/FormInput'
import Button from '../components/common/Button'
import { validateEmail } from '../utils/validation'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])
  
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
    
    // Real-time email validation
    if (name === 'email' && value) {
      const emailError = validateEmail(value)
      setFormErrors(prev => ({ ...prev, email: emailError }))
    }
  }
  
  // Validate form
  const validateForm = () => {
    const errors = {}
    
    const emailError = validateEmail(formData.email)
    if (emailError) errors.email = emailError
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
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
      const result = await dispatch(loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      }))
      
      if (loginUser.fulfilled.match(result)) {
        toast.success('Login successful! Welcome back!')
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      } else {
        // Handle rejected case
        const errorMessage = result.payload || 'Login failed. Please check your credentials.'
        toast.error(errorMessage)
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    }
  }
  
  // Demo login for development
  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@expensiver.com',
      password: 'Demo123!@#',
      rememberMe: false
    })
    setFormErrors({}) // Clear any existing errors
    toast.success('Demo credentials filled. Click Login to continue.')
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
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>
        
        {/* Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-8 shadow-lg bg-white rounded-xl"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <FormInput
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email || (error && error.includes('email') ? error : null)}
              placeholder="Enter your email"
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
                error={formErrors.password || (error && !formErrors.email && !error.includes('email') ? error : null)}
                placeholder="Enter your password"
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
            </div>
            
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              
              <Link 
                to="/forgot-password" 
                className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            
            {/* Error Display */}
            {error && !formErrors.email && !formErrors.password && (
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            
            {/* Demo Login Button */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleDemoLogin}
              className="w-full"
              disabled={isLoading}
            >
              🚀 Try Demo Account
            </Button>
          </form>
          
          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => toast.info('Google login coming soon!')}
                disabled={isLoading}
              >
                <span className="mr-2">🔍</span>
                Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => toast.info('Microsoft login coming soon!')}
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
          By signing in, you agree to our{' '}
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

export default LoginPage