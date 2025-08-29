import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../common/Button'
import { addToast } from '../../store/slices/uiSlice'

const GroupExpenseForm = ({ group, onClose, onExpenseAdded }) => {
  const dispatch = useDispatch()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'food',
    paidBy: 'current_user',
    splitType: 'equal',
    selectedMembers: group?.members?.map(m => m.id) || [],
    customSplits: {},
    date: new Date().toISOString().split('T')[0],
    receipt: null
  })
  const [loading, setLoading] = useState(false)

  const categories = [
    { id: 'food', name: 'Food & Dining', icon: '🍕' },
    { id: 'transport', name: 'Transport', icon: '🚗' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
    { id: 'shopping', name: 'Shopping', icon: '🛍️' },
    { id: 'bills', name: 'Bills & Utilities', icon: '📄' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'health', name: 'Health & Medical', icon: '🏥' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'other', name: 'Other', icon: '📊' }
  ]

  const splitTypes = [
    { id: 'equal', name: 'Split Equally', description: 'Divide amount equally among selected members' },
    { id: 'exact', name: 'Exact Amounts', description: 'Enter specific amount for each member' },
    { id: 'percentage', name: 'Percentage', description: 'Split by percentage for each member' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleMemberToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }))
  }

  const handleCustomSplitChange = (memberId, value) => {
    setFormData(prev => ({
      ...prev,
      customSplits: {
        ...prev.customSplits,
        [memberId]: parseFloat(value) || 0
      }
    }))
  }

  const calculateSplit = () => {
    const amount = parseFloat(formData.amount) || 0
    const selectedCount = formData.selectedMembers.length

    if (formData.splitType === 'equal') {
      return amount / selectedCount
    } else if (formData.splitType === 'exact') {
      return Object.values(formData.customSplits).reduce((sum, val) => sum + val, 0)
    } else if (formData.splitType === 'percentage') {
      const totalPercentage = Object.values(formData.customSplits).reduce((sum, val) => sum + val, 0)
      return totalPercentage
    }
    return 0
  }

  const validateForm = () => {
    if (!formData.description.trim()) {
      dispatch(addToast({ type: 'error', message: 'Please enter a description' }))
      return false
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      dispatch(addToast({ type: 'error', message: 'Please enter a valid amount' }))
      return false
    }
    
    if (formData.selectedMembers.length === 0) {
      dispatch(addToast({ type: 'error', message: 'Please select at least one member' }))
      return false
    }

    if (formData.splitType === 'exact') {
      const totalSplit = calculateSplit()
      const amount = parseFloat(formData.amount)
      if (Math.abs(totalSplit - amount) > 0.01) {
        dispatch(addToast({ type: 'error', message: 'Split amounts must equal the total amount' }))
        return false
      }
    }

    if (formData.splitType === 'percentage') {
      const totalPercentage = calculateSplit()
      if (Math.abs(totalPercentage - 100) > 0.01) {
        dispatch(addToast({ type: 'error', message: 'Percentages must total 100%' }))
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      const newExpense = {
        id: `expense_${Date.now()}`,
        ...formData,
        groupId: group.id,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }

      dispatch(addToast({
        type: 'success',
        message: 'Group expense added successfully!'
      }))

      if (onExpenseAdded) {
        onExpenseAdded(newExpense)
      }

      if (onClose) {
        onClose()
      }
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to add expense. Please try again.'
      }))
    } finally {
      setLoading(false)
    }
  }

  const getSelectedCategory = () => {
    return categories.find(cat => cat.id === formData.category)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-auto max-h-[90vh] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Add Group Expense</h2>
          <p className="text-sm text-gray-500 mt-1">{group?.name}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-gray-400">×</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="What did you spend on?"
                className="input w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount * (₹)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      formData.category === category.id
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{category.icon}</div>
                    <div className="text-xs">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paid By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid By
              </label>
              <select
                name="paidBy"
                value={formData.paidBy}
                onChange={handleInputChange}
                className="input w-full"
              >
                {group?.members?.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.id === 'current_user' ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Configuration */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Split Configuration</h3>
            
            {/* Split Type */}
            <div className="space-y-3 mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Split Type
              </label>
              {splitTypes.map((type) => (
                <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="splitType"
                    value={type.id}
                    checked={formData.splitType === type.id}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{type.name}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Member Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Split Between ({formData.selectedMembers.length} members)
              </label>
              <div className="space-y-2">
                {group?.members?.map(member => {
                  const isSelected = formData.selectedMembers.includes(member.id)
                  const splitAmount = formData.splitType === 'equal' && isSelected
                    ? (parseFloat(formData.amount) || 0) / formData.selectedMembers.length
                    : 0

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleMemberToggle(member.id)}
                          className="rounded"
                        />
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-700">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            {member.name} {member.id === 'current_user' ? '(You)' : ''}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          {formData.splitType === 'equal' && (
                            <span className="text-sm text-gray-600">
                              ₹{splitAmount.toFixed(2)}
                            </span>
                          )}
                          
                          {formData.splitType === 'exact' && (
                            <div className="flex items-center space-x-1">
                              <span className="text-sm text-gray-600">₹</span>
                              <input
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                value={formData.customSplits[member.id] || ''}
                                onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                          )}
                          
                          {formData.splitType === 'percentage' && (
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                placeholder="0"
                                step="0.1"
                                min="0"
                                max="100"
                                value={formData.customSplits[member.id] || ''}
                                onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-600">%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Split Summary */}
            {formData.splitType !== 'equal' && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-900">
                  Split Summary:
                </div>
                <div className="text-sm text-blue-700">
                  {formData.splitType === 'exact' && (
                    <>Total: ₹{calculateSplit().toFixed(2)} / ₹{formData.amount || 0}</>
                  )}
                  {formData.splitType === 'percentage' && (
                    <>Total: {calculateSplit().toFixed(1)}% / 100%</>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="flex-1"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  )
}

export default GroupExpenseForm