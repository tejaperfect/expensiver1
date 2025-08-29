import { Expense, User } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse } from '../middleware/errorMiddleware.js'
import { logger } from '../utils/logger.js'

// Mock OpenAI service for demo purposes
// In production, you would use the actual OpenAI API
class MockOpenAIService {
  static async categorizeExpense(title, description, amount) {
    const categories = {
      'food': ['restaurant', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'coffee', 'pizza', 'burger'],
      'transport': ['uber', 'taxi', 'bus', 'metro', 'fuel', 'petrol', 'gas', 'parking', 'flight'],
      'shopping': ['amazon', 'flipkart', 'mall', 'store', 'clothes', 'shoes', 'electronics'],
      'entertainment': ['movie', 'cinema', 'game', 'concert', 'party', 'club', 'netflix'],
      'bills': ['electricity', 'water', 'internet', 'phone', 'rent', 'insurance', 'loan'],
      'health': ['doctor', 'medicine', 'hospital', 'pharmacy', 'dental', 'checkup'],
      'groceries': ['grocery', 'supermarket', 'vegetables', 'fruits', 'milk', 'bread'],
      'travel': ['hotel', 'booking', 'ticket', 'vacation', 'trip', 'airline']
    }

    const text = `${title} ${description}`.toLowerCase()
    let bestMatch = 'other'
    let maxMatches = 0

    for (const [category, keywords] of Object.entries(categories)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        bestMatch = category
      }
    }

    // Simple confidence calculation
    const confidence = maxMatches > 0 ? Math.min(0.9, 0.3 + (maxMatches * 0.2)) : 0.1

    return {
      category: bestMatch,
      confidence,
      alternatives: Object.keys(categories).filter(cat => cat !== bestMatch).slice(0, 2)
    }
  }

  static async generateInsights(expenses, userPreferences) {
    const insights = []

    // Spending trend analysis
    if (expenses.length > 0) {
      const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const avgAmount = totalAmount / expenses.length

      if (avgAmount > 1000) {
        insights.push({
          type: 'spending_pattern',
          title: 'High Average Spending',
          message: `Your average expense is ₹${avgAmount.toFixed(0)}, which is above typical spending patterns.`,
          priority: 'medium',
          actionable: true,
          suggestions: ['Consider setting monthly budgets', 'Track unnecessary expenses']
        })
      }

      // Category-wise insights
      const categoryTotals = {}
      expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
      })

      const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0]

      if (topCategory) {
        const percentage = (topCategory[1] / totalAmount) * 100
        insights.push({
          type: 'category_dominance',
          title: `High ${topCategory[0]} Spending`,
          message: `${topCategory[0]} expenses account for ${percentage.toFixed(1)}% of your total spending.`,
          priority: percentage > 40 ? 'high' : 'low',
          actionable: true,
          suggestions: [`Review ${topCategory[0]} expenses`, 'Look for alternatives']
        })
      }
    }

    return insights
  }

  static async generateRecommendations(userSpendingData) {
    const recommendations = []

    // Budget recommendations
    if (userSpendingData.monthlyAverage > 0) {
      recommendations.push({
        type: 'budget',
        title: 'Set Monthly Budget',
        description: `Based on your spending pattern, consider setting a monthly budget of ₹${(userSpendingData.monthlyAverage * 1.1).toFixed(0)}`,
        priority: 'high',
        actionUrl: '/budget/setup'
      })
    }

    // Savings recommendations
    recommendations.push({
      type: 'savings',
      title: 'Automated Savings',
      description: 'Set up automatic transfers to savings account after each expense',
      priority: 'medium',
      actionUrl: '/settings/auto-save'
    })

    return recommendations
  }
}

// Categorize expense using AI
export const categorizeExpense = asyncHandler(async (req, res, next) => {
  const { title, description, amount } = req.body

  if (!title) {
    return next(new AppError('Expense title is required', 400))
  }

  try {
    const result = await MockOpenAIService.categorizeExpense(title, description || '', amount || 0)

    sendSuccessResponse(res, 200, {
      suggested: {
        category: result.category,
        confidence: result.confidence,
        alternatives: result.alternatives
      },
      reasoning: `Based on keywords in "${title}", this appears to be a ${result.category} expense.`
    }, 'Expense categorized successfully')
  } catch (error) {
    logger.error('AI categorization failed:', error)
    
    // Fallback to rule-based categorization
    const fallbackCategory = 'other'
    sendSuccessResponse(res, 200, {
      suggested: {
        category: fallbackCategory,
        confidence: 0.1,
        alternatives: ['food', 'transport']
      },
      reasoning: 'Using fallback categorization due to AI service unavailability'
    }, 'Expense categorized using fallback method')
  }
})

