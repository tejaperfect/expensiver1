import { User, Notification } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse, sendPaginatedResponse } from '../middleware/errorMiddleware.js'
import { logger, apiLogger } from '../utils/logger.js'
import { deleteFile } from '../middleware/uploadMiddleware.js'

// Get user profile
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate('groups.groupId', 'name avatar memberCount')
    .select('-password')

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  sendSuccessResponse(res, 200, { user }, 'Profile retrieved successfully')
})

// Update user profile
export const updateProfile = asyncHandler(async (req, res, next) => {
  // Fields that can be updated
  const allowedFields = [
    'name', 'email', 'phone', 'dateOfBirth', 'gender', 
    'occupation', 'bio', 'address', 'username'
  ]
  
  const updates = {}
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key]
    }
  })

  // Check if email is being changed and if it's already taken
  if (updates.email && updates.email !== req.user.email) {
    const existingUser = await User.findOne({ email: updates.email })
    if (existingUser) {
      return next(new AppError('Email is already in use', 400))
    }
    // Reset email verification if email is changed
    updates.isEmailVerified = false
  }

  // Check if username is being changed and if it's already taken
  if (updates.username && updates.username !== req.user.username) {
    const existingUser = await User.findOne({ username: updates.username })
    if (existingUser) {
      return next(new AppError('Username is already taken', 400))
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    {
      new: true,
      runValidators: true
    }
  ).select('-password')

  logger.info(`Profile updated for user: ${user.email}`)

  sendSuccessResponse(res, 200, { user }, 'Profile updated successfully')
})

// Delete user account
export const deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  // Verify password before deletion
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError('Password is incorrect', 401))
  }

  // Soft delete - mark as inactive
  await User.findByIdAndUpdate(req.user.id, {
    active: false,
    deletedAt: Date.now(),
    email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
  })

  logger.info(`Account deleted for user: ${user.email}`)

  // Clear cookie
  res.cookie('jwt', 'deleted', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })

  sendSuccessResponse(res, 200, null, 'Account deleted successfully')
})

// Upload user avatar
export const uploadAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please provide an image file', 400))
  }

  const user = await User.findById(req.user.id)

  // Delete old avatar if exists
  if (user.avatar.url) {
    await deleteFile(user.avatar.url)
  }
  if (user.avatar.thumbnailUrl) {
    await deleteFile(user.avatar.thumbnailUrl)
  }

  // Update user with new avatar
  user.avatar = {
    url: req.file.url,
    thumbnailUrl: req.file.thumbnailUrl || req.file.url
  }

  await user.save({ validateBeforeSave: false })

  apiLogger.logFileUpload(
    req.user.id,
    req.file.originalname,
    req.file.size,
    req.file.mimetype
  )

  sendSuccessResponse(res, 200, { 
    avatar: user.avatar 
  }, 'Avatar uploaded successfully')
})

// Get user settings
export const getSettings = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('preferences defaultBudget')

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  sendSuccessResponse(res, 200, {
    preferences: user.preferences,
    defaultBudget: user.defaultBudget
  }, 'Settings retrieved successfully')
})

// Update user settings
export const updateSettings = asyncHandler(async (req, res, next) => {
  const { preferences, defaultBudget } = req.body
  const updates = {}

  if (preferences) {
    updates.preferences = { ...req.user.preferences, ...preferences }
  }

  if (defaultBudget) {
    updates.defaultBudget = { ...req.user.defaultBudget, ...defaultBudget }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    {
      new: true,
      runValidators: true
    }
  ).select('preferences defaultBudget')

  logger.info(`Settings updated for user: ${req.user.email}`)

  sendSuccessResponse(res, 200, {
    preferences: user.preferences,
    defaultBudget: user.defaultBudget
  }, 'Settings updated successfully')
})

// Update user preferences
export const updatePreferences = asyncHandler(async (req, res, next) => {
  const allowedPreferences = [
    'currency', 'language', 'timezone', 'theme', 'dateFormat',
    'notifications', 'privacy'
  ]

  const updates = {}
  Object.keys(req.body).forEach(key => {
    if (allowedPreferences.includes(key)) {
      updates[`preferences.${key}`] = req.body[key]
    }
  })

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    {
      new: true,
      runValidators: true
    }
  ).select('preferences')

  sendSuccessResponse(res, 200, {
    preferences: user.preferences
  }, 'Preferences updated successfully')
})

// Export user data
export const exportUserData = asyncHandler(async (req, res, next) => {
  const { format } = req.params
  const supportedFormats = ['json', 'csv']

  if (!supportedFormats.includes(format)) {
    return next(new AppError('Unsupported export format', 400))
  }

  const user = await User.findById(req.user.id)
    .populate('groups.groupId')
    .select('-password')

  // TODO: Implement actual data export with expenses, transactions, etc.
  const exportData = {
    user: user.toObject(),
    exportedAt: new Date().toISOString(),
    format
  }

  apiLogger.logDataExport(req.user.id, format, 1)

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${Date.now()}.json"`)
    return res.json(exportData)
  }

  // CSV format would need additional processing
  sendSuccessResponse(res, 200, exportData, 'Data exported successfully')
})

