import express from 'express'
import { body } from 'express-validator'
import {
  createUPIPayment,
  generateUPIQR,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getPaymentStatus,
  getPaymentHistory,
  cancelPayment,
  requestPayment,
  getUPIApps,
  validateUPIVPA,
  getPaymentMethods
} from '../controllers/paymentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Validation rules
const upiPaymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('vpa')
    .optional()
    .matches(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/)
    .withMessage('Invalid UPI VPA format'),
  body('receiverUserId')
    .optional()
    .isMongoId()
    .withMessage('Invalid receiver user ID'),
  body('expenseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid expense ID'),
  body('groupId')
    .optional()
    .isMongoId()
    .withMessage('Invalid group ID')
]

const qrGenerationValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('vpa')
    .matches(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/)
    .withMessage('Invalid UPI VPA format'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters')
]

const razorpayOrderValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR'])
    .withMessage('Invalid currency')
]

const razorpayVerifyValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('paymentId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required')
]

const paymentRequestValidation = [
  body('fromUserId')
    .isMongoId()
    .withMessage('Invalid from user ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
]

const vpaValidation = [
  body('vpa')
    .matches(/^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/)
    .withMessage('Invalid UPI VPA format')
]

// Routes
router.get('/methods', getPaymentMethods)
router.get('/upi/apps', getUPIApps)
router.post('/upi/validate', vpaValidation, validate, validateUPIVPA)
router.post('/upi/pay', upiPaymentValidation, validate, createUPIPayment)
router.post('/upi/qr', qrGenerationValidation, validate, generateUPIQR)
router.post('/razorpay/order', razorpayOrderValidation, validate, createRazorpayOrder)
router.post('/razorpay/verify', razorpayVerifyValidation, validate, verifyRazorpayPayment)
router.get('/history', getPaymentHistory)
router.post('/request', paymentRequestValidation, validate, requestPayment)
router.get('/:transactionId/status', getPaymentStatus)
router.post('/:transactionId/cancel', cancelPayment)

export default router