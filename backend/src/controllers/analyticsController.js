import { Expense, Group, User, Transaction } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse } from '../middleware/errorMiddleware.js'
import { logger } from '../utils/logger.js'
import mongoose from 'mongoose'

// Get dashboard analytics
export const getDashboardAnalytics = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query
  const now = new Date()
  let startDate, endDate = now

  // Calculate date range - handle both string periods and numeric days
  if (typeof period === 'string' && /^\d+d$/.test(period)) {
    // Handle numeric period like "30d"
    const days = parseInt(period.replace('d', ''))
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  } else {
    // Handle standard periods
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
      case 'all':
        startDate = new Date(2020, 0, 1) // Arbitrary old date
        break
      default:
        // If period is a number, treat as days
        if (!isNaN(period)) {
          const days = parseInt(period)
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }
    }
  }

  const userId = req.user.id

  // Get overview statistics
  const overviewStats = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
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

  // Get category breakdown
  const categoryBreakdown = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        percentage: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ])

  // Calculate percentages for categories
  const totalSpent = overviewStats[0]?.totalAmount || 0
  categoryBreakdown.forEach(cat => {
    cat.percentage = totalSpent > 0 ? (cat.totalAmount / totalSpent) * 100 : 0
  })

  // Get spending trends (daily/weekly/monthly based on period)
  const groupBy = period === 'week' || period === 'month' ? 
    { $dayOfMonth: '$date' } : 
    period === 'quarter' ? 
    { $week: '$date' } : 
    { $month: '$date' }

  const spendingTrends = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: groupBy,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // Get recent expenses
  const recentExpenses = await Expense.find({
    user: userId,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['approved', 'settled'] }
  })
    .sort({ date: -1 })
    .limit(10)
    .populate('group', 'name avatar')

  // Compare with previous period
  const prevStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()))
  const prevEndDate = startDate

  const previousPeriodStats = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: prevStartDate, $lte: prevEndDate },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalExpenses: { $sum: 1 }
      }
    }
  ])

  const currentTotal = overviewStats[0]?.totalAmount || 0
  const previousTotal = previousPeriodStats[0]?.totalAmount || 0
  const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

  sendSuccessResponse(res, 200, {
    period,
    overview: overviewStats[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      avgAmount: 0,
      maxAmount: 0,
      minAmount: 0
    },
    categoryBreakdown,
    spendingTrends,
    recentExpenses,
    comparison: {
      currentPeriod: currentTotal,
      previousPeriod: previousTotal,
      change: Math.round(change * 100) / 100,
      changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no_change'
    }
  }, 'Dashboard analytics retrieved successfully')
})

