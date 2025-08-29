import express from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
} from '../controllers/notificationController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Routes
router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.patch('/:id/read', markAsRead)
router.patch('/read-all', markAllAsRead)
router.delete('/:id', deleteNotification)

export default router