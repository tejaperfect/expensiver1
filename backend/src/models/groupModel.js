import mongoose from 'mongoose'
import slugify from 'slugify'
import crypto from 'crypto'

const groupSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please provide group name'],
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters'],
    minlength: [2, 'Group name must be at least 2 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  slug: String,
  
  // Group Identification
  groupCode: {
    type: String,
    unique: true,
    uppercase: true,
    required: true
  },
  qrCode: String, // QR code URL for easy joining
  
  // Visual Identity
  avatar: {
    url: {
      type: String,
      default: ''
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    publicId: String
  },
  coverImage: {
    url: String,
    thumbnailUrl: String,
    publicId: String
  },
  color: {
    type: String,
    default: '#4F46E5',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  
  // Ownership and Administration
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  
  // Members Management
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active'
    },
    permissions: {
      canAddExpenses: { type: Boolean, default: true },
      canEditExpenses: { type: Boolean, default: false },
      canDeleteExpenses: { type: Boolean, default: false },
      canInviteMembers: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: true },
      canManageSettings: { type: Boolean, default: false }
    },
    nickname: String,
    lastActivity: Date
  }],
  
  // Group Settings
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    maxMembers: {
      type: Number,
      default: 50,
      max: 100
    },
    defaultCurrency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
      default: 'INR'
    },
    expenseApprovalRequired: {
      type: Boolean,
      default: false
    },
    minimumExpenseAmount: {
      type: Number,
      default: 0
    },
    maximumExpenseAmount: {
      type: Number,
      default: 100000
    },
    allowRecurringExpenses: {
      type: Boolean,
      default: true
    },
    autoSettlement: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 1000 },
      frequency: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly'],
        default: 'monthly'
      }
    }
  },
  
  // Categories and Budget
  categories: [{
    name: {
      type: String,
      required: true
    },
    budget: Number,
    spent: { type: Number, default: 0 },
    color: String,
    icon: String,
    description: String
  }],
  
  totalBudget: {
    monthly: Number,
    yearly: Number
  },
  
  // Financial Summary
  financials: {
    totalExpenses: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    pendingSettlements: { type: Number, default: 0 },
    lastSettlement: Date,
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
      default: 'INR'
    }
  },
  
  // Invitations
  invitations: [{
    email: String,
    phone: String,
    invitedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    token: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    }
  }],
  
  // Activity and Analytics
  activity: {
    lastExpenseAt: Date,
    lastSettlementAt: Date,
    mostActiveUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    averageExpenseAmount: { type: Number, default: 0 },
    expenseFrequency: String // daily, weekly, monthly
  },
  
  // Settlements and Balances
  balances: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    balance: {
      type: Number,
      default: 0
    },
    totalPaid: { type: Number, default: 0 },
    totalOwed: { type: Number, default: 0 },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  
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
    description: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending'
    },
    transactionId: String,
    settledAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Communication
  notifications: {
    newExpense: { type: Boolean, default: true },
    expenseUpdated: { type: Boolean, default: true },
    settlementReminder: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: false },
    monthlyReport: { type: Boolean, default: true }
  },
  
  // Group Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
groupSchema.index({ groupCode: 1 })
groupSchema.index({ creator: 1 })
groupSchema.index({ 'members.user': 1 })
groupSchema.index({ slug: 1 })
groupSchema.index({ status: 1 })
groupSchema.index({ createdAt: -1 })
groupSchema.index({ 'members.status': 1 })

// Compound indexes
groupSchema.index({ status: 1, 'settings.isPrivate': 1 })
groupSchema.index({ creator: 1, status: 1 })

// Virtual fields
groupSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.filter(m => m.status === 'active').length : 0
})

groupSchema.virtual('adminCount').get(function() {
  return this.members ? this.members.filter(m => m.role === 'admin' && m.status === 'active').length : 0
})

groupSchema.virtual('totalPendingInvitations').get(function() {
  return this.invitations ? this.invitations.filter(i => i.status === 'pending').length : 0
})

groupSchema.virtual('isActive').get(function() {
  return this.status === 'active'
})

groupSchema.virtual('formattedTotalAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.financials.currency
  }).format(this.financials.totalAmount)
})

// Pre-save middleware
groupSchema.pre('save', function(next) {
  // Generate slug
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true })
  }
  
  // Generate group code if not exists
  if (!this.groupCode) {
    this.groupCode = this.generateGroupCode()
  }
  
  // Ensure creator is admin
  if (this.isNew && this.creator) {
    this.admins = this.admins || []
    if (!this.admins.some(admin => admin.user.toString() === this.creator.toString())) {
      this.admins.push({
        user: this.creator,
        addedAt: Date.now(),
        addedBy: this.creator
      })
    }
    
    // Add creator as member with admin role
    this.members = this.members || []
    if (!this.members.some(member => member.user.toString() === this.creator.toString())) {
      this.members.push({
        user: this.creator,
        role: 'admin',
        joinedAt: Date.now(),
        status: 'active',
        permissions: {
          canAddExpenses: true,
          canEditExpenses: true,
          canDeleteExpenses: true,
          canInviteMembers: true,
          canViewAnalytics: true,
          canManageSettings: true
        }
      })
    }
  }
  
  // Update timestamp
  this.updatedAt = Date.now()
  
  next()
})

