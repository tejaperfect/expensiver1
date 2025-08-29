import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { groupService } from '../../services/groupService'

// Async thunks for API calls
export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await groupService.getGroups()
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch groups')
    }
  }
)

export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async (groupData, { rejectWithValue }) => {
    try {
      const response = await groupService.createGroup(groupData)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create group')
    }
  }
)

export const joinGroup = createAsyncThunk(
  'groups/joinGroup',
  async (inviteCode, { rejectWithValue }) => {
    try {
      const response = await groupService.joinGroup(inviteCode)
      return response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join group')
    }
  }
)

export const leaveGroup = createAsyncThunk(
  'groups/leaveGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      await groupService.leaveGroup(groupId)
      return groupId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave group')
    }
  }
)

export const updateGroup = createAsyncThunk(
  'groups/updateGroup',
  async ({ groupId, updates }, { rejectWithValue }) => {
    try {
      const response = await groupService.updateGroup(groupId, updates)
      return { groupId, updates: response }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update group')
    }
  }
)

// Group Expense Async Thunks
export const addGroupExpense = createAsyncThunk(
  'groups/addGroupExpense',
  async ({ groupId, expenseData }, { rejectWithValue }) => {
    try {
      const response = await groupService.addGroupExpense(groupId, expenseData)
      return { groupId, expense: response }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add group expense')
    }
  }
)

export const fetchGroupExpenses = createAsyncThunk(
  'groups/fetchGroupExpenses',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await groupService.getGroupExpenses(groupId)
      return { groupId, expenses: response }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch group expenses')
    }
  }
)

export const settleExpense = createAsyncThunk(
  'groups/settleExpense',
  async ({ groupId, expenseId, settlementData }, { rejectWithValue }) => {
    try {
      const response = await groupService.updateGroupExpense(groupId, expenseId, settlementData)
      return { groupId, expenseId, settlementData: response }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to settle expense')
    }
  }
)

const initialState = {
  groups: [],
  loading: false,
  error: null,
  currentGroup: null,
  createLoading: false,
  joinLoading: false,
  groupExpenses: {},
  expenseLoading: false,
  addExpenseLoading: false
}

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentGroup: (state, action) => {
      state.currentGroup = action.payload
    },
    clearCurrentGroup: (state) => {
      state.currentGroup = null
    },
    clearGroupExpenses: (state, action) => {
      if (action.payload) {
        delete state.groupExpenses[action.payload]
      } else {
        state.groupExpenses = {}
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Groups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false
        state.groups = action.payload
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Create Group
      .addCase(createGroup.pending, (state) => {
        state.createLoading = true
        state.error = null
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.createLoading = false
        state.groups.unshift(action.payload)
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.createLoading = false
        state.error = action.payload
      })
      
      // Join Group
      .addCase(joinGroup.pending, (state) => {
        state.joinLoading = true
        state.error = null
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        state.joinLoading = false
        state.groups.unshift(action.payload)
      })
      .addCase(joinGroup.rejected, (state, action) => {
        state.joinLoading = false
        state.error = action.payload
      })
      
      // Leave Group
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(group => group.id !== action.payload)
      })
      
      // Update Group
      .addCase(updateGroup.fulfilled, (state, action) => {
        const { groupId, updates } = action.payload
        const groupIndex = state.groups.findIndex(group => group.id === groupId)
        if (groupIndex !== -1) {
          state.groups[groupIndex] = { ...state.groups[groupIndex], ...updates }
        }
      })
      
      // Add Group Expense
      .addCase(addGroupExpense.pending, (state) => {
        state.addExpenseLoading = true
        state.error = null
      })
      .addCase(addGroupExpense.fulfilled, (state, action) => {
        state.addExpenseLoading = false
        const { groupId, expense } = action.payload
        
        if (!state.groupExpenses[groupId]) {
          state.groupExpenses[groupId] = []
        }
        state.groupExpenses[groupId].unshift(expense)
        
        // Update group totals
        const groupIndex = state.groups.findIndex(group => group.id === groupId)
        if (groupIndex !== -1) {
          state.groups[groupIndex].totalExpenses += parseFloat(expense.amount)
          state.groups[groupIndex].lastActivity = expense.createdAt
        }
      })
      .addCase(addGroupExpense.rejected, (state, action) => {
        state.addExpenseLoading = false
        state.error = action.payload
      })
      
      // Fetch Group Expenses
      .addCase(fetchGroupExpenses.pending, (state) => {
        state.expenseLoading = true
        state.error = null
      })
      .addCase(fetchGroupExpenses.fulfilled, (state, action) => {
        state.expenseLoading = false
        const { groupId, expenses } = action.payload
        state.groupExpenses[groupId] = expenses
      })
      .addCase(fetchGroupExpenses.rejected, (state, action) => {
        state.expenseLoading = false
        state.error = action.payload
      })
      
      // Settle Expense
      .addCase(settleExpense.fulfilled, (state, action) => {
        const { groupId, expenseId, settlementData } = action.payload
        
        if (state.groupExpenses[groupId]) {
          const expenseIndex = state.groupExpenses[groupId].findIndex(exp => exp.id === expenseId)
          if (expenseIndex !== -1) {
            state.groupExpenses[groupId][expenseIndex] = {
              ...state.groupExpenses[groupId][expenseIndex],
              status: 'settled',
              settledAt: new Date().toISOString(),
              ...settlementData
            }
          }
        }
      })
  }
})

export const { clearError, setCurrentGroup, clearCurrentGroup, clearGroupExpenses } = groupSlice.actions
export default groupSlice.reducer