// Get spending patterns
export const getSpendingPatterns = asyncHandler(async (req, res, next) => {
  const userId = req.user.id
  const { startDate, endDate } = req.query

  const dateFilter = {}
  if (startDate) dateFilter.$gte = new Date(startDate)
  if (endDate) dateFilter.$lte = new Date(endDate)

  const matchStage = {
    user: new mongoose.Types.ObjectId(userId),
    status: { $in: ['approved', 'settled'] }
  }

  if (Object.keys(dateFilter).length > 0) {
    matchStage.date = dateFilter
  }

  // Spending by day of week
  const spendingByDayOfWeek = await Expense.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dayOfWeek: '$date' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // Spending by hour of day
  const spendingByHour = await Expense.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $hour: '$date' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // Spending by payment method
  const spendingByPaymentMethod = await Expense.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ])

  // Monthly spending trend
  const monthlyTrend = await Expense.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        categories: { $addToSet: '$category' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  // Top spending locations
  const topLocations = await Expense.aggregate([
    {
      $match: {
        ...matchStage,
        'location.name': { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$location.name',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 }
  ])

  sendSuccessResponse(res, 200, {
    spendingByDayOfWeek,
    spendingByHour,
    spendingByPaymentMethod,
    monthlyTrend,
    topLocations
  }, 'Spending patterns retrieved successfully')
})

// Get budget analysis
export const getBudgetAnalysis = asyncHandler(async (req, res, next) => {
  const userId = req.user.id
  const { period = 'month' } = req.query
  const now = new Date()

  let startDate
  
  // Calculate date range - handle both string periods and numeric days
  if (typeof period === 'string' && /^\d+d$/.test(period)) {
    // Handle numeric period like "30d"
    const days = parseInt(period.replace('d', ''))
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  } else {
    // Handle standard periods
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
      case 'all':
        startDate = new Date(2020, 0, 1) // Arbitrary old date
        break
      default:
        // If period is a number, treat as days
        if (!isNaN(period)) {
          const days = parseInt(period)
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }
    }
  }

  const user = await User.findById(userId).select('defaultBudget preferences')
  const budget = user.defaultBudget || {}

  // Get actual spending for the period
  const actualSpending = await Expense.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: now },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  // Calculate budget vs actual for each category
  const budgetAnalysis = actualSpending.map(spending => {
    const categoryBudget = budget.categories?.find(cat => cat.name === spending._id)
    const budgetAmount = categoryBudget ? categoryBudget.limit : 0
    const spent = spending.totalAmount
    const remaining = budgetAmount - spent
    const utilizationPercent = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

    return {
      category: spending._id,
      budgetAmount,
      actualSpent: spent,
      remaining,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      expenseCount: spending.count,
      status: utilizationPercent > 100 ? 'exceeded' : 
               utilizationPercent > 80 ? 'warning' : 'good'
    }
  })

  // Overall budget summary
  const totalBudget = budget.monthly || 0
  const totalSpent = actualSpending.reduce((sum, cat) => sum + cat.totalAmount, 0)
  const totalRemaining = totalBudget - totalSpent
  const overallUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Budget recommendations
  const recommendations = []
  
  budgetAnalysis.forEach(analysis => {
    if (analysis.status === 'exceeded') {
      recommendations.push({
        type: 'budget_exceeded',
        category: analysis.category,
        message: `You've exceeded your ${analysis.category} budget by ${Math.abs(analysis.remaining).toFixed(2)}`
      })
    } else if (analysis.status === 'warning') {
      recommendations.push({
        type: 'budget_warning',
        category: analysis.category,
        message: `You've used ${analysis.utilizationPercent.toFixed(1)}% of your ${analysis.category} budget`
      })
    }
  })

  sendSuccessResponse(res, 200, {
    period,
    overall: {
      totalBudget,
      totalSpent,
      totalRemaining,
      utilizationPercent: Math.round(overallUtilization * 100) / 100,
      status: overallUtilization > 100 ? 'exceeded' : 
               overallUtilization > 80 ? 'warning' : 'good'
    },
    categoryAnalysis: budgetAnalysis,
    recommendations
  }, 'Budget analysis retrieved successfully')
})

// Get group analytics
export const getGroupAnalytics = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params
  const { period = 'month' } = req.query

  const group = await Group.findById(groupId)
  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  // Check if user is a member
  if (!group.isUserMember(req.user.id) && req.user.role !== 'admin') {
    return next(new AppError('You are not a member of this group', 403))
  }

  const now = new Date()
  let startDate

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

  // Group expense overview
  const groupOverview = await Expense.aggregate([
    {
      $match: {
        group: mongoose.Types.ObjectId(groupId),
        date: { $gte: startDate, $lte: now },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ])

  // Spending by member
  const spendingByMember = await Expense.aggregate([
    {
      $match: {
        group: mongoose.Types.ObjectId(groupId),
        date: { $gte: startDate, $lte: now },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: '$user',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: 1,
        totalAmount: 1,
        count: 1,
        avgAmount: 1,
        name: '$user.name',
        avatar: '$user.avatar'
      }
    },
    { $sort: { totalAmount: -1 } }
  ])

  // Category breakdown for group
  const categoryBreakdown = await Expense.aggregate([
    {
      $match: {
        group: mongoose.Types.ObjectId(groupId),
        date: { $gte: startDate, $lte: now },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ])

  // Settlement status
  const settlementStatus = {
    totalBalances: group.balances.length,
    settledBalances: group.balances.filter(b => Math.abs(b.balance) < 0.01).length,
    pendingAmount: group.balances.reduce((sum, b) => sum + Math.abs(b.balance), 0)
  }

  sendSuccessResponse(res, 200, {
    period,
    overview: groupOverview[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      avgAmount: 0
    },
    spendingByMember,
    categoryBreakdown,
    settlementStatus
  }, 'Group analytics retrieved successfully')
})

// Get financial reports
export const getFinancialReport = asyncHandler(async (req, res, next) => {
  const userId = req.user.id
  const { reportType = 'monthly', year, month } = req.query

  let startDate, endDate

  if (reportType === 'monthly') {
    const targetYear = year ? parseInt(year) : new Date().getFullYear()
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth()
    
    startDate = new Date(targetYear, targetMonth, 1)
    endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59)
  } else if (reportType === 'yearly') {
    const targetYear = year ? parseInt(year) : new Date().getFullYear()
    startDate = new Date(targetYear, 0, 1)
    endDate = new Date(targetYear, 11, 31, 23, 59, 59)
  }

  // Generate comprehensive report
  const [
    expenseSummary,
    categoryBreakdown,
    monthlyTrend,
    topExpenses,
    paymentMethodBreakdown
  ] = await Promise.all([
    // Expense summary
    Expense.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
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
    ]),

    // Category breakdown
    Expense.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['approved', 'settled'] }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]),

    // Monthly trend (for yearly reports)
    reportType === 'yearly' ? Expense.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['approved', 'settled'] }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]) : [],

    // Top expenses
    Expense.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['approved', 'settled'] }
    })
      .sort({ amount: -1 })
      .limit(10)
      .populate('group', 'name'),

    // Payment method breakdown
    Expense.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['approved', 'settled'] }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])
  ])

  const report = {
    reportType,
    period: {
      startDate,
      endDate,
      year: startDate.getFullYear(),
      month: reportType === 'monthly' ? startDate.getMonth() + 1 : null
    },
    summary: expenseSummary[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      avgAmount: 0,
      maxAmount: 0,
      minAmount: 0
    },
    categoryBreakdown,
    paymentMethodBreakdown,
    topExpenses,
    generatedAt: new Date()
  }

  if (reportType === 'yearly') {
    report.monthlyTrend = monthlyTrend
  }

  sendSuccessResponse(res, 200, { report }, 'Financial report generated successfully')
})

