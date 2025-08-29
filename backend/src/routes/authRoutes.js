import express from 'express'
import { body, param, query } from 'express-validator'
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  refreshToken,
  resendEmailVerification,
  checkEmailAvailability,
  checkUsernameAvailability,
  getSecurityEvents
} from '../controllers/authController.js'
import { protect, restrictTo, requireVerification, checkAccountStatus, userRateLimit } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'

const router = express.Router()

// Enhanced validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (email) => {
      // Additional email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format')
      }
      return true
    }),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((password) => {
      // Additional password strength validation
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
      if (password.length < 12 && !hasSpecialChar) {
        throw new Error('Password must contain a special character or be at least 12 characters long')
      }
      return true
    }),
  body('passwordConfirm')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password')
      }
      return true
    }),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[1-9]?[0-9]{7,15}$/)
    .withMessage('Please provide a valid international phone number')
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password length is invalid')
]

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Email is required')
]

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((password) => {
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
      if (password.length < 12 && !hasSpecialChar) {
        throw new Error('Password must contain a special character or be at least 12 characters long')
      }
      return true
    }),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password')
      }
      return true
    })
]

const updatePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Invalid current password'),
  body('newPassword')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
    .custom((password) => {
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
      if (password.length < 12 && !hasSpecialChar) {
        throw new Error('New password must contain a special character or be at least 12 characters long')
      }
      return true
    }),
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password')
      }
      return true
    })
]

// Additional validation rules
const emailValidation = [
  param('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
]

const usernameValidation = [
  param('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
]

const tokenValidation = [
  param('token')
    .isLength({ min: 10 })
    .withMessage('Invalid token format')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Token can only contain alphanumeric characters')
]

// Public routes with rate limiting
router.post('/register', 
  userRateLimit(5, 15 * 60 * 1000), // 5 registrations per 15 minutes
  registerValidation, 
  validate, 
  register
)

router.post('/login', 
  userRateLimit(10, 15 * 60 * 1000), // 10 login attempts per 15 minutes
  loginValidation, 
  validate, 
  login
)

router.post('/logout', logout)

router.post('/forgot-password', 
  userRateLimit(3, 60 * 60 * 1000), // 3 forgot password requests per hour
  forgotPasswordValidation, 
  validate, 
  forgotPassword
)

router.patch('/reset-password/:token', 
  tokenValidation,
  resetPasswordValidation, 
  validate, 
  resetPassword
)

router.get('/verify-email/:token', 
  tokenValidation,
  validate,
  verifyEmail
)

router.post('/refresh-token', 
  userRateLimit(20, 60 * 60 * 1000), // 20 refresh attempts per hour
  refreshToken
)

// Utility routes
router.get('/check-email/:email', 
  emailValidation,
  validate,
  checkEmailAvailability
)

router.get('/check-username/:username', 
  usernameValidation,
  validate,
  checkUsernameAvailability
)

// Protected routes
router.use(protect) // All routes below require authentication

// User profile and account management
router.get('/me', checkAccountStatus, getMe)

router.patch('/update-password', 
  checkAccountStatus,
  userRateLimit(5, 60 * 60 * 1000), // 5 password updates per hour
  updatePasswordValidation, 
  validate, 
  updatePassword
)

// Email verification for authenticated users
router.post('/resend-verification', 
  checkAccountStatus,
  userRateLimit(3, 60 * 60 * 1000), // 3 verification emails per hour
  resendEmailVerification
)

// Security and audit routes
router.get('/security-events', 
  checkAccountStatus,
  requireVerification,
  getSecurityEvents
)

export default router