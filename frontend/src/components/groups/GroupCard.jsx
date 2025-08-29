import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Button from '../common/Button'

const GroupCard = ({ group, onLeave, onEdit, index = 0 }) => {
  const getCategoryIcon = (category) => {
    const icons = {
      general: '👥',
      travel: '✈️',
      home: '🏠',
      couple: '💑',
      friends: '👫',
      family: '👨‍👩‍👧‍👦',
      work: '💼',
      event: '🎉',
      roommates: '🏡',
      other: '📋'
    }
    return icons[category] || '👥'
  }
  
  const getCurrencySymbol = (currency) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      CAD: 'C$',
      AUD: 'A$',
      JPY: '¥'
    }
    return symbols[currency] || '$'
  }
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  const currentUserRole = group.members?.find(member => member.id === 'current_user')?.role || 'member'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="card hover:shadow-lg transition-all duration-300"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">{getCategoryIcon(group.category)}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {group.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {group.category} • {group.privacy}
              </p>
            </div>
          </div>
          
          {/* Dropdown Menu */}
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-gray-400">⋮</span>
            </button>
          </div>
        </div>
        
        {/* Description */}
        {group.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {group.description}
          </p>
        )}
        
        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {group.totalMembers || 0}
              </div>
              <div className="text-xs text-gray-500">Members</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {getCurrencySymbol(group.currency)}{(group.totalExpenses || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {getCurrencySymbol(group.currency)}{(group.yourShare || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Your Share</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-gray-500">Created</div>
            <div className="text-sm font-medium text-gray-700">
              {formatDate(group.createdAt)}
            </div>
          </div>
        </div>
        
        {/* Members Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Members</span>
            {currentUserRole === 'admin' && (
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                + Invite
              </button>
            )}
          </div>
          <div className="flex -space-x-2">
            {group.members?.slice(0, 5).map((member, idx) => (
              <div
                key={member.id}
                className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600"
                title={member.name}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {group.members?.length > 5 && (
              <div className="w-8 h-8 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">
                +{group.members.length - 5}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            as={Link}
            to={`/groups/${group.id}`}
            variant="primary"
            size="sm"
            className="flex-1"
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit && onEdit(group)}
            disabled={currentUserRole !== 'admin'}
          >
            Edit
          </Button>
          {currentUserRole !== 'admin' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLeave && onLeave(group)}
              className="text-red-600 hover:text-red-700"
            >
              Leave
            </Button>
          )}
        </div>
        
        {/* Role Badge */}
        <div className="mt-3 flex justify-between items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            currentUserRole === 'admin'
              ? 'bg-green-100 text-green-800'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {currentUserRole === 'admin' ? '👑 Admin' : '👤 Member'}
          </span>
          
          <div className="text-xs text-gray-400">
            {group.lastActivity ? `Active ${formatDate(group.lastActivity)}` : 'No recent activity'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default GroupCard