// Instance methods
groupSchema.methods.generateGroupCode = function() {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

groupSchema.methods.addMember = function(userId, invitedBy, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString())
  
  if (existingMember) {
    if (existingMember.status === 'inactive') {
      existingMember.status = 'active'
      existingMember.joinedAt = Date.now()
      return this.save()
    }
    throw new Error('User is already a member of this group')
  }
  
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Group has reached maximum member limit')
  }
  
  const permissions = role === 'admin' ? {
    canAddExpenses: true,
    canEditExpenses: true,
    canDeleteExpenses: true,
    canInviteMembers: true,
    canViewAnalytics: true,
    canManageSettings: true
  } : {
    canAddExpenses: true,
    canEditExpenses: false,
    canDeleteExpenses: false,
    canInviteMembers: false,
    canViewAnalytics: true,
    canManageSettings: false
  }
  
  this.members.push({
    user: userId,
    role,
    joinedAt: Date.now(),
    invitedBy,
    status: 'active',
    permissions
  })
  
  // Initialize balance for new member
  this.balances.push({
    user: userId,
    balance: 0,
    totalPaid: 0,
    totalOwed: 0,
    lastUpdated: Date.now()
  })
  
  return this.save()
}

groupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString())
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this group')
  }
  
  // Don't allow removing the creator
  if (this.creator.toString() === userId.toString()) {
    throw new Error('Cannot remove the group creator')
  }
  
  // Set member status to inactive instead of removing
  this.members[memberIndex].status = 'inactive'
  
  return this.save()
}

groupSchema.methods.updateMemberRole = function(userId, newRole, updatedBy) {
  const member = this.members.find(m => m.user.toString() === userId.toString())
  
  if (!member) {
    throw new Error('User is not a member of this group')
  }
  
  // Don't allow changing creator's role
  if (this.creator.toString() === userId.toString() && newRole !== 'admin') {
    throw new Error('Cannot change creator role')
  }
  
  member.role = newRole
  
  // Update permissions based on role
  if (newRole === 'admin') {
    member.permissions = {
      canAddExpenses: true,
      canEditExpenses: true,
      canDeleteExpenses: true,
      canInviteMembers: true,
      canViewAnalytics: true,
      canManageSettings: true
    }
    
    // Add to admins array if not already there
    if (!this.admins.some(admin => admin.user.toString() === userId.toString())) {
      this.admins.push({
        user: userId,
        addedAt: Date.now(),
        addedBy: updatedBy
      })
    }
  } else {
    // Remove from admins array
    this.admins = this.admins.filter(admin => admin.user.toString() !== userId.toString())
    
    // Reset permissions for non-admin roles
    member.permissions = {
      canAddExpenses: true,
      canEditExpenses: false,
      canDeleteExpenses: false,
      canInviteMembers: false,
      canViewAnalytics: newRole !== 'viewer',
      canManageSettings: false
    }
  }
  
  return this.save()
}

groupSchema.methods.getUserBalance = function(userId) {
  const balance = this.balances.find(b => b.user.toString() === userId.toString())
  return balance ? balance.balance : 0
}

groupSchema.methods.updateUserBalance = function(userId, amount) {
  let balance = this.balances.find(b => b.user.toString() === userId.toString())
  
  if (!balance) {
    balance = {
      user: userId,
      balance: 0,
      totalPaid: 0,
      totalOwed: 0,
      lastUpdated: Date.now()
    }
    this.balances.push(balance)
  }
  
  balance.balance += amount
  balance.lastUpdated = Date.now()
  
  if (amount > 0) {
    balance.totalPaid += amount
  } else {
    balance.totalOwed += Math.abs(amount)
  }
  
  return this.save()
}

groupSchema.methods.createInvitation = function(email, phone, invitedBy) {
  const token = crypto.randomBytes(32).toString('hex')
  
  this.invitations.push({
    email: email ? email.toLowerCase() : undefined,
    phone,
    invitedBy,
    invitedAt: Date.now(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    token,
    status: 'pending'
  })
  
  return { invitation: this.invitations[this.invitations.length - 1], token }
}

groupSchema.methods.isUserMember = function(userId) {
  return this.members.some(m => 
    m.user.toString() === userId.toString() && m.status === 'active'
  )
}

groupSchema.methods.isUserAdmin = function(userId) {
  const member = this.members.find(m => 
    m.user.toString() === userId.toString() && m.status === 'active'
  )
  return member && member.role === 'admin'
}

groupSchema.methods.getUserPermissions = function(userId) {
  const member = this.members.find(m => 
    m.user.toString() === userId.toString() && m.status === 'active'
  )
  return member ? member.permissions : null
}

// Static methods
groupSchema.statics.findByCode = function(groupCode) {
  return this.findOne({ 
    groupCode: groupCode.toUpperCase(),
    status: 'active'
  })
}

groupSchema.statics.findByUser = function(userId) {
  return this.find({
    'members.user': userId,
    'members.status': 'active',
    status: 'active'
  }).populate('members.user', 'name email avatar')
}

groupSchema.statics.findUserGroups = function(userId, role = null) {
  const query = {
    'members.user': userId,
    'members.status': 'active',
    status: 'active'
  }
  
  if (role) {
    query['members.role'] = role
  }
  
  return this.find(query)
}

// Query middleware
groupSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'creator',
    select: 'name email avatar'
  }).populate({
    path: 'members.user',
    select: 'name email avatar'
  })
  next()
})

const Group = mongoose.model('Group', groupSchema)

export { Group }