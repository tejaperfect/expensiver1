import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  externalTransactionId: String, // From payment gateway
  
  // Transaction Type
  type: {
    type: String,
    enum: ['payment', 'settlement', 'refund', 'fee', 'transfer'],
    required: true
  },
  subType: {
    type: String,
    enum: ['expense_payment', 'group_settlement', 'wallet_topup', 'withdrawal', 'split_payment']
  },
  
  // Parties Involved
  from: {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['user', 'system', 'gateway'],
      default: 'user'
    }
  },
  to: {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['user', 'system', 'gateway'],
      default: 'user'
    }
  },
  
  // Financial Details
  amount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
    default: 'INR'
  },
  originalAmount: Number, // Before currency conversion
  originalCurrency: String,
  exchangeRate: { type: Number, default: 1 },
  
  // Fees and Charges
  fees: {
    gateway: { type: Number, default: 0 },
    platform: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  netAmount: Number, // Amount after fees
  
  // Payment Method
  paymentMethod: {
    type: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'bank_transfer', 'cash'],
      required: true
    },
    details: {
      // UPI Details
      vpa: String,
      upiAppName: String,
      
      // Card Details
      cardType: String, // visa, mastercard, rupay
      cardNetwork: String,
      lastFourDigits: String,
      bankName: String,
      
      // Bank Transfer Details
      accountNumber: String,
      ifscCode: String,
      
      // Wallet Details
      walletName: String,
      walletId: String
    }
  },
  
  // Related Entities
  relatedTo: {
    expense: {
      type: mongoose.Schema.ObjectId,
      ref: 'Expense'
    },
    group: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group'
    },
    settlement: {
      type: mongoose.Schema.ObjectId,
      ref: 'Settlement'
    }
  },
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    reason: String,
    updatedBy: String
  }],
  
  // Gateway Information
  gateway: {
    provider: {
      type: String,
      enum: ['razorpay', 'payu', 'cashfree', 'stripe', 'paypal'],
      default: 'razorpay'
    },
    orderId: String,
    paymentId: String,
    signature: String,
    webhookData: mongoose.Schema.Types.Mixed
  },
  
  // Verification and Security
  verification: {
    isVerified: { type: Boolean, default: false },
    verificationMethod: String, // otp, biometric, pin
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 }
  },
  
  // Timing Information
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  expiresAt: Date,
  
  // Description and Notes
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Receipt and Documentation
  receipt: {
    url: String,
    number: String,
    downloadUrl: String
  },
  
  // Error Information
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: Date
  },
  
  // Notification Status
  notifications: {
    sent: { type: Boolean, default: false },
    sentAt: Date,
    methods: [String] // email, sms, push
  },
  
  // Reconciliation
  reconciliation: {
    isReconciled: { type: Boolean, default: false },
    reconciledAt: Date,
    reconciledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    bankStatementRef: String
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceInfo: String,
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      country: String
    }
  },
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
transactionSchema.index({ transactionId: 1 })
transactionSchema.index({ 'from.user': 1, createdAt: -1 })
transactionSchema.index({ 'to.user': 1, createdAt: -1 })
transactionSchema.index({ status: 1 })
transactionSchema.index({ type: 1, status: 1 })
transactionSchema.index({ 'gateway.paymentId': 1 })
transactionSchema.index({ 'relatedTo.expense': 1 })
transactionSchema.index({ 'relatedTo.group': 1 })
transactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Compound indexes
transactionSchema.index({ 'from.user': 1, status: 1, createdAt: -1 })
transactionSchema.index({ type: 1, 'relatedTo.group': 1, createdAt: -1 })

// Virtual fields
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount)
})

transactionSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < Date.now()
})

transactionSchema.virtual('isPending').get(function() {
  return ['pending', 'processing'].includes(this.status)
})

transactionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed'
})

transactionSchema.virtual('isFailed').get(function() {
  return ['failed', 'cancelled', 'expired'].includes(this.status)
})

transactionSchema.virtual('timeTaken').get(function() {
  if (this.completedAt && this.initiatedAt) {
    return this.completedAt - this.initiatedAt
  }
  return null
})

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Generate transaction ID if not exists
  if (!this.transactionId) {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    this.transactionId = `TXN${timestamp}${random}`
  }
  
  // Calculate net amount
  if (this.fees && this.fees.total > 0) {
    this.netAmount = this.amount - this.fees.total
  } else {
    this.netAmount = this.amount
  }
  
  // Set expiry for pending transactions (30 minutes default)
  if (this.status === 'pending' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  }
  
  // Track status changes
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
      reason: this.notes || 'Status updated'
    })
    
    if (this.status === 'completed') {
      this.completedAt = Date.now()
    }
  }
  
  // Update timestamp
  this.updatedAt = Date.now()
  
  next()
})

