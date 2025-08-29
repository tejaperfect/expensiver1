import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
  transactions: [],
  currentTransaction: null,
  loading: false,
  paymentStatus: null,
  paymentId: null,
  error: null,
  supportedMethods: ['upi', 'card', 'netbanking'],
  recentRecipients: []
}

// Mock payment API responses
const mockTransactions = []

// Generate a mock payment ID
const generatePaymentId = () => {
  return 'PAY_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9).toUpperCase()
}

// Initiate UPI Payment
export const initiateUPIPayment = createAsyncThunk(
  'payment/initiateUPI',
  async (paymentData, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const paymentId = generatePaymentId()
      const transaction = {
        id: paymentId,
        amount: paymentData.amount,
        recipient: paymentData.recipient,
        description: paymentData.description,
        method: 'upi',
        app: paymentData.app,
        status: 'initiated',
        createdAt: new Date().toISOString(),
        upiUrl: paymentData.upiUrl
      }
      
      // Add to mock transactions
      mockTransactions.push(transaction)
      
      return { paymentId, transaction }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Check Payment Status
export const checkPaymentStatus = createAsyncThunk(
  'payment/checkStatus',
  async (paymentId, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Find transaction
      const transaction = mockTransactions.find(t => t.id === paymentId)
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      
      // Simulate status progression
      const statusProgression = ['initiated', 'processing', 'verifying', 'success']
      const currentIndex = statusProgression.indexOf(transaction.status)
      
      if (currentIndex < statusProgression.length - 1) {
        // Progress to next status with some randomness
        if (Math.random() > 0.3) {
          transaction.status = statusProgression[currentIndex + 1]
        }
        
        // Simulate failure occasionally
        if (transaction.status === 'processing' && Math.random() > 0.8) {
          transaction.status = 'failed'
          transaction.failureReason = 'Insufficient balance'
        }
      }
      
      return {
        paymentId,
        status: transaction.status,
        transaction
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Process Card Payment
export const processCardPayment = createAsyncThunk(
  'payment/processCard',
  async (cardData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const paymentId = generatePaymentId()
      const transaction = {
        id: paymentId,
        amount: cardData.amount,
        recipient: cardData.recipient,
        description: cardData.description,
        method: 'card',
        cardLast4: cardData.cardNumber.slice(-4),
        status: Math.random() > 0.1 ? 'success' : 'failed',
        createdAt: new Date().toISOString()
      }
      
      mockTransactions.push(transaction)
      
      return { paymentId, transaction }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Fetch Transaction History
export const fetchTransactionHistory = createAsyncThunk(
  'payment/fetchHistory',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Return paginated mock transactions
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedTransactions = mockTransactions.slice(startIndex, endIndex)
      
      return {
        transactions: paginatedTransactions,
        total: mockTransactions.length,
        page,
        limit
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Send Money to Contact
export const sendMoney = createAsyncThunk(
  'payment/sendMoney',
  async (paymentData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const paymentId = generatePaymentId()
      const transaction = {
        id: paymentId,
        type: 'sent',
        amount: paymentData.amount,
        recipient: paymentData.recipient,
        description: paymentData.description || 'Money transfer',
        method: paymentData.method || 'upi',
        status: 'success',
        createdAt: new Date().toISOString()
      }
      
      mockTransactions.push(transaction)
      
      return { paymentId, transaction }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Request Money from Contact
export const requestMoney = createAsyncThunk(
  'payment/requestMoney',
  async (requestData, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const requestId = generatePaymentId()
      const request = {
        id: requestId,
        type: 'request',
        amount: requestData.amount,
        from: requestData.from,
        description: requestData.description || 'Money request',
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }
      
      return { requestId, request }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.currentTransaction = null
      state.paymentStatus = null
      state.paymentId = null
      state.error = null
    },
    setPaymentStatus: (state, action) => {
      state.paymentStatus = action.payload
    },
    addRecentRecipient: (state, action) => {
      const recipient = action.payload
      const existingIndex = state.recentRecipients.findIndex(r => r.id === recipient.id)
      
      if (existingIndex !== -1) {
        // Move to front if already exists
        state.recentRecipients.splice(existingIndex, 1)
      }
      
      state.recentRecipients.unshift(recipient)
      
      // Keep only last 10 recipients
      if (state.recentRecipients.length > 10) {
        state.recentRecipients = state.recentRecipients.slice(0, 10)
      }
    },
    updateTransactionStatus: (state, action) => {
      const { transactionId, status } = action.payload
      const transaction = state.transactions.find(t => t.id === transactionId)
      if (transaction) {
        transaction.status = status
      }
    },
    setCurrentTransaction: (state, action) => {
      state.currentTransaction = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Initiate UPI Payment
      .addCase(initiateUPIPayment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(initiateUPIPayment.fulfilled, (state, action) => {
        state.loading = false
        const { paymentId, transaction } = action.payload
        state.paymentId = paymentId
        state.currentTransaction = transaction
        state.paymentStatus = 'initiated'
        state.transactions.unshift(transaction)
        
        // Add recipient to recent list
        if (transaction.recipient) {
          const existingIndex = state.recentRecipients.findIndex(r => r.id === transaction.recipient.id)
          if (existingIndex !== -1) {
            state.recentRecipients.splice(existingIndex, 1)
          }
          state.recentRecipients.unshift(transaction.recipient)
          if (state.recentRecipients.length > 10) {
            state.recentRecipients = state.recentRecipients.slice(0, 10)
          }
        }
      })
      .addCase(initiateUPIPayment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Check Payment Status
      .addCase(checkPaymentStatus.fulfilled, (state, action) => {
        const { paymentId, status, transaction } = action.payload
        state.paymentStatus = status
        
        // Update transaction in state
        const existingTransaction = state.transactions.find(t => t.id === paymentId)
        if (existingTransaction) {
          Object.assign(existingTransaction, transaction)
        }
        
        if (state.currentTransaction?.id === paymentId) {
          state.currentTransaction = transaction
        }
      })
      
      // Process Card Payment
      .addCase(processCardPayment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(processCardPayment.fulfilled, (state, action) => {
        state.loading = false
        const { paymentId, transaction } = action.payload
        state.paymentId = paymentId
        state.currentTransaction = transaction
        state.paymentStatus = transaction.status
        state.transactions.unshift(transaction)
      })
      .addCase(processCardPayment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Transaction History
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.loading = false
        const { transactions, page } = action.payload
        
        if (page === 1) {
          state.transactions = transactions
        } else {
          state.transactions.push(...transactions)
        }
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Send Money
      .addCase(sendMoney.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendMoney.fulfilled, (state, action) => {
        state.loading = false
        const { transaction } = action.payload
        state.transactions.unshift(transaction)
        
        if (transaction.recipient) {
          const existingIndex = state.recentRecipients.findIndex(r => r.id === transaction.recipient.id)
          if (existingIndex !== -1) {
            state.recentRecipients.splice(existingIndex, 1)
          }
          state.recentRecipients.unshift(transaction.recipient)
          if (state.recentRecipients.length > 10) {
            state.recentRecipients = state.recentRecipients.slice(0, 10)
          }
        }
      })
      .addCase(sendMoney.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Request Money
      .addCase(requestMoney.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(requestMoney.fulfilled, (state, action) => {
        state.loading = false
        // Handle money request success
      })
      .addCase(requestMoney.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const {
  clearPaymentState,
  setPaymentStatus,
  addRecentRecipient,
  updateTransactionStatus,
  setCurrentTransaction
} = paymentSlice.actions

export default paymentSlice.reducer