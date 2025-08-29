import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
  messages: [],
  loading: false,
  error: null,
  suggestions: [],
  isActive: false,
  context: null
}

// Mock AI responses for development
const mockAIResponses = {
  'expense_summary': {
    content: "Based on your recent expenses, here's what I found:\n\nYou've spent ₹12,450 this month across various categories. Your top spending categories are Food (₹4,200) and Transportation (₹2,800).",
    data: {
      insights: [
        "Your food expenses increased by 23% compared to last month",
        "You're spending 34% of your income on necessities",
        "Weekend expenses are 40% higher than weekdays"
      ],
      suggestions: [
        "Consider meal planning to reduce food costs",
        "Use public transport more to cut transportation expenses",
        "Set a weekly spending limit for discretionary expenses"
      ]
    }
  },
  'budget_advice': {
    content: "Here's personalized budget advice based on your spending patterns:",
    data: {
      insights: [
        "You're following the 50/30/20 rule fairly well",
        "Your savings rate is 18% - that's great!",
        "Entertainment expenses could be optimized"
      ],
      suggestions: [
        "Increase your emergency fund to 6 months of expenses",
        "Consider investing 10% more in SIP for long-term growth",
        "Set up automatic transfers to savings account",
        "Use the envelope method for discretionary spending"
      ]
    }
  },
  'spending_trends': {
    content: "Your spending trends show interesting patterns:",
    data: {
      insights: [
        "Peak spending occurs on Fridays and Saturdays",
        "Monthly spending has decreased by 8% over 3 months",
        "Digital payments represent 85% of your transactions"
      ],
      chart: {
        type: "Monthly Trend",
        description: "Spending decreased from ₹15,200 to ₹12,450"
      }
    }
  },
  'group_insights': {
    content: "Your group expense analysis reveals:",
    data: {
      insights: [
        "You contribute 28% more than average in group trips",
        "Most group expenses are for food and entertainment",
        "You have pending settlements of ₹850 across 2 groups"
      ],
      suggestions: [
        "Consider setting group spending limits before trips",
        "Use the shared wallet feature for better transparency",
        "Set up automatic settlement reminders"
      ]
    }
  },
  'save_money': {
    content: "Here are personalized money-saving strategies for you:",
    data: {
      suggestions: [
        "Switch to a lower data plan - save ₹300/month",
        "Cook at home 2 more days per week - save ₹1,200/month", 
        "Use cashback credit cards for fuel - save ₹400/month",
        "Cancel unused subscriptions - save ₹600/month",
        "Buy groceries in bulk - save ₹800/month"
      ],
      insights: [
        "Potential monthly savings: ₹3,300",
        "Annual savings potential: ₹39,600",
        "These savings could fund a vacation or boost your emergency fund"
      ]
    }
  },
  'expense_categories': {
    content: "Your expense breakdown by category:",
    data: {
      insights: [
        "Food & Dining: ₹4,200 (34%)",
        "Transportation: ₹2,800 (22%)",
        "Entertainment: ₹2,100 (17%)",
        "Shopping: ₹1,800 (14%)",
        "Utilities: ₹1,200 (10%)",
        "Others: ₹350 (3%)"
      ],
      suggestions: [
        "Food expenses are above the recommended 25% of income",
        "Consider carpooling to reduce transportation costs",
        "Entertainment budget is healthy at 17%",
        "Track impulse purchases in shopping category"
      ]
    }
  }
}

