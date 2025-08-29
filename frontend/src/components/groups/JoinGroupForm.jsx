import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../common/Button'
import { addToast } from '../../store/slices/uiSlice'

const JoinGroupForm = ({ onClose, onSubmit }) => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    inviteCode: '',
    groupLink: ''
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('code') // 'code' or 'link'
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const value = activeTab === 'code' ? formData.inviteCode : formData.groupLink
    
    if (!value.trim()) {
      dispatch(addToast({
        type: 'error',
        message: `Please enter a valid ${activeTab === 'code' ? 'invite code' : 'group link'}`
      }))
      return
    }
    
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock group data
      const mockGroup = {
        id: `group_${Date.now()}`,
        name: 'Demo Travel Group',
        description: 'Trip to Europe 2024',
        category: 'travel',
        privacy: 'private',
        currency: 'USD',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        members: [
          {
            id: 'admin_user',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
            joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'member_1',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'member',
            joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'current_user',
            name: 'You',
            email: 'user@example.com',
            role: 'member',
            joinedAt: new Date().toISOString()
          }
        ],
        totalExpenses: 1250.75,
        totalMembers: 3,
        yourShare: 416.92,
        lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      if (onSubmit) {
        onSubmit(mockGroup)
      }
      
      dispatch(addToast({
        type: 'success',
        message: `Successfully joined "${mockGroup.name}"!`
      }))
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to join group. Please check your code/link and try again.'
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
        <h2 className="text-xl font-bold text-gray-900">Join Group</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-gray-400">×</span>
          </button>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'code'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Invite Code
        </button>
        <button
          onClick={() => setActiveTab('link')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'link'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Group Link
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'code' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              name="inviteCode"
              value={formData.inviteCode}
              onChange={handleInputChange}
              placeholder="Enter 6-digit invite code"
              className="input w-full text-center font-mono text-lg tracking-widest"
              maxLength={6}
              pattern="[A-Za-z0-9]{6}"
            />
            <p className="text-xs text-gray-500 mt-2">
              Ask a group member for the 6-digit invite code
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Link
            </label>
            <input
              type="url"
              name="groupLink"
              value={formData.groupLink}
              onChange={handleInputChange}
              placeholder="https://expensiver.com/join/..."
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              Paste the group invitation link you received
            </p>
          </div>
        )}
        
        {/* Example */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800 font-medium mb-1">
            Try Demo Code:
          </p>
          <code className="text-sm font-mono text-blue-700 bg-blue-100 px-2 py-1 rounded">
            {activeTab === 'code' ? 'DEMO01' : 'https://expensiver.com/join/demo-travel-group'}
          </code>
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
            {loading ? 'Joining...' : 'Join Group'}
          </Button>
        </div>
      </form>
      
      {/* Help */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Don't have an invite code or link?{' '}
          <button className="text-primary-600 hover:text-primary-700 font-medium">
            Find public groups
          </button>
        </p>
      </div>
    </motion.div>
  )
}

export default JoinGroupForm