import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Notification Type and Category
  type: {
    type: String,
    enum: [
      'expense_added', 'expense_updated', 'expense_deleted',
      'group_invitation', 'group_joined', 'group_left', 'group_updated',
      'settlement_request', 'settlement_completed', 'payment_received',
      'payment_reminder', 'budget_exceeded', 'budget_warning',
      'monthly_report', 'weekly_summary', 'account_security',
      'system_announcement', 'feature_update', 'other'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['expense', 'group', 'payment', 'budget', 'report', 'security', 'system'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Content
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  shortMessage: {
    type: String,
    maxlength: [100, 'Short message cannot exceed 100 characters']
  },
  
  // Rich Content
  data: {
    // Related entity IDs
    expenseId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Expense'
    },
    groupId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group'
    },
    transactionId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Transaction'
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    
    // Additional data
    amount: Number,
    currency: String,
    actionUrl: String,
    imageUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Delivery Channels
  channels: {
    inApp: {
      enabled: { type: Boolean, default: true },
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date
    },
    email: {
      enabled: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      opened: { type: Boolean, default: false },
      openedAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date,
      bounced: { type: Boolean, default: false },
      templateId: String
    },
    push: {
      enabled: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date,
      deviceTokens: [String],
      payload: mongoose.Schema.Types.Mixed
    },
    sms: {
      enabled: { type: Boolean, default: false },
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      phone: String,
      provider: String,
      messageId: String
    }
  },
  
  // Scheduling
  scheduledFor: Date,
  expiresAt: Date,
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // Grouping and Batching
  batchId: String,
  groupKey: String, // For grouping similar notifications
  
  // Action Buttons
  actions: [{
    type: {
      type: String,
      enum: ['button', 'link', 'deep_link']
    },
    label: String,
    action: String, // URL or action identifier
    style: {
      type: String,
      enum: ['primary', 'secondary', 'danger', 'success'],
      default: 'primary'
    }
  }],
  
  // Sender Information
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  senderType: {
    type: String,
    enum: ['user', 'system', 'admin'],
    default: 'system'
  },
  
  // Tracking and Analytics
  tracking: {
    viewed: { type: Boolean, default: false },
    viewedAt: Date,
    interacted: { type: Boolean, default: false },
    interactedAt: Date,
    dismissed: { type: Boolean, default: false },
    dismissedAt: Date
  },
  
  // Error Information
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: Date
  },
  
  // Retry Logic
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  nextRetryAt: Date,
  
  // Preferences Override
  forceDelivery: {
    type: Boolean,
    default: false
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
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ type: 1, status: 1 })
notificationSchema.index({ status: 1, scheduledFor: 1 })
notificationSchema.index({ batchId: 1 })
notificationSchema.index({ groupKey: 1, recipient: 1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
notificationSchema.index({ 'channels.inApp.read': 1, recipient: 1 })

// Compound indexes
notificationSchema.index({ recipient: 1, category: 1, 'channels.inApp.read': 1 })
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 })

// Virtual fields
notificationSchema.virtual('isRead').get(function() {
  return this.channels.inApp.read
})

notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < Date.now()
})

notificationSchema.virtual('isPending').get(function() {
  return this.status === 'pending'
})

notificationSchema.virtual('isDelivered').get(function() {
  return ['sent', 'delivered'].includes(this.status)
})

notificationSchema.virtual('timeAgo').get(function() {
  const now = Date.now()
  const diff = now - this.createdAt
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
})

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set short message if not provided
  if (!this.shortMessage && this.message) {
    this.shortMessage = this.message.length > 100 
      ? this.message.substring(0, 97) + '...'
      : this.message
  }
  
  // Set expiry date if not provided (30 days default)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }
  
  // Set group key for similar notifications
  if (!this.groupKey) {
    this.groupKey = `${this.type}_${this.data?.expenseId || this.data?.groupId || 'general'}`
  }
  
  // Update timestamp
  this.updatedAt = Date.now()
  
  next()
})

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.channels.inApp.read = true
  this.channels.inApp.readAt = Date.now()
  this.tracking.viewed = true
  this.tracking.viewedAt = Date.now()
  return this.save()
}

notificationSchema.methods.markAsDelivered = function(channel) {
  if (this.channels[channel]) {
    this.channels[channel].delivered = true
    this.channels[channel].deliveredAt = Date.now()
    
    // Update overall status
    if (this.status === 'pending' || this.status === 'sent') {
      this.status = 'delivered'
    }
  }
  return this.save()
}

notificationSchema.methods.markAsClicked = function(channel) {
  if (this.channels[channel]) {
    this.channels[channel].clicked = true
    this.channels[channel].clickedAt = Date.now()
    this.tracking.interacted = true
    this.tracking.interactedAt = Date.now()
  }
  return this.save()
}

notificationSchema.methods.markAsFailed = function(errorMessage, errorCode) {
  this.status = 'failed'
  this.error = {
    message: errorMessage,
    code: errorCode,
    timestamp: Date.now()
  }
  return this.save()
}

