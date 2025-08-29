import React from 'react'
import { getPasswordStrength } from '../../utils/validation'

const PasswordStrengthIndicator = ({ password }) => {
  const strength = getPasswordStrength(password)

  const getColorClasses = color => {
    const colors = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500'
    }
    return colors[color] || 'bg-gray-300'
  }

  const getTextColorClasses = color => {
    const colors = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      blue: 'text-blue-600',
      green: 'text-green-600'
    }
    return colors[color] || 'text-gray-600'
  }

  if (!password) return null

  return (
    <div className='mt-2'>
      <div className='flex space-x-1 mb-1'>
        {[1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              level <= strength.score
                ? getColorClasses(strength.color)
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${getTextColorClasses(strength.color)}`}>
        Password strength: {strength.label}
      </p>
    </div>
  )
}

export default PasswordStrengthIndicator