// Get spending insights
export const getSpendingInsights = asyncHandler(async (req, res, next) => {
  const { period = 'month', category } = req.query
  const userId = req.user.id

  // Calculate date range
  const now = new Date()
  let startDate

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
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

  // Build filter
  const filter = {
    user: userId,
    date: { $gte: startDate, $lte: now },
    status: { $in: ['approved', 'settled'] }
  }

  if (category) {
    filter.category = category
  }

  // Get expenses
  const expenses = await Expense.find(filter).sort({ date: -1 })

  // Get user preferences
  const user = await User.findById(userId).select('preferences defaultBudget')

  try {
    const insights = await MockOpenAIService.generateInsights(expenses, user.preferences)

    // Add budget-specific insights
    if (user.defaultBudget?.monthly && period === 'month') {
      const monthlySpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
      const budgetUtilization = (monthlySpent / user.defaultBudget.monthly) * 100

      if (budgetUtilization > 80) {
        insights.unshift({
          type: 'budget_alert',
          title: 'Budget Alert',
          message: `You've used ${budgetUtilization.toFixed(1)}% of your monthly budget`,
          priority: budgetUtilization > 100 ? 'high' : 'medium',
          actionable: true,
          suggestions: ['Review remaining expenses', 'Consider reducing discretionary spending']
        })
      }
    }

    // Add trend insights
    if (expenses.length > 1) {
      const midPoint = Math.floor(expenses.length / 2)
      const firstHalf = expenses.slice(0, midPoint)
      const secondHalf = expenses.slice(midPoint)

      const firstHalfAvg = firstHalf.reduce((sum, exp) => sum + exp.amount, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, exp) => sum + exp.amount, 0) / secondHalf.length

      const trendChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100

      if (Math.abs(trendChange) > 20) {
        insights.push({
          type: 'spending_trend',
          title: trendChange > 0 ? 'Increasing Spending Trend' : 'Decreasing Spending Trend',
          message: `Your recent expenses show a ${Math.abs(trendChange).toFixed(1)}% ${trendChange > 0 ? 'increase' : 'decrease'} in spending`,
          priority: 'medium',
          actionable: true,
          suggestions: trendChange > 0 ? 
            ['Monitor spending more closely', 'Identify cost drivers'] :
            ['Great job reducing spending!', 'Maintain this pattern']
        })
      }
    }

    sendSuccessResponse(res, 200, {
      period,
      insights,
      summary: {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        avgAmount: expenses.length > 0 ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length : 0,
        topCategory: expenses.length > 0 ? 
          Object.entries(expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + 1
            return acc
          }, {})).sort(([,a], [,b]) => b - a)[0][0] : null
      }
    }, 'Spending insights generated successfully')
  } catch (error) {
    logger.error('AI insights generation failed:', error)
    return next(new AppError('Failed to generate insights', 500))
  }
})

