import { Transaction, User, Group, Expense } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse } from '../middleware/errorMiddleware.js'
import { logger, apiLogger } from '../utils/logger.js'
import crypto from 'crypto'
import QRCode from 'qrcode'

// Create UPI payment
export const createUPIPayment = asyncHandler(async (req, res, next) => {
  const {
    amount,
    currency = 'INR',
    vpa, // Virtual Payment Address
    description,
    expenseId,
    groupId,
    receiverUserId
  } = req.body

  // Validate UPI VPA format
  const upiRegex = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/
  if (vpa && !upiRegex.test(vpa)) {
    return next(new AppError('Invalid UPI VPA format', 400))
  }

  // Validate amount
  if (!amount || amount <= 0) {
    return next(new AppError('Invalid amount', 400))
  }

  // Check if related expense exists
  let expense = null
  if (expenseId) {
    expense = await Expense.findById(expenseId)
    if (!expense) {
      return next(new AppError('Expense not found', 404))
    }
    
    // Check if user has access to this expense
    if (!expense.isUserInvolved(req.user.id)) {
      return next(new AppError('You do not have access to this expense', 403))
    }
  }

  // Check if group exists
  let group = null
  if (groupId) {
    group = await Group.findById(groupId)
    if (!group) {
      return next(new AppError('Group not found', 404))
    }
    
    if (!group.isUserMember(req.user.id)) {
      return next(new AppError('You are not a member of this group', 403))
    }
  }

  // Check if receiver exists
  let receiver = null
  if (receiverUserId) {
    receiver = await User.findById(receiverUserId)
    if (!receiver) {
      return next(new AppError('Receiver not found', 404))
    }
  }

  // Create transaction record
  const transaction = await Transaction.create({
    type: 'payment',
    subType: expenseId ? 'expense_payment' : groupId ? 'split_payment' : 'transfer',
    from: {
      user: req.user.id,
      type: 'user'
    },
    to: {
      user: receiverUserId,
      type: 'user'
    },
    amount,
    currency,
    paymentMethod: {
      type: 'upi',
      details: {
        vpa: vpa || receiver?.preferences?.upiId
      }
    },
    relatedTo: {
      expense: expenseId,
      group: groupId
    },
    description: description || `Payment via UPI`,
    status: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    metadata: {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  })

  apiLogger.logPaymentProcessed(req.user.id, transaction.transactionId, amount, 'upi')

  sendSuccessResponse(res, 201, {
    transaction: {
      id: transaction.transactionId,
      amount: transaction.formattedAmount,
      status: transaction.status,
      expiresAt: transaction.expiresAt,
      paymentUrl: vpa ? `upi://pay?pa=${vpa}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(description || 'Payment')}` : null
    }
  }, 'UPI payment created successfully')
})

// Generate UPI QR Code
export const generateUPIQR = asyncHandler(async (req, res, next) => {
  const {
    amount,
    vpa,
    name,
    description,
    transactionId
  } = req.body

  if (!vpa || !amount) {
    return next(new AppError('VPA and amount are required', 400))
  }

  // Validate UPI VPA format
  const upiRegex = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/
  if (!upiRegex.test(vpa)) {
    return next(new AppError('Invalid UPI VPA format', 400))
  }

  // Create UPI payment string
  const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name || req.user.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(description || 'Payment')}&tr=${transactionId || crypto.randomBytes(8).toString('hex')}`

  try {
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    sendSuccessResponse(res, 200, {
      qrCode: qrCodeDataURL,
      upiString,
      paymentDetails: {
        vpa,
        amount,
        currency: 'INR',
        description,
        name: name || req.user.name
      }
    }, 'UPI QR code generated successfully')
  } catch (error) {
    logger.error('QR code generation failed:', error)
    return next(new AppError('Failed to generate QR code', 500))
  }
})

// Process Razorpay payment
export const createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const {
    amount,
    currency = 'INR',
    description,
    expenseId,
    groupId,
    receiverUserId
  } = req.body

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return next(new AppError('Payment gateway not configured', 500))
  }

  // Create transaction record
  const transaction = await Transaction.create({
    type: 'payment',
    subType: expenseId ? 'expense_payment' : 'transfer',
    from: {
      user: req.user.id,
      type: 'user'
    },
    to: {
      user: receiverUserId,
      type: 'user'
    },
    amount,
    currency,
    paymentMethod: {
      type: 'card',
      details: {}
    },
    gateway: {
      provider: 'razorpay'
    },
    relatedTo: {
      expense: expenseId,
      group: groupId
    },
    description: description || 'Payment via Razorpay',
    status: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    metadata: {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  })

  // In a real implementation, you would create a Razorpay order here
  // const Razorpay = require('razorpay')
  // const rzp = new Razorpay({
  //   key_id: process.env.RAZORPAY_KEY_ID,
  //   key_secret: process.env.RAZORPAY_KEY_SECRET
  // })
  
  // For demo purposes, we'll simulate the order creation
  const orderId = `order_${crypto.randomBytes(8).toString('hex')}`
  
  transaction.gateway.orderId = orderId
  await transaction.save()

  apiLogger.logPaymentProcessed(req.user.id, transaction.transactionId, amount, 'razorpay')

  sendSuccessResponse(res, 201, {
    orderId,
    transactionId: transaction.transactionId,
    amount: transaction.formattedAmount,
    currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    description,
    prefill: {
      name: req.user.name,
      email: req.user.email,
      contact: req.user.phone
    }
  }, 'Razorpay order created successfully')
})

// Verify Razorpay payment
export const verifyRazorpayPayment = asyncHandler(async (req, res, next) => {
  const {
    orderId,
    paymentId,
    signature,
    transactionId
  } = req.body

  if (!orderId || !paymentId || !signature) {
    return next(new AppError('Missing payment verification parameters', 400))
  }

  // Find transaction
  const transaction = await Transaction.findOne({
    transactionId: transactionId || { $exists: true },
    'gateway.orderId': orderId,
    status: 'pending'
  })

  if (!transaction) {
    return next(new AppError('Transaction not found', 404))
  }

  // Verify signature (in real implementation)
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  //   .update(orderId + '|' + paymentId)
  //   .digest('hex')

  // For demo purposes, we'll assume verification is successful
  const isSignatureValid = true // expectedSignature === signature

  if (!isSignatureValid) {
    await transaction.updateStatus('failed', 'Invalid payment signature')
    return next(new AppError('Payment verification failed', 400))
  }

  // Update transaction
  transaction.gateway.paymentId = paymentId
  transaction.gateway.signature = signature
  await transaction.updateStatus('completed', 'Payment verified successfully')

  // Update related expense split if applicable
  if (transaction.relatedTo.expense) {
    const expense = await Expense.findById(transaction.relatedTo.expense)
    if (expense) {
      await expense.updateSplitPayment(transaction.from.user, true)
    }
  }

  // Send notification to receiver
  if (transaction.to.user) {
    // TODO: Create notification for payment received
  }

  logger.info(`Payment verified: ${paymentId} for transaction ${transaction.transactionId}`)

  sendSuccessResponse(res, 200, {
    transactionId: transaction.transactionId,
    status: 'completed',
    paymentId,
    amount: transaction.formattedAmount
  }, 'Payment verified successfully')
})

// Get payment status
export const getPaymentStatus = asyncHandler(async (req, res, next) => {
  const { transactionId } = req.params

  const transaction = await Transaction.findOne({
    transactionId,
    $or: [
      { 'from.user': req.user.id },
      { 'to.user': req.user.id }
    ]
  })

  if (!transaction) {
    return next(new AppError('Transaction not found', 404))
  }

  sendSuccessResponse(res, 200, {
    transactionId: transaction.transactionId,
    status: transaction.status,
    amount: transaction.formattedAmount,
    currency: transaction.currency,
    type: transaction.type,
    createdAt: transaction.createdAt,
    completedAt: transaction.completedAt,
    error: transaction.error
  }, 'Payment status retrieved successfully')
})

// Get user's payment history
export const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  const filter = {
    $or: [
      { 'from.user': req.user.id },
      { 'to.user': req.user.id }
    ]
  }

  // Filter by type
  if (req.query.type) {
    filter.type = req.query.type
  }

  // Filter by status
  if (req.query.status) {
    filter.status = req.query.status
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    filter.createdAt = {}
    if (req.query.startDate) {
      filter.createdAt.$gte = new Date(req.query.startDate)
    }
    if (req.query.endDate) {
      filter.createdAt.$lte = new Date(req.query.endDate)
    }
  }

  const transactions = await Transaction.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('from.user', 'name avatar')
    .populate('to.user', 'name avatar')
    .populate('relatedTo.expense', 'title amount')
    .populate('relatedTo.group', 'name')

  const total = await Transaction.countDocuments(filter)

  // Add direction field for UI
  const transactionsWithDirection = transactions.map(txn => ({
    ...txn.toObject(),
    direction: txn.from.user._id.toString() === req.user.id.toString() ? 'sent' : 'received'
  }))

  sendSuccessResponse(res, 200, {
    transactions: transactionsWithDirection,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }, 'Payment history retrieved successfully')
})

// Cancel payment
export const cancelPayment = asyncHandler(async (req, res, next) => {
  const { transactionId } = req.params

  const transaction = await Transaction.findOne({
    transactionId,
    'from.user': req.user.id,
    status: 'pending'
  })

  if (!transaction) {
    return next(new AppError('Transaction not found or cannot be cancelled', 404))
  }

  await transaction.updateStatus('cancelled', 'Cancelled by user')

  logger.info(`Payment cancelled: ${transactionId} by user ${req.user.email}`)

  sendSuccessResponse(res, 200, null, 'Payment cancelled successfully')
})

// Request payment
export const requestPayment = asyncHandler(async (req, res, next) => {
  const {
    fromUserId,
    amount,
    currency = 'INR',
    description,
    expenseId,
    groupId,
    dueDate
  } = req.body

  if (!fromUserId || !amount) {
    return next(new AppError('From user and amount are required', 400))
  }

  const fromUser = await User.findById(fromUserId)
  if (!fromUser) {
    return next(new AppError('User not found', 404))
  }

  // Check if users are in the same group (if groupId provided)
  if (groupId) {
    const group = await Group.findById(groupId)
    if (!group || !group.isUserMember(req.user.id) || !group.isUserMember(fromUserId)) {
      return next(new AppError('Both users must be members of the group', 403))
    }
  }

  // Create payment request transaction
  const transaction = await Transaction.create({
    type: 'payment',
    subType: 'payment_request',
    from: {
      user: fromUserId,
      type: 'user'
    },
    to: {
      user: req.user.id,
      type: 'user'
    },
    amount,
    currency,
    relatedTo: {
      expense: expenseId,
      group: groupId
    },
    description: description || 'Payment request',
    status: 'pending',
    expiresAt: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days default
    metadata: {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  })

  // TODO: Send notification to the user being requested for payment

  logger.info(`Payment requested: ${amount} from ${fromUserId} by ${req.user.email}`)

  sendSuccessResponse(res, 201, {
    transactionId: transaction.transactionId,
    amount: transaction.formattedAmount,
    description,
    expiresAt: transaction.expiresAt
  }, 'Payment request created successfully')
})

// Get UPI apps list
export const getUPIApps = asyncHandler(async (req, res, next) => {
  const upiApps = [
    {
      name: 'Google Pay',
      packageName: 'com.google.android.apps.nbu.paisa.user',
      icon: '/images/upi-apps/gpay.png'
    },
    {
      name: 'PhonePe',
      packageName: 'com.phonepe.app',
      icon: '/images/upi-apps/phonepe.png'
    },
    {
      name: 'Paytm',
      packageName: 'net.one97.paytm',
      icon: '/images/upi-apps/paytm.png'
    },
    {
      name: 'BHIM',
      packageName: 'in.org.npci.upiapp',
      icon: '/images/upi-apps/bhim.png'
    },
    {
      name: 'Amazon Pay',
      packageName: 'in.amazon.mShop.android.shopping',
      icon: '/images/upi-apps/amazon.png'
    },
    {
      name: 'WhatsApp',
      packageName: 'com.whatsapp',
      icon: '/images/upi-apps/whatsapp.png'
    }
  ]

  sendSuccessResponse(res, 200, { upiApps }, 'UPI apps list retrieved successfully')
})

// Validate UPI VPA
export const validateUPIVPA = asyncHandler(async (req, res, next) => {
  const { vpa } = req.body

  if (!vpa) {
    return next(new AppError('VPA is required', 400))
  }

  // Basic VPA format validation
  const upiRegex = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/
  const isValidFormat = upiRegex.test(vpa)

  // In a real implementation, you would verify with the bank/PSP
  // For demo purposes, we'll simulate validation
  const isValid = isValidFormat && !vpa.includes('invalid')

  sendSuccessResponse(res, 200, {
    vpa,
    isValid,
    isValidFormat,
    message: isValid ? 'VPA is valid' : 'Invalid VPA'
  }, 'VPA validation completed')
})

// Get payment methods
export const getPaymentMethods = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('preferences')

  const paymentMethods = [
    {
      type: 'upi',
      name: 'UPI',
      icon: '/images/payment-methods/upi.png',
      enabled: true,
      description: 'Pay using UPI apps like GPay, PhonePe, Paytm'
    },
    {
      type: 'card',
      name: 'Credit/Debit Card',
      icon: '/images/payment-methods/card.png',
      enabled: true,
      description: 'Pay using credit or debit card'
    },
    {
      type: 'netbanking',
      name: 'Net Banking',
      icon: '/images/payment-methods/netbanking.png',
      enabled: true,
      description: 'Pay using internet banking'
    },
    {
      type: 'wallet',
      name: 'Wallet',
      icon: '/images/payment-methods/wallet.png',
      enabled: false,
      description: 'Pay using digital wallet'
    }
  ]

  sendSuccessResponse(res, 200, {
    paymentMethods,
    defaultCurrency: user.preferences?.currency || 'INR'
  }, 'Payment methods retrieved successfully')
})