// Instance methods
transactionSchema.methods.updateStatus = function(newStatus, reason = '') {
  this.status = newStatus
  this.notes = reason
  
  if (newStatus === 'completed') {
    this.completedAt = Date.now()
  }
  
  return this.save()
}

transactionSchema.methods.addError = function(errorCode, errorMessage, details = {}) {
  this.error = {
    code: errorCode,
    message: errorMessage,
    details,
    timestamp: Date.now()
  }
  this.status = 'failed'
  return this.save()
}

transactionSchema.methods.markAsReconciled = function(reconciledBy, bankRef = '') {
  this.reconciliation = {
    isReconciled: true,
    reconciledAt: Date.now(),
    reconciledBy,
    bankStatementRef: bankRef
  }
  return this.save()
}

transactionSchema.methods.sendNotification = function(methods = ['email']) {
  this.notifications = {
    sent: true,
    sentAt: Date.now(),
    methods
  }
  return this.save()
}

transactionSchema.methods.canBeRefunded = function() {
  return this.status === 'completed' && 
         ['payment', 'settlement'].includes(this.type) &&
         (Date.now() - this.completedAt) < (30 * 24 * 60 * 60 * 1000) // 30 days
}

transactionSchema.methods.createRefund = function(refundAmount, reason) {
  if (!this.canBeRefunded()) {
    throw new Error('Transaction cannot be refunded')
  }
  
  const refundTransaction = new this.constructor({
    type: 'refund',
    from: this.to,
    to: this.from,
    amount: refundAmount || this.amount,
    currency: this.currency,
    paymentMethod: this.paymentMethod,
    relatedTo: this.relatedTo,
    description: `Refund for ${this.transactionId}`,
    notes: reason,
    gateway: {
      provider: this.gateway.provider,
      orderId: this.gateway.orderId
    }
  })
  
  return refundTransaction
}

// Static methods
transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { 'from.user': userId },
      { 'to.user': userId }
    ]
  }
  
  if (options.type) query.type = options.type
  if (options.status) query.status = options.status
  if (options.startDate || options.endDate) {
    query.createdAt = {}
    if (options.startDate) query.createdAt.$gte = new Date(options.startDate)
    if (options.endDate) query.createdAt.$lte = new Date(options.endDate)
  }
  
  return this.find(query).sort({ createdAt: -1 })
}

transactionSchema.statics.findByExpense = function(expenseId) {
  return this.find({ 'relatedTo.expense': expenseId }).sort({ createdAt: -1 })
}

transactionSchema.statics.findByGroup = function(groupId) {
  return this.find({ 'relatedTo.group': groupId }).sort({ createdAt: -1 })
}

transactionSchema.statics.getUserBalance = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { 'from.user': new mongoose.Types.ObjectId(userId) },
          { 'to.user': new mongoose.Types.ObjectId(userId) }
        ],
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalSent: {
          $sum: {
            $cond: [
              { $eq: ['$from.user', new mongoose.Types.ObjectId(userId)] },
              '$amount',
              0
            ]
          }
        },
        totalReceived: {
          $sum: {
            $cond: [
              { $eq: ['$to.user', new mongoose.Types.ObjectId(userId)] },
              '$amount',
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        balance: { $subtract: ['$totalReceived', '$totalSent'] },
        totalSent: 1,
        totalReceived: 1
      }
    }
  ])
}

transactionSchema.statics.getTransactionStats = function(startDate, endDate) {
  const matchStage = {
    status: 'completed'
  }
  
  if (startDate || endDate) {
    matchStage.createdAt = {}
    if (startDate) matchStage.createdAt.$gte = new Date(startDate)
    if (endDate) matchStage.createdAt.$lte = new Date(endDate)
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ])
}

transactionSchema.statics.findPendingExpired = function() {
  return this.find({
    status: 'pending',
    expiresAt: { $lt: new Date() }
  })
}

// Query middleware
transactionSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'from.user',
    select: 'name email avatar'
  }).populate({
    path: 'to.user',
    select: 'name email avatar'
  })
  next()
})

const Transaction = mongoose.model('Transaction', transactionSchema)

export { Transaction }