import express from 'express'
import { body } from 'express-validator'
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  inviteToGroup,
  acceptInvitation,
  updateMemberRole,
  removeMember,
  getGroupExpenses,
  getGroupBalances,
  settleBalance
} from '../controllers/groupController.js'
import { protect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validationMiddleware.js'

const router = express.Router()

// Apply protection to all routes
router.use(protect)

// Validation rules
const createGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 100 })
    .withMessage('Maximum members must be between 2 and 100')
]

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Group name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
]

const joinGroupValidation = [
  body('groupCode')
    .isLength({ min: 6, max: 6 })
    .withMessage('Group code must be 6 characters')
]

const inviteValidation = [
  body('emails')
    .optional()
    .isArray()
    .withMessage('Emails must be an array'),
  body('emails.*')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('phones')
    .optional()
    .isArray()
    .withMessage('Phones must be an array')
]

const settlementValidation = [
  body('fromUserId')
    .isMongoId()
    .withMessage('Invalid from user ID'),
  body('toUserId')
    .isMongoId()
    .withMessage('Invalid to user ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
]

// Routes
router.get('/', getGroups)
router.post('/', createGroupValidation, validate, createGroup)
router.post('/join', joinGroupValidation, validate, joinGroup)
router.get('/invitations/:token/accept', acceptInvitation)
router.get('/:id', getGroup)
router.patch('/:id', updateGroupValidation, validate, updateGroup)
router.delete('/:id', deleteGroup)
router.post('/:id/leave', leaveGroup)
router.post('/:id/invite', inviteValidation, validate, inviteToGroup)
router.patch('/:id/members/:memberId/role', updateMemberRole)
router.delete('/:id/members/:memberId', removeMember)
router.get('/:id/expenses', getGroupExpenses)
router.get('/:id/balances', getGroupBalances)
router.post('/:id/settle', settlementValidation, validate, settleBalance)

export default router