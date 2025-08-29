import express from 'express'
import { body } from 'express-validator'
import {
  categorizeExpense,
  getSpendingInsights,
  getExpensePredictions,
  getSmartRecommendations,
  autoCategorizeExpenses,
  getAIFeatureStatus
} from '../controllers/aiController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Validation rules
const categorizeValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
]

const autoCategorizeValidation = [
  body('expenseIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('Expense IDs array is required (max 50 items)'),
  body('expenseIds.*')
    .isMongoId()
    .withMessage('Invalid expense ID format')
]

// Routes
router.get('/status', getAIFeatureStatus)
router.post('/categorize', categorizeValidation, validate, categorizeExpense)
router.get('/insights', getSpendingInsights)
router.get('/predictions', getExpensePredictions)
router.get('/recommendations', getSmartRecommendations)
router.post('/auto-categorize', autoCategorizeValidation, validate, autoCategorizeExpenses)

export default router