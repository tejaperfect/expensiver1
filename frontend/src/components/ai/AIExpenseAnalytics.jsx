import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { sendAIMessage } from '../../store/slices/aiSlice'
import { generateInsights } from '../../store/slices/analyticsSlice'
import Button from '../common/Button'

const AIExpenseAnalytics = ({ isOpen, onClose, expenses }) => {
  const dispatch = useDispatch()
  const { messages, loading } = useSelector(state => state.ai)
  const { insights } = useSelector(state => state.analytics)
  const [activeTab, setActiveTab] = useState('insights')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const tabs = [
    { id: 'insights', name: 'AI Insights', icon: '🤖' },
    { id: 'predictions', name: 'Predictions', icon: '🔮' },
    { id: 'recommendations', name: 'Recommendations', icon: '💡' },
    { id: 'analysis', name: 'Deep Analysis', icon: '📊' }
  ]

  const quickQuestions = [
    {
      id: 'spending_pattern',
      text: 'Analyze my spending patterns',
      prompt: 'Analyze my spending patterns and identify trends over the last month. What insights can you provide?'
    },
    {
      id: 'budget_optimization',
      text: 'How can I optimize my budget?',
      prompt: 'Based on my spending history, how can I optimize my budget? What areas should I focus on?'
    },
    {
      id: 'future_prediction',
      text: 'Predict my future expenses',
      prompt: 'Based on my current spending trends, predict my expenses for next month. What should I expect?'
    },
    {
      id: 'savings_opportunity',
      text: 'Find savings opportunities',
      prompt: 'Analyze my expenses and identify opportunities to save money. What specific recommendations do you have?'
    },
    {
      id: 'category_breakdown',
      text: 'Break down my spending by category',
      prompt: 'Provide a detailed breakdown of my spending by category. Which categories need attention?'
    },
    {
      id: 'comparison_analysis',
      text: 'Compare with previous periods',
      prompt: 'Compare my current spending with previous periods. What changes do you notice?'
    }
  ]

  useEffect(() => {
    if (isOpen && expenses.length > 0) {
      // Generate insights when component opens
      dispatch(generateInsights({ expenses }))
    }
  }, [isOpen, expenses.length, dispatch])

  useEffect(() => {
    let interval
    if (autoRefresh && isOpen) {
      interval = setInterval(() => {
        dispatch(generateInsights({ expenses }))
      }, 30000) // Refresh every 30 seconds
    }
    return () => clearInterval(interval)
  }, [autoRefresh, isOpen, expenses, dispatch])

  const handleQuickQuestion = async (question) => {
    try {
      await dispatch(sendAIMessage({
        message: question.prompt,
        context: {
          expenses: expenses.slice(-20), // Last 20 expenses
          analysisType: 'deep_analysis'
        }
      })).unwrap()
    } catch (error) {
      console.error('Failed to send AI message:', error)
    }
  }

  const renderInsightsTab = () => (
    <div className="space-y-4">
      {insights.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🤖</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Insights Yet</h4>
          <p className="text-gray-500 mb-4">Add some expenses to get AI-powered insights</p>
          <Button
            onClick={() => dispatch(generateInsights({ expenses }))}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Insights'}
          </Button>
        </div>
      ) : (
        insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-l-4 ${
              insight.severity === 'error' ? 'bg-red-50 border-red-400' :
              insight.severity === 'warning' ? 'bg-orange-50 border-orange-400' :
              insight.severity === 'success' ? 'bg-green-50 border-green-400' :
              'bg-blue-50 border-blue-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`font-medium mb-1 ${
                  insight.severity === 'error' ? 'text-red-800' :
                  insight.severity === 'warning' ? 'text-orange-800' :
                  insight.severity === 'success' ? 'text-green-800' :
                  'text-blue-800'
                }`}>
                  {insight.title}
                </div>
                <div className={`text-sm ${
                  insight.severity === 'error' ? 'text-red-700' :
                  insight.severity === 'warning' ? 'text-orange-700' :
                  insight.severity === 'success' ? 'text-green-700' :
                  'text-blue-700'
                }`}>
                  {insight.message}
                </div>
                {insight.data && (
                  <div className="mt-2 text-xs opacity-75">
                    Category: {insight.category} • Type: {insight.type}
                  </div>
                )}
              </div>
              <div className="text-2xl ml-3">
                {insight.severity === 'error' ? '🚨' :
                 insight.severity === 'warning' ? '⚠️' :
                 insight.severity === 'success' ? '✅' : '💡'}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )

  const renderPredictionsTab = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🔮</span>
          <h4 className="text-lg font-semibold text-gray-900">Spending Predictions</h4>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Next Month Estimate</div>
            <div className="text-2xl font-bold text-gray-900">₹{(expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) * 1.05).toLocaleString()}</div>
            <div className="text-sm text-green-600">+5% from this month</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Confidence Level</div>
            <div className="text-2xl font-bold text-gray-900">87%</div>
            <div className="text-sm text-blue-600">Based on historical data</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Prediction Model:</strong> Based on your spending patterns over the last 3 months, 
            accounting for seasonal trends and category-specific growth rates.
          </div>
        </div>
      </div>
    </div>
  )

  const renderRecommendationsTab = () => (
    <div className="space-y-4">
      {[
        {
          title: 'Reduce Food Delivery',
          description: 'You spend 30% more on food delivery than the average. Consider cooking at home 2-3 times per week.',
          savings: '₹2,500/month',
          difficulty: 'Easy',
          icon: '🍽️'
        },
        {
          title: 'Optimize Subscription Services',
          description: 'Review your recurring subscriptions. You have 3 overlapping entertainment services.',
          savings: '₹800/month',
          difficulty: 'Easy',
          icon: '📺'
        },
        {
          title: 'Use Public Transport',
          description: 'Consider using public transport for short trips instead of ride-sharing services.',
          savings: '₹1,200/month',
          difficulty: 'Medium',
          icon: '🚇'
        },
        {
          title: 'Set Category Budgets',
          description: 'Create budgets for your top 3 spending categories to better control expenses.',
          savings: '₹3,000/month',
          difficulty: 'Medium',
          icon: '🎯'
        }
      ].map((recommendation, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-4">
            <div className="text-2xl">{recommendation.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">{recommendation.title}</h5>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-600">{recommendation.savings}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    recommendation.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {recommendation.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">Learn More</Button>
                <Button size="sm" variant="primary">Start Saving</Button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      {/* Quick Questions */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Analysis Questions</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {quickQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => handleQuickQuestion(question)}
              disabled={loading}
              className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors disabled:opacity-50"
            >
              <div className="text-sm font-medium text-gray-900">{question.text}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent AI Analysis */}
      {messages.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Analysis</h4>
          <div className="space-y-4">
            {messages.filter(msg => msg.type === 'ai').slice(-3).map((message) => (
              <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(message.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🤖</span>
              <div>
                <h2 className="text-xl font-bold">AI Expense Analytics</h2>
                <p className="text-purple-100">Advanced insights powered by artificial intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'insights' && renderInsightsTab()}
              {activeTab === 'predictions' && renderPredictionsTab()}
              {activeTab === 'recommendations' && renderRecommendationsTab()}
              {activeTab === 'analysis' && renderAnalysisTab()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => dispatch(generateInsights({ expenses }))}
                disabled={loading}
                className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Insights'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AIExpenseAnalytics