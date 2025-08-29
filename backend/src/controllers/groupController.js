import { Group, User, Expense, Notification, Chat } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse, sendPaginatedResponse } from '../middleware/errorMiddleware.js'
import { logger, apiLogger } from '../utils/logger.js'
import crypto from 'crypto'

// Get all groups for user
export const getGroups = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  // Build filter
  const filter = {
    'members.user': req.user.id,
    'members.status': 'active',
    status: 'active'
  }

  // Filter by role
  if (req.query.role) {
    filter['members.role'] = req.query.role
  }

  // Search by name
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' }
  }

  const groups = await Group.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('creator', 'name avatar')
    .populate('members.user', 'name avatar')

  const total = await Group.countDocuments(filter)

  // Add user-specific data to each group
  const groupsWithUserData = groups.map(group => {
    const userMember = group.members.find(m => m.user._id.toString() === req.user.id.toString())
    return {
      ...group.toObject(),
      userRole: userMember?.role,
      userPermissions: userMember?.permissions,
      unreadCount: 0 // TODO: Calculate from chat
    }
  })

  sendPaginatedResponse(res, {
    groups: groupsWithUserData
  }, {
    page,
    limit,
    total
  }, 'Groups retrieved successfully')
})

// Get single group
export const getGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)
    .populate('creator', 'name email avatar')
    .populate('members.user', 'name email avatar')
    .populate('admins.user', 'name avatar')

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is a member
  if (!group.isUserMember(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('You are not a member of this group', 403))
  }

  // Get recent expenses for this group
  const recentExpenses = await Expense.find({
    group: group._id,
    status: { $in: ['approved', 'settled'] }
  })
    .sort({ date: -1 })
    .limit(5)
    .populate('user', 'name avatar')

  // Get user's balance in this group
  const userBalance = group.getUserBalance(req.user.id)

  // Add user-specific data
  const userMember = group.members.find(m => m.user._id.toString() === req.user.id.toString())
  const groupData = {
    ...group.toObject(),
    userRole: userMember?.role,
    userPermissions: userMember?.permissions,
    userBalance,
    recentExpenses
  }

  sendSuccessResponse(res, 200, { group: groupData }, 'Group retrieved successfully')
})

// Create new group
export const createGroup = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    isPrivate,
    defaultCurrency,
    maxMembers,
    categories
  } = req.body

  // Check if user has reached group creation limit
  const userGroupCount = await Group.countDocuments({
    creator: req.user.id,
    status: 'active'
  })

  const maxGroupsPerUser = 10 // Could be configurable
  if (userGroupCount >= maxGroupsPerUser) {
    return next(new AppError(`You can only create up to ${maxGroupsPerUser} groups`, 400))
  }

  // Create group
  const group = await Group.create({
    name,
    description,
    creator: req.user.id,
    settings: {
      isPrivate: isPrivate || false,
      defaultCurrency: defaultCurrency || req.user.preferences?.currency || 'INR',
      maxMembers: maxMembers || 50
    },
    categories: categories || [],
    financials: {
      currency: defaultCurrency || req.user.preferences?.currency || 'INR'
    }
  })

  // Create group chat
  await Chat.createGroupChat(group._id, req.user.id)

  // Update user stats
  await req.user.updateStats('group_join')

  // Populate the response
  await group.populate('creator', 'name email avatar')
  await group.populate('members.user', 'name avatar')

  apiLogger.logGroupCreated(req.user.id, group._id, 1)
  logger.info(`Group created: ${name} by user ${req.user.email}`)

  sendSuccessResponse(res, 201, { group }, 'Group created successfully')
})

// Update group
export const updateGroup = asyncHandler(async (req, res, next) => {
  let group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is admin
  if (!group.isUserAdmin(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('Only group admins can update group settings', 403))
  }

  // Fields that can be updated
  const allowedFields = [
    'name', 'description', 'avatar', 'coverImage', 'color',
    'settings', 'categories', 'totalBudget', 'notifications'
  ]

  const updates = {}
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key]
    }
  })

  group = await Group.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      runValidators: true
    }
  ).populate('creator', 'name avatar')
   .populate('members.user', 'name avatar')

  // Send notifications to members
  const memberIds = group.members
    .filter(m => m.status === 'active' && m.user._id.toString() !== req.user.id.toString())
    .map(m => m.user._id)

  for (const memberId of memberIds) {
    const notification = await Notification.createGroupNotification(
      'group_updated',
      memberId,
      group,
      req.user.id
    )
    
    // Emit real-time notification via Socket.IO
    const io = req.app.get('io')
    if (io) {
      io.to(`user-${memberId}`).emit('new-notification', {
        notification
      })
    }
  }

  logger.info(`Group updated: ${group.name} by user ${req.user.email}`)

  sendSuccessResponse(res, 200, { group }, 'Group updated successfully')
})