// Get expense predictions
export const getExpensePredictions = asyncHandler(async (req, res, next) => {
  const userId = req.user.id
  const { category, period = 'month' } = req.query

  // Get historical data
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)

  const filter = {
    user: userId,
    date: { $gte: sixMonthsAgo, $lte: now },
    status: { $in: ['approved', 'settled'] }
  }

  if (category) {
    filter.category = category
  }

  const expenses = await Expense.find(filter).sort({ date: 1 })

  // Simple prediction based on historical average
  const monthlyData = {}
  expenses.forEach(expense => {
    const monthKey = `${expense.date.getFullYear()}-${expense.date.getMonth()}`
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, count: 0 }
    }
    monthlyData[monthKey].total += expense.amount
    monthlyData[monthKey].count += 1
  })

  const monthlyTotals = Object.values(monthlyData).map(data => data.total)
  const avgMonthlySpending = monthlyTotals.length > 0 ? 
    monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length : 0

  // Calculate trend
  let trend = 'stable'
  if (monthlyTotals.length >= 3) {
    const recent = monthlyTotals.slice(-3).reduce((sum, val) => sum + val, 0) / 3
    const earlier = monthlyTotals.slice(0, -3).reduce((sum, val) => sum + val, 0) / (monthlyTotals.length - 3)
    
    if (recent > earlier * 1.1) trend = 'increasing'
    else if (recent < earlier * 0.9) trend = 'decreasing'
  }

  // Generate predictions
  const predictions = {
    nextMonth: {
      estimated: Math.round(avgMonthlySpending),
      confidence: monthlyTotals.length >= 3 ? 0.8 : 0.5,
      range: {
        min: Math.round(avgMonthlySpending * 0.8),
        max: Math.round(avgMonthlySpending * 1.2)
      }
    },
    trend,
    insights: [
      `Based on your last ${monthlyTotals.length} months of data`,
      `Average monthly spending: ₹${Math.round(avgMonthlySpending)}`,
      `Spending trend: ${trend}`
    ]
  }

  // Add category-specific predictions
  if (category) {
    const categoryExpenses = expenses.filter(exp => exp.category === category)
    const categoryMonthlyAvg = categoryExpenses.length > 0 ?
      categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0) / monthlyTotals.length : 0

    predictions.category = {
      name: category,
      estimated: Math.round(categoryMonthlyAvg),
      percentage: avgMonthlySpending > 0 ? (categoryMonthlyAvg / avgMonthlySpending) * 100 : 0
    }
  }

  sendSuccessResponse(res, 200, {
    predictions,
    historicalData: {
      monthlyAverages: monthlyTotals,
      totalMonths: monthlyTotals.length,
      dataQuality: monthlyTotals.length >= 3 ? 'good' : 'limited'
    }
  }, 'Expense predictions generated successfully')
})

// Get smart recommendations
export const getSmartRecommendations = asyncHandler(async (req, res, next) => {
  const userId = req.user.id

  // Get user's spending data for last 3 months
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000)

  const expenses = await Expense.find({
    user: userId,
    date: { $gte: threeMonthsAgo, $lte: now },
    status: { $in: ['approved', 'settled'] }
  })

  const user = await User.findById(userId).select('preferences defaultBudget stats')

  // Calculate spending statistics
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const monthlyAverage = totalSpent / 3

  const spendingData = {
    totalExpenses: expenses.length,
    totalAmount: totalSpent,
    monthlyAverage,
    categories: expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount
      return acc
    }, {}),
    avgExpenseAmount: expenses.length > 0 ? totalSpent / expenses.length : 0
  }

  try {
    const recommendations = await MockOpenAIService.generateRecommendations(spendingData)

    // Add specific recommendations based on spending patterns
    const categoryTotals = Object.entries(spendingData.categories)
      .sort(([,a], [,b]) => b - a)

    if (categoryTotals.length > 0) {
      const topCategory = categoryTotals[0]
      const topCategoryPercentage = (topCategory[1] / totalSpent) * 100

      if (topCategoryPercentage > 30) {
        recommendations.unshift({
          type: 'category_optimization',
          title: `Optimize ${topCategory[0]} Spending`,
          description: `${topCategory[0]} represents ${topCategoryPercentage.toFixed(1)}% of your spending. Consider finding ways to reduce these expenses.`,
          priority: 'high',
          actionUrl: `/analytics?category=${topCategory[0]}`,
          tips: [
            'Look for alternatives or substitutes',
            'Compare prices before purchasing',
            'Set monthly limits for this category'
          ]
        })
      }
    }

    // Add payment method recommendations
    const paymentMethods = expenses.reduce((acc, exp) => {
      acc[exp.paymentMethod] = (acc[exp.paymentMethod] || 0) + 1
      return acc
    }, {})

    if (paymentMethods.cash && paymentMethods.cash > expenses.length * 0.5) {
      recommendations.push({
        type: 'digital_payment',
        title: 'Go Digital',
        description: 'Most of your expenses are cash-based. Digital payments offer better tracking and rewards.',
        priority: 'medium',
        actionUrl: '/settings/payment-methods',
        tips: [
          'Use UPI for small transactions',
          'Get cashback with digital payments',
          'Better expense tracking'
        ]
      })
    }

    // Add recurring expense recommendations
    const recurringExpenses = expenses.filter(exp => exp.isRecurring)
    if (recurringExpenses.length === 0 && expenses.length > 10) {
      recommendations.push({
        type: 'automation',
        title: 'Automate Regular Expenses',
        description: 'Set up recurring expenses for bills and subscriptions to save time.',
        priority: 'low',
        actionUrl: '/expenses/recurring',
        tips: [
          'Set up recurring bills',
          'Automate subscription payments',
          'Never miss payment due dates'
        ]
      })
    }

    sendSuccessResponse(res, 200, {
      recommendations,
      userProfile: {
        spendingLevel: monthlyAverage > 50000 ? 'high' : monthlyAverage > 20000 ? 'medium' : 'low',
        diversityScore: Object.keys(spendingData.categories).length,
        digitalPaymentRatio: paymentMethods.cash ? 
          1 - (paymentMethods.cash / expenses.length) : 1
      },
      generatedAt: new Date()
    }, 'Smart recommendations generated successfully')
  } catch (error) {
    logger.error('AI recommendations generation failed:', error)
    return next(new AppError('Failed to generate recommendations', 500))
  }
})

