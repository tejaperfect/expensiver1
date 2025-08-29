import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import slugify from 'slugify'

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    validate: {
      validator: function(email) {
        // Additional email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      },
      message: 'Please provide a valid email address'
    }
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [30, 'Username cannot exceed 30 characters'],
    minlength: [3, 'Username must be at least 3 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  phone: {
    type: String,
    sparse: true,
    trim: true,
    match: [/^[+]?[1-9]?[0-9]{7,15}$/, 'Please provide a valid phone number'],
    validate: {
      validator: function(phone) {
        if (!phone) return true // Optional field
        return /^[+]?[1-9]?[0-9]{7,15}$/.test(phone)
      },
      message: 'Please provide a valid international phone number'
    }
  },
  
  // Authentication
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    maxlength: [128, 'Password cannot exceed 128 characters'],
    select: false,
    validate: {
      validator: function(password) {
        // Strong password validation
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasNumbers = /\d/.test(password)
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
        
        return hasUpperCase && hasLowerCase && hasNumbers && (hasSpecialChar || password.length >= 12)
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (or be at least 12 characters long)'
    }
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(el) {
        return el === this.password
      },
      message: 'Passwords do not match'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Profile Information
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
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  occupation: {
    type: String,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    },
    zipCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Account Settings
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  
  // Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationToken: String,
  phoneVerificationExpires: Date,
  
  // User Preferences
  preferences: {
    currency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'],
      default: 'INR'
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'es', 'fr', 'de'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    notifications: {
      email: {
        expenses: { type: Boolean, default: true },
        groups: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        marketing: { type: Boolean, default: false },
        security: { type: Boolean, default: true }
      },
      push: {
        expenses: { type: Boolean, default: true },
        groups: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true }
      },
      sms: {
        payments: { type: Boolean, default: false },
        security: { type: Boolean, default: true }
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'friends'
      },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      allowFriendRequests: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true }
    }
  },
  
  // Financial Settings
  defaultBudget: {
    monthly: {
      type: Number,
      default: 50000
    },
    categories: [{
      name: String,
      limit: Number,
      spent: { type: Number, default: 0 }
    }]
  },
  
  // Groups and Relationships
  groups: [{
    groupId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Group'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Security
  loginAttempts: {
    type: Number,
    default: 0,
    max: [10, 'Too many login attempts']
  },
  lockUntil: Date,
  lastLogin: Date,
  lastLoginIP: String,
  loginHistory: [{
    ip: String,
    userAgent: String,
    loginTime: { type: Date, default: Date.now },
    location: {
      country: String,
      city: String,
      timezone: String
    }
  }],
  securityEvents: [{
    type: {
      type: String,
      enum: ['login', 'logout', 'password_change', 'email_change', 'failed_login', 'account_lock']
    },
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    details: String
  }],
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    secret: String,
    backupCodes: [String]
  },
  
  // Statistics
  stats: {
    totalExpenses: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    groupsJoined: { type: Number, default: 0 },
    expensesCreated: { type: Number, default: 0 },
    lastActivity: Date
  },
  
  // Metadata
  devices: [{
    deviceId: String,
    deviceName: String,
    platform: String,
    lastUsed: Date,
    pushToken: String
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
userSchema.index({ email: 1 })
userSchema.index({ username: 1 })
userSchema.index({ phone: 1 })
userSchema.index({ createdAt: -1 })
userSchema.index({ 'address.coordinates': '2dsphere' })
userSchema.index({ accountStatus: 1, active: 1 })
userSchema.index({ lockUntil: 1 })
userSchema.index({ passwordResetExpires: 1 })
userSchema.index({ emailVerificationExpires: 1 })
userSchema.index({ 'stats.lastActivity': -1 })

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return this.name
})

userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
})

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only run if password was modified
  if (!this.isModified('password')) return next()
  
  // Hash password with cost of 12 (or higher for production)
  const saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12
  this.password = await bcrypt.hash(this.password, saltRounds)
  
  // Delete passwordConfirm field
  this.passwordConfirm = undefined
  next()
})

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next()
  
  this.passwordChangedAt = Date.now() - 1000
  next()
})

userSchema.pre('save', function(next) {
  // Generate username if not provided
  if (!this.username && this.name) {
    this.username = slugify(this.name.toLowerCase()) + '_' + crypto.randomBytes(4).toString('hex')
  }
  
  // Update timestamp
  this.updatedAt = Date.now()
  next()
})

// Instance methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimestamp
  }
  return false
}

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex')
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
  
  return resetToken
}

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex')
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex')
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  
  return verificationToken
}

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    })
  }
  
  const updates = { $inc: { loginAttempts: 1 } }
  
  // Progressive lockout: 5 attempts = 1 hour, 10 attempts = 24 hours
  const attempts = this.loginAttempts + 1
  if (attempts >= 5 && !this.isLocked) {
    const lockDuration = attempts >= 10 ? 24 * 60 * 60 * 1000 : 1 * 60 * 60 * 1000
    updates.$set = { lockUntil: Date.now() + lockDuration }
  }
  
  return this.updateOne(updates)
}

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  })
}

userSchema.methods.updateStats = function(type, amount = 0) {
  const updates = {}
  
  switch (type) {
    case 'expense':
      updates['stats.totalExpenses'] = (this.stats.totalExpenses || 0) + 1
      updates['stats.totalSpent'] = (this.stats.totalSpent || 0) + amount
      updates['stats.expensesCreated'] = (this.stats.expensesCreated || 0) + 1
      break
    case 'group_join':
      updates['stats.groupsJoined'] = (this.stats.groupsJoined || 0) + 1
      break
  }
  
  updates['stats.lastActivity'] = Date.now()
  
  return this.updateOne({ $set: updates })
}

// Add security event tracking
userSchema.methods.addSecurityEvent = function(type, ip, userAgent, details = '') {
  const event = {
    type,
    timestamp: Date.now(),
    ip,
    userAgent,
    details
  }
  
  // Keep only last 50 security events
  const updates = {
    $push: {
      securityEvents: {
        $each: [event],
        $slice: -50
      }
    }
  }
  
  return this.updateOne(updates)
}

// Add login history tracking
userSchema.methods.addLoginHistory = function(ip, userAgent, location = {}) {
  const loginRecord = {
    ip,
    userAgent,
    loginTime: Date.now(),
    location
  }
  
  // Keep only last 10 login records
  const updates = {
    $push: {
      loginHistory: {
        $each: [loginRecord],
        $slice: -10
      }
    }
  }
  
  return this.updateOne(updates)
}

// Email change validation
userSchema.methods.createEmailChangeToken = function(newEmail) {
  const changeToken = crypto.randomBytes(32).toString('hex')
  
  this.emailChangeToken = crypto
    .createHash('sha256')
    .update(changeToken)
    .digest('hex')
  
  this.emailChangeExpires = Date.now() + 30 * 60 * 1000 // 30 minutes
  this.newEmail = newEmail
  
  return changeToken
}

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() })
}

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() })
}

userSchema.statics.getFailedLogin = function() {
  return this.findOne({
    $or: [
      { lockUntil: { $exists: true, $gt: Date.now() } },
      { loginAttempts: { $gte: 5 } }
    ]
  })
}

// Query middleware
userSchema.pre(/^find/, function(next) {
  // this points to current query
  this.find({ active: { $ne: false } })
  next()
})

// Add schema validation for email change
userSchema.add({
  emailChangeToken: String,
  emailChangeExpires: Date,
  newEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  }
})

const User = mongoose.model('User', userSchema)

export { User }