// Delete/Archive group
export const deleteGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Only creator can delete group
  if (group.creator.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new AppError('Only group creator can delete the group', 403))
  }

  // Check if there are unsettled expenses
  const unsettledExpenses = await Expense.countDocuments({
    group: group._id,
    isSettled: false,
    status: { $in: ['approved', 'pending'] }
  })

  if (unsettledExpenses > 0) {
    return next(new AppError('Cannot delete group with unsettled expenses', 400))
  }

  // Archive instead of delete
  group.status = 'archived'
  group.archivedAt = Date.now()
  group.archivedBy = req.user.id
  await group.save()

  logger.info(`Group archived: ${group.name} by user ${req.user.email}`)

  sendSuccessResponse(res, 200, null, 'Group archived successfully')
})

// Join group by code
export const joinGroup = asyncHandler(async (req, res, next) => {
  const { groupCode } = req.body

  if (!groupCode) {
    return next(new AppError('Group code is required', 400))
  }

  const group = await Group.findByCode(groupCode)

  if (!group) {
    return next(new AppError('Invalid group code', 404))
  }

  // Check if user is already a member
  if (group.isUserMember(req.user.id)) {
    return next(new AppError('You are already a member of this group', 400))
  }

  // Check if group requires approval
  if (group.settings.requireApproval) {
    // TODO: Create join request
    return next(new AppError('This group requires approval to join', 400))
  }

  // Check if group is at capacity
  if (group.memberCount >= group.settings.maxMembers) {
    return next(new AppError('Group is at maximum capacity', 400))
  }

  // Add user to group
  await group.addMember(req.user.id, null, 'member')

  // Add user to group chat
  const chat = await Chat.findByGroup(group._id)
  if (chat) {
    await chat.addParticipant(req.user.id)
  }

  // Update user stats
  await req.user.updateStats('group_join')

  // Send notification to admins
  const adminIds = group.members
    .filter(m => m.role === 'admin' && m.status === 'active')
    .map(m => m.user)

  for (const adminId of adminIds) {
    await Notification.createGroupNotification(
      'group_joined',
      adminId,
      group,
      req.user.id
    )
  }

  logger.info(`User ${req.user.email} joined group: ${group.name}`)

  sendSuccessResponse(res, 200, { group }, 'Successfully joined group')
})

// Leave group
export const leaveGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is a member
  if (!group.isUserMember(req.user.id)) {
    return next(new AppError('You are not a member of this group', 400))
  }

  // Check if user is the creator
  if (group.creator.toString() === req.user.id.toString()) {
    return next(new AppError('Group creator cannot leave. Please transfer ownership or delete the group.', 400))
  }

  // Check for unsettled balances
  const userBalance = group.getUserBalance(req.user.id)
  if (Math.abs(userBalance) > 0.01) {
    return next(new AppError('Cannot leave group with unsettled balance', 400))
  }

  // Remove user from group
  await group.removeMember(req.user.id)

  // Remove from group chat
  const chat = await Chat.findByGroup(group._id)
  if (chat) {
    await chat.removeParticipant(req.user.id)
  }

  logger.info(`User ${req.user.email} left group: ${group.name}`)

  sendSuccessResponse(res, 200, null, 'Successfully left group')
})

// Invite users to group
export const inviteToGroup = asyncHandler(async (req, res, next) => {
  const { emails, phones, message } = req.body
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check permissions
  const userPermissions = group.getUserPermissions(req.user.id)
  if (!userPermissions?.canInviteMembers && !group.isUserAdmin(req.user.id)) {
    return next(new AppError('You do not have permission to invite members', 403))
  }

  const invitations = []

  // Process email invitations
  if (emails && emails.length > 0) {
    for (const email of emails) {
      const { invitation, token } = group.createInvitation(email, null, req.user.id)
      invitations.push({ ...invitation.toObject(), token })
    }
  }

  // Process phone invitations
  if (phones && phones.length > 0) {
    for (const phone of phones) {
      const { invitation, token } = group.createInvitation(null, phone, req.user.id)
      invitations.push({ ...invitation.toObject(), token })
    }
  }

  await group.save()

  // TODO: Send actual invitation emails/SMS
  logger.info(`Invitations sent for group ${group.name} by ${req.user.email}`)

  sendSuccessResponse(res, 200, { 
    invitations: invitations.map(inv => ({
      email: inv.email,
      phone: inv.phone,
      token: process.env.NODE_ENV === 'development' ? inv.token : undefined,
      expiresAt: inv.expiresAt
    }))
  }, 'Invitations sent successfully')
})