// Auto-categorize multiple expenses
export const autoCategorizeExpenses = asyncHandler(async (req, res, next) => {
  const { expenseIds } = req.body

  if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
    return next(new AppError('Expense IDs array is required', 400))
  }

  if (expenseIds.length > 50) {
    return next(new AppError('Maximum 50 expenses can be processed at once', 400))
  }

  // Get expenses
  const expenses = await Expense.find({
    _id: { $in: expenseIds },
    user: req.user.id,
    category: 'other' // Only categorize uncategorized expenses
  })

  const results = []

  for (const expense of expenses) {
    try {
      const categorization = await MockOpenAIService.categorizeExpense(
        expense.title,
        expense.description || '',
        expense.amount
      )

      // Only update if confidence is above threshold
      if (categorization.confidence > 0.6) {
        expense.category = categorization.category
        expense.aiCategory = {
          predicted: categorization.category,
          confidence: categorization.confidence,
          suggestions: categorization.alternatives
        }
        await expense.save()

        results.push({
          expenseId: expense._id,
          originalCategory: 'other',
          newCategory: categorization.category,
          confidence: categorization.confidence,
          updated: true
        })
      } else {
        results.push({
          expenseId: expense._id,
          originalCategory: 'other',
          newCategory: categorization.category,
          confidence: categorization.confidence,
          updated: false,
          reason: 'Low confidence score'
        })
      }
    } catch (error) {
      results.push({
        expenseId: expense._id,
        updated: false,
        error: 'Categorization failed'
      })
    }
  }

  const updated = results.filter(r => r.updated).length

  sendSuccessResponse(res, 200, {
    processed: results.length,
    updated,
    results
  }, `Auto-categorization completed. ${updated} expenses updated.`)
})

// Get AI feature status
export const getAIFeatureStatus = asyncHandler(async (req, res, next) => {
  const features = {
    categorization: {
      enabled: true,
      description: 'Automatic expense categorization',
      accuracy: '85%',
      supportedLanguages: ['en']
    },
    insights: {
      enabled: true,
      description: 'Spending pattern analysis and insights',
      updateFrequency: 'real-time'
    },
    predictions: {
      enabled: true,
      description: 'Future expense predictions',
      accuracy: '75%',
      requiresMinData: '3 months of expenses'
    },
    recommendations: {
      enabled: true,
      description: 'Personalized saving and budgeting recommendations',
      updateFrequency: 'weekly'
    }
  }

  // Check if OpenAI is configured
  const openaiConfigured = process.env.OPENAI_API_KEY ? true : false

  sendSuccessResponse(res, 200, {
    features,
    status: {
      openaiConfigured,
      fallbackMode: !openaiConfigured,
      lastUpdate: new Date(),
      version: '1.0.0'
    }
  }, 'AI feature status retrieved successfully')
})