// Get user analytics
export const getUserAnalytics = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('stats')

  // TODO: Calculate more detailed analytics
  const analytics = {
    stats: user.stats,
    overview: {
      totalExpenses: user.stats.totalExpenses || 0,
      totalSpent: user.stats.totalSpent || 0,
      groupsJoined: user.stats.groupsJoined || 0,
      avgExpenseAmount: user.stats.totalExpenses > 0 
        ? Math.round(user.stats.totalSpent / user.stats.totalExpenses)
        : 0,
      lastActivity: user.stats.lastActivity
    }
  }

  sendSuccessResponse(res, 200, analytics, 'Analytics retrieved successfully')
})

// Get user notifications
export const getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  const filter = {
    recipient: req.user.id
  }

  // Filter by read status
  if (req.query.read !== undefined) {
    filter['channels.inApp.read'] = req.query.read === 'true'
  }

  // Filter by category
  if (req.query.category) {
    filter.category = req.query.category
  }

  // Filter by type
  if (req.query.type) {
    filter.type = req.query.type
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name avatar')

  const total = await Notification.countDocuments(filter)

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    'channels.inApp.read': false
  })

  sendPaginatedResponse(res, {
    notifications,
    unreadCount
  }, {
    page,
    limit,
    total
  }, 'Notifications retrieved successfully')
})

// Mark notification as read
export const markNotificationAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user.id
  })

  if (!notification) {
    return next(new AppError('Notification not found', 404))
  }

  await notification.markAsRead()

  sendSuccessResponse(res, 200, null, 'Notification marked as read')
})

// Delete notification
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user.id
  })

  if (!notification) {
    return next(new AppError('Notification not found', 404))
  }

  sendSuccessResponse(res, 200, null, 'Notification deleted successfully')
})

// Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(async (req, res, next) => {
  await Notification.markAllAsRead(req.user.id)

  sendSuccessResponse(res, 200, null, 'All notifications marked as read')
})

// Get notification counts
export const getNotificationCounts = asyncHandler(async (req, res, next) => {
  const counts = {
    total: await Notification.countDocuments({ recipient: req.user.id }),
    unread: await Notification.getUnreadCount(req.user.id),
    byCategory: {}
  }

  // Get counts by category
  const categoryCounts = await Notification.aggregate([
    { $match: { recipient: req.user.id } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        unread: {
          $sum: {
            $cond: [{ $eq: ['$channels.inApp.read', false] }, 1, 0]
          }
        }
      }
    }
  ])

  categoryCounts.forEach(cat => {
    counts.byCategory[cat._id] = {
      total: cat.total,
      unread: cat.unread
    }
  })

  sendSuccessResponse(res, 200, counts, 'Notification counts retrieved successfully')
})

// Update device information
export const updateDeviceInfo = asyncHandler(async (req, res, next) => {
  const { deviceId, deviceName, platform, pushToken } = req.body

  if (!deviceId) {
    return next(new AppError('Device ID is required', 400))
  }

  const user = await User.findById(req.user.id)

  // Find existing device or create new one
  let device = user.devices.find(d => d.deviceId === deviceId)

  if (device) {
    // Update existing device
    device.deviceName = deviceName || device.deviceName
    device.platform = platform || device.platform
    device.pushToken = pushToken || device.pushToken
    device.lastUsed = Date.now()
  } else {
    // Add new device
    user.devices.push({
      deviceId,
      deviceName,
      platform,
      pushToken,
      lastUsed: Date.now()
    })
  }

  await user.save({ validateBeforeSave: false })

  sendSuccessResponse(res, 200, null, 'Device information updated successfully')
})

// Get user devices
export const getUserDevices = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('devices')

  sendSuccessResponse(res, 200, {
    devices: user.devices || []
  }, 'Devices retrieved successfully')
})

// Remove device
export const removeDevice = asyncHandler(async (req, res, next) => {
  const { deviceId } = req.params

  const user = await User.findById(req.user.id)
  user.devices = user.devices.filter(d => d.deviceId !== deviceId)

  await user.save({ validateBeforeSave: false })

  sendSuccessResponse(res, 200, null, 'Device removed successfully')
})

// Change user email
export const changeEmail = asyncHandler(async (req, res, next) => {
  const { newEmail, password } = req.body

  const user = await User.findById(req.user.id).select('+password')

  // Verify current password
  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Current password is incorrect', 401))
  }

  // Check if new email is already taken
  const existingUser = await User.findOne({ email: newEmail })
  if (existingUser) {
    return next(new AppError('Email is already in use', 400))
  }

  // Update email and reset verification
  user.email = newEmail
  user.isEmailVerified = false

  // Generate new verification token
  const verifyToken = user.createEmailVerificationToken()
  await user.save({ validateBeforeSave: false })

  logger.info(`Email changed for user: ${req.user.email} -> ${newEmail}`)

  // TODO: Send verification email to new address

  sendSuccessResponse(res, 200, {
    email: newEmail,
    verificationRequired: true
  }, 'Email changed successfully. Please verify your new email address.')
})

// Get user by ID (for admin or public profiles)
export const getUserById = asyncHandler(async (req, res, next) => {
  const { userId } = req.params
  
  const user = await User.findById(userId)
    .select('name username avatar bio occupation preferences.privacy')

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // Check privacy settings
  const privacy = user.preferences?.privacy || {}
  
  if (privacy.profileVisibility === 'private') {
    return next(new AppError('This profile is private', 403))
  }

  // Filter data based on privacy settings
  const publicData = {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bio: privacy.showProfile !== false ? user.bio : undefined,
    occupation: privacy.showProfile !== false ? user.occupation : undefined
  }

  sendSuccessResponse(res, 200, { user: publicData }, 'User profile retrieved successfully')
})