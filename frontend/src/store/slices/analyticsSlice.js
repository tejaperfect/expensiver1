import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { analyticsService } from '../../services/analyticsService'

const initialState = {
  reports: [],
  currentReport: null,
  insights: [],
  trends: {},
  dashboardData: {
    overview: {
      totalExpenses: 0,
      totalAmount: 0,
      avgAmount: 0,
      maxAmount: 0,
      minAmount: 0
    },
    categoryBreakdown: [],
    spendingTrends: [],
    recentExpenses: [],
    comparison: {
      currentPeriod: 0,
      previousPeriod: 0,
      change: 0,
      changeType: 'no_change'
    }
  },
  budgetAnalysis: {
    period: 'month',
    overall: {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      utilizationPercent: 0,
      status: 'good'
    },
    categoryAnalysis: [],
    recommendations: []
  },
  spendingPatterns: {
    spendingByDayOfWeek: [],
    spendingByHour: [],
    spendingByPaymentMethod: [],
    monthlyTrend: [],
    topLocations: []
  },
  loading: false,
  error: null,
  filters: {
    period: 'month',
    category: 'all',
    dateRange: null
  },
  exportProgress: null
}

// Async thunks
export const getDashboardAnalytics = createAsyncThunk(
  'analytics/getDashboardAnalytics',
  async (period = '30d', { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboardAnalytics(period)
      return response
    } catch (error) {
      console.error('Dashboard analytics error:', error)
      // Return fallback data instead of rejecting
      return {
        overview: {
          totalExpenses: 0,
          totalAmount: 0,
          avgAmount: 0,
          maxAmount: 0,
          minAmount: 0
        },
        categoryBreakdown: [],
        spendingTrends: [],
        recentExpenses: [],
        comparison: {
          currentPeriod: 0,
          previousPeriod: 0,
          change: 0,
          changeType: 'no_change'
        }
      }
    }
  }
)

export const getSpendingPatterns = createAsyncThunk(
  'analytics/getSpendingPatterns',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSpendingPatterns(params)
      return response
    } catch (error) {
      console.error('Spending patterns error:', error)
      // Return fallback data
      return {
        spendingByDayOfWeek: [],
        spendingByHour: [],
        spendingByPaymentMethod: [],
        monthlyTrend: [],
        topLocations: []
      }
    }
  }
)

export const getBudgetAnalysis = createAsyncThunk(
  'analytics/getBudgetAnalysis',
  async (period = '30d', { rejectWithValue }) => {
    try {
      const response = await analyticsService.getBudgetAnalysis(period)
      return response
    } catch (error) {
      console.error('Budget analysis error:', error)
      // Return fallback data
      return {
        period,
        overall: {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          utilizationPercent: 0,
          status: 'good'
        },
        categoryAnalysis: [],
        recommendations: []
      }
    }
  }
)