// Get expense insights
export const getExpenseInsights = asyncHandler(async (req, res, next) => {
  const userId = req.user.id
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get insights about spending habits
  const insights = []

  // Compare this month vs last month
  const [thisMonthSpending, lastMonthSpending] = await Promise.all([
    Expense.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          date: { $gte: thisMonth },
          status: { $in: ['approved', 'settled'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]),
    Expense.aggregate([
      {
        $match: {
          user: mongoose.Types.ObjectId(userId),
          date: { $gte: lastMonth, $lt: thisMonth },
          status: { $in: ['approved', 'settled'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
  ])

  const thisMonthTotal = thisMonthSpending[0]?.total || 0
  const lastMonthTotal = lastMonthSpending[0]?.total || 0

  if (lastMonthTotal > 0) {
    const change = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    
    if (change > 20) {
      insights.push({
        type: 'spending_increase',
        title: 'Spending Increase Alert',
        message: `Your spending has increased by ${change.toFixed(1)}% compared to last month`,
        severity: 'warning'
      })
    } else if (change < -20) {
      insights.push({
        type: 'spending_decrease',
        title: 'Great Job!',
        message: `You've reduced your spending by ${Math.abs(change).toFixed(1)}% this month`,
        severity: 'success'
      })
    }
  }

  // Find most expensive category
  const topCategory = await Expense.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: thisMonth },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 1 }
  ])

  if (topCategory.length > 0) {
    const categoryTotal = topCategory[0].total
    const percentage = thisMonthTotal > 0 ? (categoryTotal / thisMonthTotal) * 100 : 0
    
    insights.push({
      type: 'top_category',
      title: 'Top Spending Category',
      message: `${topCategory[0]._id} accounts for ${percentage.toFixed(1)}% of your monthly spending`,
      severity: 'info'
    })
  }

  // Check for unusual spending patterns
  const avgDailySpending = await Expense.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        dailyTotal: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        avgDaily: { $avg: '$dailyTotal' }
      }
    }
  ])

  const averageDaily = avgDailySpending[0]?.avgDaily || 0

  // Check today's spending
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todaySpending = await Expense.aggregate([
    {
      $match: {
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: todayStart },
        status: { $in: ['approved', 'settled'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ])

  const todayTotal = todaySpending[0]?.total || 0

  if (todayTotal > averageDaily * 2) {
    insights.push({
      type: 'high_daily_spending',
      title: 'High Spending Day',
      message: `Today's spending is ${(todayTotal / averageDaily).toFixed(1)}x higher than your daily average`,
      severity: 'warning'
    })
  }

  sendSuccessResponse(res, 200, { insights }, 'Expense insights retrieved successfully')
})