import { Expense, Group, User, Notification } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse, sendPaginatedResponse } from '../middleware/errorMiddleware.js'
import { logger, apiLogger } from '../utils/logger.js'
import mongoose from 'mongoose'

// Get all expenses for user
export const getExpenses = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit

  // Build filter
  const filter = { user: req.user.id }

  // Filter by category
  if (req.query.category) {
    filter.category = req.query.category
  }

  // Filter by group
  if (req.query.group) {
    filter.group = req.query.group
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    filter.date = {}
    if (req.query.startDate) {
      filter.date.$gte = new Date(req.query.startDate)
    }
    if (req.query.endDate) {
      filter.date.$lte = new Date(req.query.endDate)
    }
  }

  // Filter by amount range
  if (req.query.minAmount || req.query.maxAmount) {
    filter.amount = {}
    if (req.query.minAmount) {
      filter.amount.$gte = parseFloat(req.query.minAmount)
    }
    if (req.query.maxAmount) {
      filter.amount.$lte = parseFloat(req.query.maxAmount)
    }
  }

  // Filter by status
  if (req.query.status) {
    filter.status = req.query.status
  }

  // Search by title or description
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ]
  }

  // Sort options
  let sortBy = { date: -1 } // Default sort by date descending
  if (req.query.sort) {
    const sortField = req.query.sort.replace('-', '')
    const sortOrder = req.query.sort.startsWith('-') ? -1 : 1
    sortBy = { [sortField]: sortOrder }
  }

  const expenses = await Expense.find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .populate('group', 'name avatar')
    .populate('splitDetails.user', 'name avatar')

  const total = await Expense.countDocuments(filter)

  // Calculate summary statistics
  const summary = await Expense.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  sendPaginatedResponse(res, {
    expenses,
    summary: summary[0] || { totalAmount: 0, avgAmount: 0, count: 0 }
  }, {
    page,
    limit,
    total
  }, 'Expenses retrieved successfully')
})

// Get single expense
export const getExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id)
    .populate('user', 'name email avatar')
    .populate('group', 'name avatar members')
    .populate('splitDetails.user', 'name email avatar')
    .populate('comments.user', 'name avatar')

  if (!expense) {
    return next(new AppError('Expense not found', 404))
  }

  // Check if user has access to this expense
  if (!expense.isUserInvolved(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('You do not have access to this expense', 403))
  }

  sendSuccessResponse(res, 200, { expense }, 'Expense retrieved successfully')
})

// Create new expense
export const createExpense = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    amount,
    currency,
    category,
    subcategory,
    date,
    paymentMethod,
    location,
    group,
    splitType,
    splitDetails,
    isRecurring,
    recurringPattern,
    tags
  } = req.body

  // Validate group membership if group expense
  let groupData = null
  if (group) {
    groupData = await Group.findById(group)
    if (!groupData) {
      return next(new AppError('Group not found', 404))
    }

    if (!groupData.isUserMember(req.user.id)) {
      return next(new AppError('You are not a member of this group', 403))
    }
  }

  // Create expense data
  const expenseData = {
    title,
    description,
    amount,
    currency: currency || req.user.preferences?.currency || 'INR',
    category,
    subcategory,
    date: date || Date.now(),
    paymentMethod: paymentMethod || 'cash',
    location,
    user: req.user.id,
    tags: tags || []
  }

  // Handle group expenses
  if (group) {
    expenseData.group = group
    expenseData.isGroupExpense = true
    expenseData.splitType = splitType || 'equal'

    // Calculate split details
    if (splitDetails && splitDetails.length > 0) {
      expenseData.splitDetails = splitDetails
    } else if (splitType === 'equal') {
      // Equal split among all group members
      const activeMembers = groupData.members.filter(m => m.status === 'active')
      const splitAmount = amount / activeMembers.length

      expenseData.splitDetails = activeMembers.map(member => ({
        user: member.user,
        amount: splitAmount,
        paid: member.user.toString() === req.user.id.toString()
      }))
    }
  }

  // Handle recurring expenses
  if (isRecurring && recurringPattern) {
    expenseData.isRecurring = true
    expenseData.recurringPattern = recurringPattern
  }

  // Create expense
  const expense = await Expense.create(expenseData)

  // Populate the created expense
  await expense.populate('user', 'name email avatar')
  if (group) {
    await expense.populate('group', 'name avatar')
    await expense.populate('splitDetails.user', 'name avatar')
  }

  // Update user stats
  await req.user.updateStats('expense', amount)

  // Update group financials if group expense
  if (groupData) {
    groupData.financials.totalExpenses += 1
    groupData.financials.totalAmount += amount
    groupData.activity.lastExpenseAt = Date.now()
    await groupData.save()

    // Create notifications for group members
    const memberIds = groupData.members
      .filter(m => m.status === 'active' && m.user.toString() !== req.user.id.toString())
      .map(m => m.user)

    for (const memberId of memberIds) {
      await Notification.createExpenseNotification(
        'expense_added',
        memberId,
        expense,
        req.user.id
      )
    }
  }

  apiLogger.logExpenseCreated(req.user.id, expense._id, amount)
  logger.info(`Expense created: ${expense.title} by user ${req.user.email}`)

  sendSuccessResponse(res, 201, { expense }, 'Expense created successfully')
})

