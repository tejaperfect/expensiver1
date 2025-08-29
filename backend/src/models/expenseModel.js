import mongoose from 'mongoose'
import slugify from 'slugify'

const expenseSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Please provide expense title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
    minlength: [2, 'Title must be at least 2 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  slug: String,
  
  // Financial Information
  amount: {
    type: Number,
    required: [true, 'Please provide expense amount'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [10000000, 'Amount cannot exceed 10,000,000']
  },
  originalAmount: Number, // For currency conversion tracking
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
    default: 'INR'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  
  // Categorization
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'food', 'transport', 'entertainment', 'shopping', 'bills', 'health',
      'education', 'travel', 'groceries', 'fuel', 'clothing', 'electronics',
      'home', 'pets', 'gifts', 'charity', 'investment', 'insurance',
      'business', 'other'
    ]
  },
  subcategory: {
    type: String,
    maxlength: [50, 'Subcategory cannot exceed 50 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Date and Time
  date: {
    type: Date,
    required: [true, 'Please provide expense date'],
    default: Date.now
  },
  dueDate: Date, // For recurring or planned expenses
  
  // Location
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    placeId: String // Google Places ID
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'other'],
    default: 'cash'
  },
  paymentDetails: {
    cardType: String, // visa, mastercard, etc.
    lastFourDigits: String,
    bankName: String,
    upiId: String,
    transactionId: String
  },
  
  // User and Group Information
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group'
  },
  isGroupExpense: {
    type: Boolean,
    default: false
  },
  
  // Split Information (for group expenses)
  splitType: {
    type: String,
    enum: ['equal', 'exact', 'percentage', 'by_shares'],
    default: 'equal'
  },
  splitDetails: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    amount: Number,
    percentage: Number,
    shares: Number,
    paid: { type: Boolean, default: false },
    paidAt: Date
  }],
  totalSplit: {
    type: Number,
    default: 0
  },
  
  // Recurring Expenses
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    interval: { type: Number, default: 1 }, // Every X days/weeks/months
    endDate: Date,
    nextDue: Date,
    maxOccurrences: Number
  },
  parentExpense: {
    type: mongoose.Schema.ObjectId,
    ref: 'Expense'
  },
  
  // Attachments and Media
  receipts: [{
    url: String,
    thumbnailUrl: String,
    filename: String,
    originalName: String,
    size: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  images: [{
    url: String,
    thumbnailUrl: String,
    filename: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Status and Workflow
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'draft', 'settled'],
    default: 'approved'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Settlement Information
  isSettled: {
    type: Boolean,
    default: false
  },
  settledAt: Date,
  settledBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  settlements: [{
    from: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    amount: Number,
    settledAt: Date,
    transactionId: String
  }],
  
  // AI and Analytics
  aiCategory: {
    predicted: String,
    confidence: Number,
    suggestions: [String]
  },
  insights: {
    isUnusual: { type: Boolean, default: false },
    reasonForUnusual: String,
    budgetImpact: Number,
    categoryTrend: String
  },
  
  // Notifications and Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['payment_due', 'approval_needed', 'settlement_reminder']
    },
    date: Date,
    sent: { type: Boolean, default: false },
    sentAt: Date
  }],
  
  // Comments and Notes
  comments: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    editedAt: Date,
    isEdited: { type: Boolean, default: false }
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['manual', 'sms', 'email', 'bank_api', 'receipt_scan', 'import'],
    default: 'manual'
  },
  originalData: mongoose.Schema.Types.Mixed, // For storing original SMS/email/API data
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date,
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ group: 1, date: -1 })
expenseSchema.index({ category: 1, date: -1 })
expenseSchema.index({ status: 1 })
expenseSchema.index({ isGroupExpense: 1 })
expenseSchema.index({ 'location.coordinates': '2dsphere' })
expenseSchema.index({ date: -1 })
expenseSchema.index({ slug: 1 })
expenseSchema.index({ tags: 1 })
expenseSchema.index({ 'recurringPattern.nextDue': 1 })

// Compound indexes
expenseSchema.index({ user: 1, category: 1, date: -1 })
expenseSchema.index({ group: 1, status: 1, date: -1 })

// Virtual fields
expenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount)
})

expenseSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24))
})

expenseSchema.virtual('isOverdue').get(function() {
  return this.dueDate && this.dueDate < Date.now() && this.status !== 'settled'
})

expenseSchema.virtual('totalComments').get(function() {
  return this.comments.length
})