notificationSchema.methods.scheduleRetry = function(delayMinutes = 5) {
  if (this.retryCount < this.maxRetries) {
    this.retryCount += 1
    this.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000)
    this.status = 'pending'
    return this.save()
  }
  return false
}

notificationSchema.methods.dismiss = function() {
  this.tracking.dismissed = true
  this.tracking.dismissedAt = Date.now()
  return this.save()
}

notificationSchema.methods.shouldDelivery = function(channel, userPreferences) {
  // Force delivery overrides preferences
  if (this.forceDelivery) return true
  
  // Check if channel is enabled for this notification
  if (!this.channels[channel]?.enabled) return false
  
  // Check user preferences
  if (userPreferences && userPreferences.notifications) {
    const channelPrefs = userPreferences.notifications[channel]
    if (!channelPrefs) return false
    
    // Check category-specific preferences
    switch (this.category) {
      case 'expense':
        return channelPrefs.expenses !== false
      case 'group':
        return channelPrefs.groups !== false
      case 'payment':
        return channelPrefs.payments !== false
      case 'security':
        return channelPrefs.security !== false
      default:
        return true
    }
  }
  
  return true
}

// Static methods
notificationSchema.statics.findUnread = function(userId) {
  return this.find({
    recipient: userId,
    'channels.inApp.read': false,
    status: { $in: ['sent', 'delivered'] }
  }).sort({ createdAt: -1 })
}

notificationSchema.statics.findByUser = function(userId, options = {}) {
  const query = { recipient: userId }
  
  if (options.category) query.category = options.category
  if (options.type) query.type = options.type
  if (options.read !== undefined) query['channels.inApp.read'] = options.read
  if (options.startDate || options.endDate) {
    query.createdAt = {}
    if (options.startDate) query.createdAt.$gte = new Date(options.startDate)
    if (options.endDate) query.createdAt.$lte = new Date(options.endDate)
  }
  
  return this.find(query).sort({ createdAt: -1 })
}

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { 
      recipient: userId,
      'channels.inApp.read': false 
    },
    {
      $set: {
        'channels.inApp.read': true,
        'channels.inApp.readAt': Date.now(),
        'tracking.viewed': true,
        'tracking.viewedAt': Date.now()
      }
    }
  )
}

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    'channels.inApp.read': false,
    status: { $in: ['sent', 'delivered'] }
  })
}

notificationSchema.statics.findPendingDelivery = function() {
  return this.find({
    status: 'pending',
    $or: [
      { scheduledFor: { $lte: new Date() } },
      { scheduledFor: { $exists: false } }
    ],
    expiresAt: { $gt: new Date() }
  })
}

notificationSchema.statics.findRetryQueue = function() {
  return this.find({
    status: 'failed',
    retryCount: { $lt: '$maxRetries' },
    nextRetryAt: { $lte: new Date() }
  })
}

notificationSchema.statics.cleanupOld = function(daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    'channels.inApp.read': true
  })
}

notificationSchema.statics.createExpenseNotification = function(type, recipientId, expenseData, senderId = null) {
  const notification = new this({
    recipient: recipientId,
    type,
    category: 'expense',
    sender: senderId,
    senderType: senderId ? 'user' : 'system',
    data: {
      expenseId: expenseData._id,
      groupId: expenseData.group,
      amount: expenseData.amount,
      currency: expenseData.currency,
      actionUrl: `/expenses/${expenseData._id}`
    }
  })
  
  // Set title and message based on type
  switch (type) {
    case 'expense_added':
      notification.title = 'New Expense Added'
      notification.message = `${expenseData.title} - ${expenseData.formattedAmount}`
      break
    case 'expense_updated':
      notification.title = 'Expense Updated'
      notification.message = `${expenseData.title} has been updated`
      break
    case 'expense_deleted':
      notification.title = 'Expense Deleted'
      notification.message = `${expenseData.title} has been deleted`
      break
  }
  
  return notification.save()
}

notificationSchema.statics.createGroupNotification = function(type, recipientId, groupData, senderId = null) {
  const notification = new this({
    recipient: recipientId,
    type,
    category: 'group',
    sender: senderId,
    senderType: senderId ? 'user' : 'system',
    data: {
      groupId: groupData._id,
      actionUrl: `/groups/${groupData._id}`
    }
  })
  
  // Set title and message based on type
  switch (type) {
    case 'group_invitation':
      notification.title = 'Group Invitation'
      notification.message = `You've been invited to join ${groupData.name}`
      break
    case 'group_joined':
      notification.title = 'New Member Joined'
      notification.message = `Someone joined ${groupData.name}`
      break
    case 'group_updated':
      notification.title = 'Group Updated'
      notification.message = `${groupData.name} has been updated`
      break
  }
  
  return notification.save()
}

// Query middleware
notificationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'name avatar'
  })
  next()
})

const Notification = mongoose.model('Notification', notificationSchema)

export { Notification }