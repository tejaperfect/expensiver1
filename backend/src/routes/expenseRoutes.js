import express from 'express'
import { body } from 'express-validator'
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenseStats,
  addExpenseComment,
  updateSplitPayment,
  getRecurringExpenses,
  generateRecurringExpense,
  uploadReceipt
} from '../controllers/expenseController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import { uploadReceipt as uploadReceiptMiddleware } from '../middleware/uploadMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Validation rules
const createExpenseValidation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .isIn(['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'travel', 'groceries', 'fuel', 'clothing', 'electronics', 'home', 'pets', 'gifts', 'charity', 'investment', 'insurance', 'business', 'other'])
    .withMessage('Invalid category'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
]

const updateExpenseValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('category')
    .optional()
    .isIn(['food', 'transport', 'entertainment', 'shopping', 'bills', 'health', 'education', 'travel', 'groceries', 'fuel', 'clothing', 'electronics', 'home', 'pets', 'gifts', 'charity', 'investment', 'insurance', 'business', 'other'])
    .withMessage('Invalid category')
]

const commentValidation = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
]

// Routes
router.get('/', getExpenses)
router.post('/', createExpenseValidation, validate, createExpense)
router.get('/categories', getExpenseCategories)
router.get('/stats', getExpenseStats)
router.get('/recurring', getRecurringExpenses)
router.get('/:id', getExpense)
router.patch('/:id', updateExpenseValidation, validate, updateExpense)
router.delete('/:id', deleteExpense)
router.post('/:id/comments', commentValidation, validate, addExpenseComment)
router.patch('/:id/split-payment', updateSplitPayment)
router.post('/:id/generate-recurring', generateRecurringExpense)
router.post('/:id/receipt', uploadReceiptMiddleware, uploadReceipt)

export default router