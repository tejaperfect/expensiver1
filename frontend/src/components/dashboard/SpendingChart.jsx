import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const SpendingChart = () => {
  const [timeframe, setTimeframe] = useState('week')
  
  const weeklyData = [
    { day: 'Mon', amount: 45 },
    { day: 'Tue', amount: 125 },
    { day: 'Wed', amount: 80 },
    { day: 'Thu', amount: 200 },
    { day: 'Fri', amount: 160 },
    { day: 'Sat', amount: 95 },
    { day: 'Sun', amount: 70 }
  ]
  
  const monthlyData = [
    { day: 'Week 1', amount: 450 },
    { day: 'Week 2', amount: 320 },
    { day: 'Week 3', amount: 580 },
    { day: 'Week 4', amount: 420 }
  ]
  
  const data = timeframe === 'week' ? weeklyData : monthlyData
  const maxAmount = Math.max(...data.map(d => d.amount))
  
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Spending Overview</h3>
        
        <div className="flex space-x-2">
          <Button
            variant={timeframe === 'week' ? 'primary' : 'ghost'}
            size=\"sm\"
            onClick={() => setTimeframe('week')}
          >
            Week
          </Button>
          <Button
            variant={timeframe === 'month' ? 'primary' : 'ghost'}
            size=\"sm\"
            onClick={() => setTimeframe('month')}
          >
            Month
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.day}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex items-center space-x-4"
          >
            <div className="w-12 text-sm text-gray-600 font-medium">
              {item.day}
            </div>
            
            <div className="flex-1 relative">
              <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-end pr-3"
                >
                  <span className="text-xs font-medium text-white">
                    ${item.amount}
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <span>Total: ${data.reduce((sum, item) => sum + item.amount, 0)}</span>
        <span>Average: ${Math.round(data.reduce((sum, item) => sum + item.amount, 0) / data.length)}</span>
      </div>
    </div>
  )
}

export default SpendingChart