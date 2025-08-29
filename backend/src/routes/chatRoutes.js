import express from 'express'
import { body } from 'express-validator'
import {
  getGroupChat,
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  pinMessage,
  unpinMessage,
  getPinnedMessages,
  searchMessages,
  muteChat,
  getChatParticipants,
  markAsRead,
  getUserChats
} from '../controllers/chatController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'
import { uploadImages } from '../middleware/uploadMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Validation rules
const sendMessageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content is required and must not exceed 2000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'expense', 'settlement', 'system', 'emoji'])
    .withMessage('Invalid message type')
]

const editMessageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content is required and must not exceed 2000 characters')
]

const reactionValidation = [
  body('emoji')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Emoji is required')
]

const muteValidation = [
  body('muted')
    .isBoolean()
    .withMessage('Muted status must be boolean'),
  body('muteUntil')
    .optional()
    .isISO8601()
    .withMessage('Invalid mute until date')
]

// Routes
router.get('/user-chats', getUserChats)
router.get('/groups/:groupId', getGroupChat)
router.get('/:chatId/messages', getChatMessages)
router.post('/:chatId/messages', uploadImages, sendMessageValidation, validate, sendMessage)
router.patch('/:chatId/messages/:messageId', editMessageValidation, validate, editMessage)
router.delete('/:chatId/messages/:messageId', deleteMessage)
router.post('/:chatId/messages/:messageId/react', reactionValidation, validate, addReaction)
router.post('/:chatId/messages/:messageId/pin', pinMessage)
router.delete('/:chatId/messages/:messageId/pin', unpinMessage)
router.get('/:chatId/pinned', getPinnedMessages)
router.get('/:chatId/search', searchMessages)
router.patch('/:chatId/mute', muteValidation, validate, muteChat)
router.get('/:chatId/participants', getChatParticipants)
router.post('/:chatId/read', markAsRead)

export default router