// Simulate AI API call
export const sendAIMessage = createAsyncThunk(
  'ai/sendMessage',
  async ({ message, context }, { rejectWithValue, getState }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock AI response generation
      const lowerMessage = message.toLowerCase()
      let response = null
      
      // Match against predefined responses
      for (const [key, value] of Object.entries(mockAIResponses)) {
        if (lowerMessage.includes(key.replace('_', ' ')) || 
            lowerMessage.includes(key.replace('_', ''))) {
          response = value
          break
        }
      }
      
      // Fallback response
      if (!response) {
        if (lowerMessage.includes('help') || lowerMessage.includes('what')) {
          response = {
            content: "I can help you with:\n\n• Expense analysis and summaries\n• Budget advice and recommendations\n• Spending trend analysis\n• Group expense insights\n• Money-saving suggestions\n• Category breakdowns\n\nJust ask me any question about your finances!"
          }
        } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
          response = {
            content: "Hello! I'm your AI financial assistant. I can analyze your expenses, provide budget advice, and help you make better financial decisions. What would you like to know about your finances?"
          }
        } else {
          response = {
            content: "I understand you're asking about: \"" + message + "\"\n\nBased on your expense data, here are some insights I can provide:",
            data: {
              insights: [
                "Your recent spending patterns show good financial discipline",
                "You maintain a healthy balance across different categories",
                "Consider tracking expenses more granularly for better insights"
              ],
              suggestions: [
                "Try asking me about specific categories like 'food expenses'",
                "Ask for budget advice or spending trends",
                "Request a summary of your recent expenses"
              ]
            }
          }
        }
      }
      
      // Create AI message
      const aiMessage = {
        id: 'ai_' + Date.now(),
        type: 'ai',
        content: response.content,
        data: response.data || null,
        timestamp: new Date().toISOString()
      }
      
      return {
        userMessage: {
          id: 'user_' + Date.now(),
          type: 'user', 
          content: message,
          timestamp: new Date().toISOString()
        },
        aiMessage
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Generate AI insights for dashboard
export const generateAIInsights = createAsyncThunk(
  'ai/generateInsights',
  async ({ expenses, budget, groups }, { rejectWithValue }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
      const avgExpense = totalExpenses / (expenses.length || 1)
      
      const insights = [
        `You've spent ₹${totalExpenses.toFixed(0)} this month across ${expenses.length} transactions`,
        `Your average transaction is ₹${avgExpense.toFixed(0)}`,
        expenses.length > 10 ? "You're actively tracking your expenses - great job!" : "Try to log more expenses for better insights",
        groups.length > 0 ? `You're part of ${groups.length} expense groups` : "Consider joining groups for shared expenses"
      ]
      
      const suggestions = [
        "Review your largest expenses to find savings opportunities",
        "Set up automatic categorization for faster expense tracking", 
        "Use the budget feature to set spending limits",
        "Check out group expenses for shared costs"
      ]
      
      return { insights, suggestions }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearAIMessages: (state) => {
      state.messages = []
    },
    setAIActive: (state, action) => {
      state.isActive = action.payload
    },
    addAISuggestion: (state, action) => {
      if (!state.suggestions.includes(action.payload)) {
        state.suggestions.push(action.payload)
      }
    },
    clearAISuggestions: (state) => {
      state.suggestions = []
    },
    setAIContext: (state, action) => {
      state.context = action.payload
    },
    addManualMessage: (state, action) => {
      state.messages.push(action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Send AI Message
      .addCase(sendAIMessage.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendAIMessage.fulfilled, (state, action) => {
        state.loading = false
        const { userMessage, aiMessage } = action.payload
        state.messages.push(userMessage)
        state.messages.push(aiMessage)
        
        // Update suggestions based on AI response
        if (aiMessage.data?.suggestions) {
          state.suggestions = aiMessage.data.suggestions.slice(0, 5)
        }
      })
      .addCase(sendAIMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Generate AI Insights
      .addCase(generateAIInsights.pending, (state) => {
        state.loading = true
      })
      .addCase(generateAIInsights.fulfilled, (state, action) => {
        state.loading = false
        const { insights, suggestions } = action.payload
        
        // Add insights as an AI message
        const insightsMessage = {
          id: 'insights_' + Date.now(),
          type: 'ai',
          content: "Here are some insights about your expenses:",
          data: { insights, suggestions },
          timestamp: new Date().toISOString()
        }
        
        state.messages.push(insightsMessage)
      })
      .addCase(generateAIInsights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const {
  clearAIMessages,
  setAIActive,
  addAISuggestion,
  clearAISuggestions,
  setAIContext,
  addManualMessage
} = aiSlice.actions

export default aiSlice.reducer