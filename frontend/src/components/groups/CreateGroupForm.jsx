import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../common/Button'
import { addToast } from '../../store/slices/uiSlice'

const CreateGroupForm = ({ onClose, onSubmit }) => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    privacy: 'private',
    currency: 'USD',
    avatar: null
  })
  
  const [loading, setLoading] = useState(false)
  
  const categories = [
    'General',
    'Travel',
    'Home',
    'Couple',
    'Friends',
    'Family',
    'Work',
    'Event',
    'Roommates',
    'Other'
  ]
  
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ]
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      dispatch(addToast({
        type: 'error',
        message: 'Group name is required'
      }))
      return
    }
    
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newGroup = {
        id: `group_${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        privacy: formData.privacy,
        currency: formData.currency,
        createdAt: new Date().toISOString(),
        members: [{
          id: 'current_user',
          name: 'You',
          email: 'user@example.com',
          role: 'admin',
          joinedAt: new Date().toISOString()
        }],
        totalExpenses: 0,
        totalMembers: 1
      }
      
      if (onSubmit) {
        onSubmit(newGroup)
      }
      
      dispatch(addToast({
        type: 'success',
        message: `Group "${formData.name}" created successfully!`
      }))
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to create group. Please try again.'
      }))
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-gray-400">×</span>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter group name"
            className="input w-full"
            required
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="What's this group for?"
            rows={3}
            className="input w-full resize-none"
          />
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className="input w-full"
          >
            {categories.map(category => (
              <option key={category} value={category.toLowerCase()}>
                {category}
              </option>
            ))}
          </select>
        </div>
        
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="input w-full"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Privacy
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={formData.privacy === 'private'}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Private - Only invited members can join
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={formData.privacy === 'public'}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Public - Anyone with the link can join
              </span>
            </label>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={loading}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

export default CreateGroupForm