expenseSchema.virtual('hasReceipts').get(function() {
  return this.receipts && this.receipts.length > 0
})

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  // Generate slug
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true })
  }
  
  // Calculate total split for group expenses
  if (this.isGroupExpense && this.splitDetails.length > 0) {
    this.totalSplit = this.splitDetails.reduce((total, split) => total + (split.amount || 0), 0)
  }
  
  // Set original amount for currency tracking
  if (this.isModified('amount') && !this.originalAmount) {
    this.originalAmount = this.amount
  }
  
  // Update timestamp
  this.updatedAt = Date.now()
  
  next()
})

expenseSchema.pre('save', function(next) {
  // Auto-categorize if AI category is provided
  if (this.aiCategory && this.aiCategory.predicted && !this.category) {
    this.category = this.aiCategory.predicted
  }
  
  // Set next due date for recurring expenses
  if (this.isRecurring && this.recurringPattern && !this.recurringPattern.nextDue) {
    const { frequency, interval } = this.recurringPattern
    const nextDue = new Date(this.date)
    
    switch (frequency) {
      case 'daily':
        nextDue.setDate(nextDue.getDate() + interval)
        break
      case 'weekly':
        nextDue.setDate(nextDue.getDate() + (interval * 7))
        break
      case 'monthly':
        nextDue.setMonth(nextDue.getMonth() + interval)
        break
      case 'quarterly':
        nextDue.setMonth(nextDue.getMonth() + (interval * 3))
        break
      case 'yearly':
        nextDue.setFullYear(nextDue.getFullYear() + interval)
        break
    }
    
    this.recurringPattern.nextDue = nextDue
  }
  
  next()
})

// Instance methods
expenseSchema.methods.addComment = function(userId, message) {
  this.comments.push({
    user: userId,
    message: message,
    createdAt: Date.now()
  })
  return this.save()
}

expenseSchema.methods.updateSplitPayment = function(userId, paid = true) {
  const split = this.splitDetails.find(s => s.user.toString() === userId.toString())
  if (split) {
    split.paid = paid
    split.paidAt = paid ? Date.now() : null
  }
  return this.save()
}

expenseSchema.methods.calculateUserShare = function(userId) {
  if (!this.isGroupExpense) return this.amount
  
  const split = this.splitDetails.find(s => s.user.toString() === userId.toString())
  return split ? split.amount : 0
}

expenseSchema.methods.isUserInvolved = function(userId) {
  if (this.user.toString() === userId.toString()) return true
  if (this.isGroupExpense) {
    return this.splitDetails.some(split => split.user.toString() === userId.toString())
  }
  return false
}

expenseSchema.methods.generateNextRecurring = function() {
  if (!this.isRecurring || !this.recurringPattern.nextDue) return null
  
  const nextExpense = new this.constructor({
    ...this.toObject(),
    _id: undefined,
    date: this.recurringPattern.nextDue,
    parentExpense: this._id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'pending',
    comments: [],
    receipts: [],
    images: []
  })
  
  return nextExpense
}

// Static methods
expenseSchema.statics.findByUser = function(userId, options = {}) {
  const query = this.find({ user: userId })
  
  if (options.category) query.where('category').equals(options.category)
  if (options.startDate) query.where('date').gte(options.startDate)
  if (options.endDate) query.where('date').lte(options.endDate)
  if (options.status) query.where('status').equals(options.status)
  
  return query.sort({ date: -1 })
}

expenseSchema.statics.findByGroup = function(groupId, options = {}) {
  const query = this.find({ group: groupId, isGroupExpense: true })
  
  if (options.category) query.where('category').equals(options.category)
  if (options.startDate) query.where('date').gte(options.startDate)
  if (options.endDate) query.where('date').lte(options.endDate)
  if (options.status) query.where('status').equals(options.status)
  
  return query.sort({ date: -1 })
}

expenseSchema.statics.getUserTotalSpent = function(userId, startDate, endDate) {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    status: { $in: ['approved', 'settled'] }
  }
  
  if (startDate || endDate) {
    matchStage.date = {}
    if (startDate) matchStage.date.$gte = new Date(startDate)
    if (endDate) matchStage.date.$lte = new Date(endDate)
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalExpenses: { $sum: 1 }
      }
    }
  ])
}

expenseSchema.statics.getCategoryBreakdown = function(userId, startDate, endDate) {
  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    status: { $in: ['approved', 'settled'] }
  }
  
  if (startDate || endDate) {
    matchStage.date = {}
    if (startDate) matchStage.date.$gte = new Date(startDate)
    if (endDate) matchStage.date.$lte = new Date(endDate)
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ])
}

// Query middleware
expenseSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name email avatar'
  })
  next()
})

const Expense = mongoose.model('Expense', expenseSchema)

export { Expense }