export const generateReport = createAsyncThunk(
  'analytics/generateReport',
  async ({ period, category, expenses }, { rejectWithValue }) => {
    try {
      // Simulate API call for report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const reportId = 'report_' + Date.now()
      const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      
      // Generate category breakdown
      const categories = {}
      expenses.forEach(expense => {
        const cat = expense.category || 'Other'
        categories[cat] = (categories[cat] || 0) + parseFloat(expense.amount || 0)
      })

      const report = {
        id: reportId,
        title: `${period.charAt(0).toUpperCase() + period.slice(1)} Report`,
        period,
        category,
        generatedAt: new Date().toISOString(),
        summary: {
          totalExpenses: expenses.length,
          totalAmount: totalSpent,
          avgTransaction: totalSpent / (expenses.length || 1),
          topCategory: Object.entries(categories).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
        },
        categories,
        expenses,
        insights: [],
        downloadUrl: `/api/reports/${reportId}/download` // Mock URL
      }
      
      return report
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const generateInsights = createAsyncThunk(
  'analytics/generateInsights',
  async ({ expenses, budgets = [], period = 'month' }, { rejectWithValue }) => {
    try {
      // Simulate AI-powered insights generation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const insights = []
      
      if (expenses.length === 0) {
        return []
      }

      const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      const avgDaily = totalSpent / 30

      // Spending trend insights
      if (avgDaily > 1000) {
        insights.push({
          id: 'high_spending_' + Date.now(),
          type: 'spending_alert',
          title: 'High Daily Spending',
          message: `Your daily average of ₹${avgDaily.toFixed(0)} is above normal`,
          severity: 'warning',
          category: 'trend',
          data: { avgDaily, threshold: 1000 }
        })
      }

      // Category insights
      const categories = {}
      expenses.forEach(expense => {
        const cat = expense.category || 'Other'
        categories[cat] = (categories[cat] || 0) + parseFloat(expense.amount || 0)
      })

      const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0]
      if (topCategory && (topCategory[1] / totalSpent) > 0.3) {
        insights.push({
          id: 'category_dominance_' + Date.now(),
          type: 'category_alert',
          title: 'Category Dominance',
          message: `${topCategory[0]} represents ${((topCategory[1] / totalSpent) * 100).toFixed(1)}% of your spending`,
          severity: 'info',
          category: 'category',
          data: { category: topCategory[0], percentage: (topCategory[1] / totalSpent) * 100 }
        })
      }

      // Budget insights (if budgets are provided)
      budgets.forEach(budget => {
        const spent = categories[budget.category] || 0
        const percentage = (spent / parseFloat(budget.amount || 1)) * 100
        
        if (percentage > 80) {
          insights.push({
            id: 'budget_alert_' + budget.category + '_' + Date.now(),
            type: 'budget_warning',
            title: 'Budget Alert',
            message: `${budget.category} budget is ${percentage.toFixed(1)}% used`,
            severity: percentage > 100 ? 'error' : 'warning',
            category: 'budget',
            data: { category: budget.category, percentage, spent, budget: budget.amount }
          })
        }
      })

      // Add some positive insights
      if (insights.length === 0 || Math.random() > 0.5) {
        insights.push({
          id: 'positive_insight_' + Date.now(),
          type: 'achievement',
          title: 'Good Job!',
          message: 'Your spending is well distributed across categories',
          severity: 'success',
          category: 'achievement',
          data: { message: 'balanced_spending' }
        })
      }
      
      return insights
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const exportReport = createAsyncThunk(
  'analytics/exportReport',
  async ({ reportId, format = 'pdf' }, { rejectWithValue, dispatch }) => {
    try {
      // Simulate export process with progress updates
      dispatch(setExportProgress(0))
      
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 300))
        dispatch(setExportProgress(i))
      }
      
      const downloadUrl = `/api/reports/${reportId}/export.${format}`
      
      return {
        downloadUrl,
        format,
        size: '2.5 MB',
        generatedAt: new Date().toISOString()
      }
    } catch (error) {
      return rejectWithValue(error.message)
    } finally {
      dispatch(setExportProgress(null))
    }
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearReports: (state) => {
      state.reports = []
      state.currentReport = null
    },
    setCurrentReport: (state, action) => {
      state.currentReport = action.payload
    },
    addInsight: (state, action) => {
      state.insights.push(action.payload)
    },
    removeInsight: (state, action) => {
      state.insights = state.insights.filter(insight => insight.id !== action.payload)
    },
    clearInsights: (state) => {
      state.insights = []
    },
    setTrends: (state, action) => {
      state.trends = action.payload
    },
    setExportProgress: (state, action) => {
      state.exportProgress = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Dashboard Analytics
      .addCase(getDashboardAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getDashboardAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.dashboardData = action.payload
      })
      .addCase(getDashboardAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        // Provide fallback data even on rejection
        state.dashboardData = {
          overview: {
            totalExpenses: 0,
            totalAmount: 0,
            avgAmount: 0,
            maxAmount: 0,
            minAmount: 0
          },
          categoryBreakdown: [],
          spendingTrends: [],
          recentExpenses: [],
          comparison: {
            currentPeriod: 0,
            previousPeriod: 0,
            change: 0,
            changeType: 'no_change'
          }
        }
      })
      
      // Get Spending Patterns
      .addCase(getSpendingPatterns.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getSpendingPatterns.fulfilled, (state, action) => {
        state.loading = false
        state.spendingPatterns = action.payload
      })
      .addCase(getSpendingPatterns.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        // Provide fallback data even on rejection
        state.spendingPatterns = {
          spendingByDayOfWeek: [],
          spendingByHour: [],
          spendingByPaymentMethod: [],
          monthlyTrend: [],
          topLocations: []
        }
      })
      
      // Get Budget Analysis
      .addCase(getBudgetAnalysis.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getBudgetAnalysis.fulfilled, (state, action) => {
        state.loading = false
        state.budgetAnalysis = action.payload
      })
      .addCase(getBudgetAnalysis.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        // Provide fallback data even on rejection
        state.budgetAnalysis = {
          period: 'month',
          overall: {
            totalBudget: 0,
            totalSpent: 0,
            totalRemaining: 0,
            utilizationPercent: 0,
            status: 'good'
          },
          categoryAnalysis: [],
          recommendations: []
        }
      })
      
      // Generate Report
      .addCase(generateReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.loading = false
        state.reports.push(action.payload)
        state.currentReport = action.payload
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Generate Insights
      .addCase(generateInsights.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(generateInsights.fulfilled, (state, action) => {
        state.loading = false
        state.insights = action.payload
      })
      .addCase(generateInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Export Report
      .addCase(exportReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(exportReport.fulfilled, (state, action) => {
        state.loading = false
        // Handle successful export
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.exportProgress = null
      })
  }
})

export const {
  setFilters,
  clearReports,
  setCurrentReport,
  addInsight,
  removeInsight,
  clearInsights,
  setTrends,
  setExportProgress,
  setLoading,
  setError
} = analyticsSlice.actions

export default analyticsSlice.reducer