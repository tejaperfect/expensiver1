import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import FormInput from '../common/FormInput'
import Button from '../common/Button'
import FileUpload from '../common/FileUpload'
import { addExpense, updateExpense } from '../../store/slices/expenseSlice'
import { closeModal } from '../../store/slices/uiSlice'
import { uploadService } from '../../services/uploadService'
import toast from 'react-hot-toast'

const ExpenseForm = ({ expense = null, isEditing = false }) => {
  const dispatch = useDispatch()
  const { categories, isLoading } = useSelector((state) => state.expense)
  const { modals } = useSelector((state) => state.ui)
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    receipts: [],
    tags: [],
    notes: ''
  })
  
  const [formErrors, setFormErrors] = useState({})
  const [tagInput, setTagInput] = useState('')
  const [uploadedReceipts, setUploadedReceipts] = useState([])
  
  // Populate form if editing
  useEffect(() => {
    if (isEditing && expense) {
      setFormData({
        amount: expense.amount.toString(),
        description: expense.description,
        category: expense.category,
        date: expense.date.split('T')[0],
        receipts: expense.receipts || [],
        tags: expense.tags || [],
        notes: expense.notes || ''
      })
      setUploadedReceipts(expense.receipts || [])
    }
  }, [isEditing, expense])
  
  const handleChange = (e) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear field error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }
  
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }
  
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }
  
  const handleFileSelect = (files) => {
    // Handle file selection for preview
    console.log('Files selected:', files)
  }
  
  const handleFileUpload = async (file, onProgress) => {
    try {
      const result = await uploadService.uploadExpenseReceipt(file, null, onProgress)
      
      const receiptData = {
        id: result.id,
        filename: result.filename,
        url: result.url,
        size: file.size,
        type: file.type
      }
      
      setUploadedReceipts(prev => [...prev, receiptData])
      setFormData(prev => ({
        ...prev,
        receipts: [...prev.receipts, receiptData]
      }))
      
      toast.success('Receipt uploaded successfully!')
      return result
    } catch (error) {
      toast.error('Failed to upload receipt')
      throw error
    }
  }
  
  const validateForm = () => {
    const errors = {}
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount'
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    }
    
    if (!formData.category) {
      errors.category = 'Please select a category'
    }
    
    if (!formData.date) {
      errors.date = 'Date is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }
    
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        id: isEditing ? expense.id : Date.now(),
        createdAt: isEditing ? expense.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      if (isEditing) {
        dispatch(updateExpense(expenseData))
        toast.success('Expense updated successfully!')
      } else {
        dispatch(addExpense(expenseData))
        toast.success('Expense added successfully!')
      }
      
      dispatch(closeModal('addExpense'))
      dispatch(closeModal('editExpense'))
    } catch (error) {
      toast.error('Failed to save expense')
    }
  }
  
  const handleCancel = () => {
    dispatch(closeModal('addExpense'))
    dispatch(closeModal('editExpense'))
  }
  
  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Amount Field */}
      <FormInput
        label="Amount"
        type="number"
        name="amount"
        value={formData.amount}
        onChange={handleChange}
        error={formErrors.amount}
        placeholder="0.00"
        required
        icon="💰"
        step="0.01"
        min="0"
      />
      
      {/* Description Field */}
      <FormInput
        label="Description"
        type="text"
        name="description"
        value={formData.description}
        onChange={handleChange}
        error={formErrors.description}
        placeholder="What did you spend on?"
        required
        icon="📝"
      />
      
      {/* Category Field */}
      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">🏷️</span>
          </div>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`input pl-10 ${formErrors.category ? 'input-error' : ''}`}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        {formErrors.category && (
          <p className="text-sm text-red-600">{formErrors.category}</p>
        )}
      </div>
      
      {/* Date Field */}
      <FormInput
        label="Date"
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        error={formErrors.date}
        required
        icon="📅"
      />
      
      {/* Tags Field */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Add a tag"
            className="input flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleAddTag}
          >
            Add
          </Button>
        </div>
        
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Receipt Upload */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Receipt Upload (Optional)
        </label>
        <FileUpload
          onFileSelect={handleFileSelect}
          onFileUpload={handleFileUpload}
          accept="image/*,application/pdf"
          maxSize={5 * 1024 * 1024} // 5MB
          multiple={true}
          showPreview={true}
          className="w-full"
        />
        
        {/* Display uploaded receipts */}
        {uploadedReceipts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Receipts:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {uploadedReceipts.map((receipt, index) => (
                <div key={receipt.id || index} className="relative">
                  {receipt.type?.startsWith('image/') ? (
                    <img
                      src={receipt.url}
                      alt={receipt.filename}
                      className="w-full h-24 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded border">
                      <span className="text-2xl">📄</span>
                    </div>
                  )}
                  <div className="absolute top-1 right-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedReceipts(prev => prev.filter((_, i) => i !== index))
                        setFormData(prev => ({
                          ...prev,
                          receipts: prev.receipts.filter((_, i) => i !== index)
                        }))
                      }}
                      className="w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {receipt.filename}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Notes Field */}
      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes..."
          rows={3}
          className="input"
        />
      </div>
      
      {/* Form Actions */}
      <div className="flex space-x-3 pt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="flex-1"
        >
          {isEditing ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </motion.form>
  )
}

export default ExpenseForm