// Update expense
export const updateExpense = asyncHandler(async (req, res, next) => {
  let expense = await Expense.findById(req.params.id)

  if (!expense) {
    return next(new AppError('Expense not found', 404))
  }

  // Check permissions
  if (expense.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only update your own expenses', 403))
  }

  // Fields that can be updated
  const allowedFields = [
    'title', 'description', 'amount', 'currency', 'category', 'subcategory',
    'date', 'paymentMethod', 'location', 'splitType', 'splitDetails', 'tags'
  ]

  const updates = {}
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key]
    }
  })

  // Handle split updates for group expenses
  if (expense.isGroupExpense && updates.splitDetails) {
    const group = await Group.findById(expense.group)
    if (group && !group.isUserAdmin(req.user.id)) {
      return next(new AppError('Only group admins can update split details', 403))
    }
  }

  expense = await Expense.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'name email avatar')
   .populate('group', 'name avatar')
   .populate('splitDetails.user', 'name avatar')

  // Send notifications for group expenses
  if (expense.isGroupExpense) {
    const group = await Group.findById(expense.group)
    const memberIds = group.members
      .filter(m => m.status === 'active' && m.user.toString() !== req.user.id.toString())
      .map(m => m.user)

    for (const memberId of memberIds) {
      const notification = await Notification.createExpenseNotification(
        'expense_updated',
        memberId,
        expense,
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
  }

  logger.info(`Expense updated: ${expense.title} by user ${req.user.email}`)

  sendSuccessResponse(res, 200, { expense }, 'Expense updated successfully')
})

// Delete expense
export const deleteExpense = asyncHandler(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    return next(new AppError('Expense not found', 404))
  }

  // Check permissions
  if (expense.user.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You can only delete your own expenses', 403))
  }

  // Check if expense is settled (for group expenses)
  if (expense.isGroupExpense && expense.isSettled) {
    return next(new AppError('Cannot delete settled expenses', 400))
  }

  await expense.deleteOne()

  // Update group financials if group expense
  if (expense.isGroupExpense) {
    const group = await Group.findById(expense.group)
    if (group) {
      group.financials.totalExpenses = Math.max(0, group.financials.totalExpenses - 1)
      group.financials.totalAmount = Math.max(0, group.financials.totalAmount - expense.amount)
      await group.save()

      // Send notifications
      const memberIds = group.members
        .filter(m => m.status === 'active' && m.user.toString() !== req.user.id.toString())
        .map(m => m.user)

      for (const memberId of memberIds) {
        await Notification.createExpenseNotification(
          'expense_deleted',
          memberId,
          expense,
          req.user.id
        )
      }
    }
  }

  logger.info(`Expense deleted: ${expense.title} by user ${req.user.email}`)

  sendSuccessResponse(res, 200, null, 'Expense deleted successfully')
})

