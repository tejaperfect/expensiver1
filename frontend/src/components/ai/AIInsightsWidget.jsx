import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const AIInsightsWidget = () => {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call for insights
    const fetchInsights = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate delay
      
      setInsights([
        {
          id: 1,
          type: 'spending_pattern',
          title: 'High Spending Alert',
          message: 'Your dining expenses increased by 25% this week. Consider cooking at home to save money.',
          icon: '🍽️',
          priority: 'high',
          actionable: true
        },
        {
          id: 2,
          type: 'savings_opportunity',
          title: 'Savings Opportunity',
          message: 'You could save $120/month by switching to a different subscription plan.',
          icon: '💡',
          priority: 'medium',
          actionable: true
        },
        {
          id: 3,
          type: 'budget_recommendation',
          title: 'Budget Adjustment',
          message: 'Your entertainment budget seems underutilized. Consider reallocating to groceries.',
          icon: '📊',
          priority: 'low',
          actionable: false
        }
      ])
      setLoading(false)
    }

    fetchInsights()
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-lg">{insight.icon}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                    {insight.priority}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{insight.message}</p>
                
                {insight.actionable && (
                  <div className="flex space-x-2">
                    <Button size="sm" variant="primary">
                      Take Action
                    </Button>
                    <Button size="sm" variant="ghost">
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <Button variant="outline" className="w-full">
          Get More AI Insights
        </Button>
      </div>
    </div>
  )
}

export default AIInsightsWidget