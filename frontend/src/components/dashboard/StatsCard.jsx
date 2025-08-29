import React from 'react'
import { motion } from 'framer-motion'

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = 'neutral',
  subtitle,
  className = '',
  onClick = null
}) => {
  const changeColors = {
    positive: 'text-green-600 bg-green-100',
    negative: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card card-hover p-6 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {change && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                changeColors[changeType]
              }`}>
                {changeType === 'positive' && '↗'}
                {changeType === 'negative' && '↘'}
                {changeType === 'neutral' && '→'}
                {change}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        
        {icon && (
          <div className="ml-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default StatsCard