// Accept group invitation
export const acceptInvitation = asyncHandler(async (req, res, next) => {
  const { token } = req.params
  
  const group = await Group.findOne({
    'invitations.token': token,
    'invitations.status': 'pending',
    'invitations.expiresAt': { $gt: Date.now() }
  })

  if (!group) {
    return next(new AppError('Invalid or expired invitation', 400))
  }

  // Check if user is already a member
  if (group.isUserMember(req.user.id)) {
    return next(new AppError('You are already a member of this group', 400))
  }

  // Add user to group
  await group.addMember(req.user.id, null, 'member')

  // Update invitation status
  const invitation = group.invitations.find(inv => inv.token === token)
  invitation.status = 'accepted'

  await group.save()

  // Add to group chat
  const chat = await Chat.findByGroup(group._id)
  if (chat) {
    await chat.addParticipant(req.user.id)
  }

  logger.info(`User ${req.user.email} accepted invitation to group: ${group.name}`)

  sendSuccessResponse(res, 200, { group }, 'Invitation accepted successfully')
})

// Manage group members
export const updateMemberRole = asyncHandler(async (req, res, next) => {
  const { memberId } = req.params
  const { role } = req.body

  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is admin
  if (!group.isUserAdmin(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('Only group admins can update member roles', 403))
  }

  // Update member role
  await group.updateMemberRole(memberId, role, req.user.id)

  logger.info(`Member role updated in group ${group.name}: ${memberId} -> ${role}`)

  sendSuccessResponse(res, 200, null, 'Member role updated successfully')
})

// Remove member from group
export const removeMember = asyncHandler(async (req, res, next) => {
  const { memberId } = req.params
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is admin
  if (!group.isUserAdmin(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('Only group admins can remove members', 403))
  }

  // Cannot remove creator
  if (group.creator.toString() === memberId) {
    return next(new AppError('Cannot remove group creator', 400))
  }

  // Check for unsettled balances
  const memberBalance = group.getUserBalance(memberId)
  if (Math.abs(memberBalance) > 0.01) {
    return next(new AppError('Cannot remove member with unsettled balance', 400))
  }

  // Remove member
  await group.removeMember(memberId)

  // Remove from group chat
  const chat = await Chat.findByGroup(group._id)
  if (chat) {
    await chat.removeParticipant(memberId)
  }

  logger.info(`Member removed from group ${group.name}: ${memberId}`)

  sendSuccessResponse(res, 200, null, 'Member removed successfully')
})

// Get group expenses
export const getGroupExpenses = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is a member
  if (!group.isUserMember(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('You are not a member of this group', 403))
  }

  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  const filter = {
    group: group._id,
    isGroupExpense: true
  }

  // Apply filters from query
  if (req.query.status) {
    filter.status = req.query.status
  }

  if (req.query.category) {
    filter.category = req.query.category
  }

  if (req.query.startDate || req.query.endDate) {
    filter.date = {}
    if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate)
    if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate)
  }

  const expenses = await Expense.find(filter)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name avatar')
    .populate('splitDetails.user', 'name avatar')

  const total = await Expense.countDocuments(filter)

  sendPaginatedResponse(res, {
    expenses
  }, {
    page,
    limit,
    total
  }, 'Group expenses retrieved successfully')
})

// Get group balances
export const getGroupBalances = asyncHandler(async (req, res, next) => {
  const group = await Group.findById(req.params.id)
    .populate('balances.user', 'name avatar')

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is a member
  if (!group.isUserMember(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('You are not a member of this group', 403))
  }

  // Calculate settlement suggestions
  const balances = group.balances.filter(b => Math.abs(b.balance) > 0.01)
  const settlements = []

  // Simple settlement algorithm - creditors and debtors
  const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance)
  const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance)

  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance))

    if (amount > 0.01) {
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: Math.round(amount * 100) / 100
      })
    }

    creditor.balance -= amount
    debtor.balance += amount

    if (creditor.balance < 0.01) i++
    if (Math.abs(debtor.balance) < 0.01) j++
  }

  sendSuccessResponse(res, 200, {
    balances: group.balances,
    settlements
  }, 'Group balances retrieved successfully')
})

// Settle group balances
export const settleBalance = asyncHandler(async (req, res, next) => {
  const { fromUserId, toUserId, amount, description } = req.body
  const group = await Group.findById(req.params.id)

  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is involved in the settlement
  if (req.user.id !== fromUserId && req.user.id !== toUserId && !group.isUserAdmin(req.user.id)) {
    return next(new AppError('You can only settle your own balances', 403))
  }

  // Create settlement record
  group.settlements.push({
    from: fromUserId,
    to: toUserId,
    amount,
    description,
    status: 'completed',
    settledAt: Date.now()
  })

  // Update balances
  await group.updateUserBalance(fromUserId, amount)
  await group.updateUserBalance(toUserId, -amount)

  await group.save()

  logger.info(`Balance settled in group ${group.name}: ${amount} from ${fromUserId} to ${toUserId}`)

  sendSuccessResponse(res, 200, null, 'Balance settled successfully')
})