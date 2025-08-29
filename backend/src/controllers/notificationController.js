import { Notification } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse, sendPaginatedResponse } from '../middleware/errorMiddleware.js'
import { logger } from '../utils/logger.js'

// Get user notifications
export const getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  const filter = {
    recipient: req.user.id
  }

  // Filter by category
  if (req.query.category) {
    filter.category = req.query.category
  }

  // Filter by read status
  if (req.query.read !== undefined) {
    filter['channels.inApp.read'] = req.query.read === 'true'
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name avatar')

  const total = await Notification.countDocuments(filter)

  sendPaginatedResponse(res, {
    notifications
  }, {
    page,
    limit,
    total
  }, 'Notifications retrieved successfully')
})

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  const notification = await Notification.findOne({
    _id: id,
    recipient: req.user.id
  })

  if (!notification) {
    return next(new AppError('Notification not found', 404))
  }

  await notification.markAsRead()

  sendSuccessResponse(res, 200, { notification }, 'Notification marked as read')
})

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.markAllAsRead(req.user.id)

  sendSuccessResponse(res, 200, null, 'All notifications marked as read')
})

// Delete notification
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  const notification = await Notification.findOne({
    _id: id,
    recipient: req.user.id
  })

  if (!notification) {
    return next(new AppError('Notification not found', 404))
  }

  await notification.deleteOne()

  sendSuccessResponse(res, 200, null, 'Notification deleted successfully')
})

// Get unread count
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  const count = await Notification.getUnreadCount(req.user.id)

  sendSuccessResponse(res, 200, { count }, 'Unread count retrieved successfully')
})