// Get expense categories with statistics
export const getExpenseCategories = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query

  const matchStage = {
    user: req.user.id,
    status: { $in: ['approved', 'settled'] }
  }

  if (startDate || endDate) {
    matchStage.date = {}
    if (startDate) matchStage.date.$gte = new Date(startDate)
    if (endDate) matchStage.date.$lte = new Date(endDate)
  }

  const categories = await Expense.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        lastExpense: { $max: '$date' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ])

  sendSuccessResponse(res, 200, { categories }, 'Categories retrieved successfully')
})

// Get expense statistics
export const getExpenseStats = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query
  const now = new Date()
  let startDate

  // Calculate start date based on period
  switch (period) {
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const stats = await Expense.aggregate([
    {
      $match: {
        user: req.user.id,
        date: { $gte: startDate },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' },
        maxAmount: { $max: '$amount' },
        minAmount: { $min: '$amount' }
      }
    }
  ])

  const categoryBreakdown = await Expense.getCategoryBreakdown(
    req.user.id,
    startDate,
    now
  )

  sendSuccessResponse(res, 200, {
    period,
    stats: stats[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      avgAmount: 0,
      maxAmount: 0,
      minAmount: 0
    },
    categoryBreakdown
  }, 'Expense statistics retrieved successfully')
})

// Add comment to expense
export const addExpenseComment = asyncHandler(async (req, res, next) => {
  const { message } = req.body
  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    return next(new AppError('Expense not found', 404))
  }

  // Check if user has access to this expense
  if (!expense.isUserInvolved(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('You do not have access to this expense', 403))
  }

  await expense.addComment(req.user.id, message)
  await expense.populate('comments.user', 'name avatar')

  sendSuccessResponse(res, 201, {
    comment: expense.comments[expense.comments.length - 1]
  }, 'Comment added successfully')
})

// Update split payment status
export const updateSplitPayment = asyncHandler(async (req, res, next) => {
  const { paid } = req.body
  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    return next(new AppError('Expense not found', 404))
  }

  if (!expense.isGroupExpense) {
    return next(new AppError('This is not a group expense', 400))
  }

  // Check if user is part of the split
  const split = expense.splitDetails.find(s => s.user.toString() === req.user.id.toString())
  if (!split) {
    return next(new AppError('You are not part of this expense split', 403))
  }

  await expense.updateSplitPayment(req.user.id, paid)

  sendSuccessResponse(res, 200, null, 'Split payment status updated successfully')
})

// Get recurring expenses
export const getRecurringExpenses = asyncHandler(async (req, res, next) => {
  const expenses = await Expense.find({
    user: req.user.id,
    isRecurring: true,
    'recurringPattern.nextDue': { $exists: true }
  }).sort({ 'recurringPattern.nextDue': 1 })

  sendSuccessResponse(res, 200, { expenses }, 'Recurring expenses retrieved successfully')
})

// Generate next recurring expense
export const generateRecurringExpense = asyncHandler(async (req, res, next) => {
  const parentExpense = await Expense.findById(req.params.id)

  if (!parentExpense) {
    return next(new AppError('Expense not found', 404))
  }

  if (!parentExpense.isRecurring) {
    return next(new AppError('This is not a recurring expense', 400))
  }

  if (parentExpense.user.toString() !== req.user.id.toString()) {
    return next(new AppError('You can only generate recurring expenses for your own expenses', 403))
  }

  const nextExpense = parentExpense.generateNextRecurring()
  if (!nextExpense) {
    return next(new AppError('Cannot generate next recurring expense', 400))
  }

  const savedExpense = await nextExpense.save()
  await savedExpense.populate('user', 'name email avatar')

  sendSuccessResponse(res, 201, { expense: savedExpense }, 'Recurring expense generated successfully')
})

// Upload expense receipt
export const uploadReceipt = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please provide a receipt file', 400))
  }

  const expense = await Expense.findById(req.params.id)

  if (!expense) {
    return next(new AppError('Expense not found', 404))
  }

  if (expense.user.toString() !== req.user.id.toString()) {
    return next(new AppError('You can only upload receipts for your own expenses', 403))
  }

  // Add receipt to expense
  const receipt = {
    url: req.file.url,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: Date.now()
  }

  expense.receipts.push(receipt)
  await expense.save()

  sendSuccessResponse(res, 200, { receipt }, 'Receipt uploaded successfully')
})