import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { expenseService } from '../../services/expenseService'

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'expense/fetchExpenses',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await expenseService.getExpenses(params)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses')
    }
  }
)

export const createExpense = createAsyncThunk(
  'expense/createExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await expenseService.createExpense(expenseData)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create expense')
    }
  }
)

export const updateExpenseAsync = createAsyncThunk(
  'expense/updateExpense',
  async ({ id, expenseData }, { rejectWithValue }) => {
    try {
      const response = await expenseService.updateExpense(id, expenseData)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update expense')
    }
  }
)

export const deleteExpenseAsync = createAsyncThunk(
  'expense/deleteExpense',
  async (id, { rejectWithValue }) => {
    try {
      await expenseService.deleteExpense(id)
      return id
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete expense')
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'expense/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await expenseService.getCategories()
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories')
    }
  }
)

const initialState = {
  expenses: [],
  categories: [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Travel',
    'Education',
    'Other'
  ],
  totalSpent: 0,
  monthlySpent: 0,
  weeklySpent: 0,
  dailySpent: 0,
  budgets: [],
  analytics: {
    categoryBreakdown: [],
    monthlyTrends: [],
    yearlyTrends: [],
  },
  isLoading: false,
  error: null,
}

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    setExpenses: (state, action) => {
      state.expenses = action.payload
    },
    addExpense: (state, action) => {
      state.expenses.unshift(action.payload)
      state.totalSpent += action.payload.amount
    },
    updateExpense: (state, action) => {
      const index = state.expenses.findIndex(exp => exp.id === action.payload.id)
      if (index !== -1) {
        const oldAmount = state.expenses[index].amount
        state.expenses[index] = action.payload
        state.totalSpent = state.totalSpent - oldAmount + action.payload.amount
      }
    },
    deleteExpense: (state, action) => {
      const expense = state.expenses.find(exp => exp.id === action.payload)
      if (expense) {
        state.totalSpent -= expense.amount
        state.expenses = state.expenses.filter(exp => exp.id !== action.payload)
      }
    },
    setBudgets: (state, action) => {
      state.budgets = action.payload
    },
    addBudget: (state, action) => {
      state.budgets.push(action.payload)
    },
    updateBudget: (state, action) => {
      const index = state.budgets.findIndex(budget => budget.id === action.payload.id)
      if (index !== -1) {
        state.budgets[index] = action.payload
      }
    },
    deleteBudget: (state, action) => {
      state.budgets = state.budgets.filter(budget => budget.id !== action.payload)
    },
    setAnalytics: (state, action) => {
      state.analytics = action.payload
    },
    updateSpentAmounts: (state, action) => {
      const { totalSpent, monthlySpent, weeklySpent, dailySpent } = action.payload
      state.totalSpent = totalSpent
      state.monthlySpent = monthlySpent
      state.weeklySpent = weeklySpent
      state.dailySpent = dailySpent
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false
        state.expenses = action.payload.expenses || action.payload
        // Calculate totals if provided
        if (action.payload.totals) {
          state.totalSpent = action.payload.totals.total || 0
          state.monthlySpent = action.payload.totals.monthly || 0
          state.weeklySpent = action.payload.totals.weekly || 0
          state.dailySpent = action.payload.totals.daily || 0
        }
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Create Expense
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false
        state.expenses.unshift(action.payload)
        state.totalSpent += action.payload.amount || 0
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Update Expense
      .addCase(updateExpenseAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateExpenseAsync.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.expenses.findIndex(exp => exp.id === action.payload.id)
        if (index !== -1) {
          const oldAmount = state.expenses[index].amount || 0
          state.expenses[index] = action.payload
          state.totalSpent = state.totalSpent - oldAmount + (action.payload.amount || 0)
        }
      })
      .addCase(updateExpenseAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Delete Expense
      .addCase(deleteExpenseAsync.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteExpenseAsync.fulfilled, (state, action) => {
        state.isLoading = false
        const expense = state.expenses.find(exp => exp.id === action.payload)
        if (expense) {
          state.totalSpent -= expense.amount || 0
          state.expenses = state.expenses.filter(exp => exp.id !== action.payload)
        }
      })
      .addCase(deleteExpenseAsync.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false
        state.categories = Array.isArray(action.payload.categories) 
          ? action.payload.categories 
          : Array.isArray(action.payload) 
            ? action.payload 
            : state.categories
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const {
  setExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  setBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  setAnalytics,
  updateSpentAmounts,
  setLoading,
  setError,
} = expenseSlice.actions

export default expenseSlice.reducer