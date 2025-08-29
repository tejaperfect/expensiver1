import express from 'express'
import { body } from 'express-validator'
import {
  getProfile,
  updateProfile,
  deleteAccount,
  uploadAvatar,
  updateSettings,
  getSettings,
  exportUserData,
  getUserAnalytics,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  updatePreferences
} from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Validation rules
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must not exceed 200 characters'),
  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Occupation must not exceed 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
]

const updateSettingsValidation = [
  body('language')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'de'])
    .withMessage('Invalid language selection'),
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD'])
    .withMessage('Invalid currency selection'),
  body('timezone')
    .optional()
    .isString()
    .withMessage('Invalid timezone'),
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme selection'),
  body('notifications.*.enabled')
    .optional()
    .isBoolean()
    .withMessage('Notification settings must be boolean'),
  body('privacy.*.enabled')
    .optional()
    .isBoolean()
    .withMessage('Privacy settings must be boolean')
]

const updatePreferencesValidation = [
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD'])
    .withMessage('Invalid currency selection'),
  body('language')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'de'])
    .withMessage('Invalid language selection'),
  body('notifications')
    .optional()
    .isObject()
    .withMessage('Notifications must be an object'),
  body('privacy')
    .optional()
    .isObject()
    .withMessage('Privacy settings must be an object')
]

// Profile routes
router.get('/profile', getProfile)
router.patch('/profile', updateProfileValidation, validate, updateProfile)
router.delete('/account', deleteAccount)
router.post('/avatar', upload.single('avatar'), uploadAvatar)

// Settings routes
router.get('/settings', getSettings)
router.patch('/settings', updateSettingsValidation, validate, updateSettings)
router.patch('/preferences', updatePreferencesValidation, validate, updatePreferences)

// Data export
router.get('/export/:format', exportUserData)

// Analytics
router.get('/analytics', getUserAnalytics)

// Notifications
router.get('/notifications', getNotifications)
router.patch('/notifications/:id/read', markNotificationAsRead)
router.delete('/notifications/:id', deleteNotification)

export default router