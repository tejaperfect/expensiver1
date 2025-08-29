import { api } from './api'

export const uploadService = {
  // Upload expense receipt
  async uploadExpenseReceipt(file, expenseId, onProgress) {
    const formData = new FormData()
    formData.append('receipt', file)
    if (expenseId) {
      formData.append('expenseId', expenseId)
    }

    const response = await api.post('/expenses/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  // Upload user avatar
  async uploadAvatar(file, onProgress) {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await api.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  // Upload group avatar
  async uploadGroupAvatar(file, groupId, onProgress) {
    const formData = new FormData()
    formData.append('avatar', file)
    formData.append('groupId', groupId)

    const response = await api.post('/groups/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  // Upload multiple files
  async uploadMultipleFiles(files, endpoint, onProgress) {
    const formData = new FormData()
    
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file)
    })

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      },
    })

    return response.data
  },

  // Delete uploaded file
  async deleteFile(fileId, type = 'receipt') {
    const response = await api.delete(`/uploads/${type}/${fileId}`)
    return response.data
  },

  // Get file details
  async getFileDetails(fileId) {
    const response = await api.get(`/uploads/details/${fileId}`)
    return response.data
  },

  // Download file
  async downloadFile(fileId, filename) {
    const response = await api.get(`/uploads/download/${fileId}`, {
      responseType: 'blob',
    })

    // Create download link
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return response.data
  },

  // Validate file before upload
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    } = options

    const errors = []

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // Get upload progress for multiple files
  createProgressTracker() {
    const progressMap = new Map()

    return {
      setProgress: (fileId, progress) => {
        progressMap.set(fileId, progress)
      },
      getProgress: (fileId) => {
        return progressMap.get(fileId) || 0
      },
      getAllProgress: () => {
        return Object.fromEntries(progressMap)
      },
      clear: () => {
        progressMap.clear()
      },
    }
  },
}

export default uploadService