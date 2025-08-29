import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

const FileUpload = ({
  onFileSelect,
  onFileUpload,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  className = '',
  disabled = false,
  showPreview = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [files, setFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    const errors = []
    
    if (maxSize && file.size > maxSize) {
      errors.push(`File size must be less than ${formatFileSize(maxSize)}`)
    }
    
    if (accept && !accept.split(',').some(type => 
      file.type.match(new RegExp(type.replace('*', '.*')))
    )) {
      errors.push(`File type not supported. Accepted types: ${accept}`)
    }
    
    return errors
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles)
    const validFiles = []
    const errors = []

    fileArray.forEach(file => {
      const fileErrors = validateFile(file)
      if (fileErrors.length === 0) {
        validFiles.push({
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          status: 'selected'
        })
      } else {
        errors.push(`${file.name}: ${fileErrors.join(', ')}`)
      }
    })

    if (errors.length > 0) {
      console.error('File validation errors:', errors)
      return { success: false, errors }
    }

    const newFiles = multiple ? [...files, ...validFiles] : validFiles
    setFiles(newFiles)
    
    if (onFileSelect) {
      onFileSelect(multiple ? validFiles : validFiles[0])
    }

    return { success: true, files: validFiles }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }, [disabled, files, multiple])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = (e) => {
    const selectedFiles = e.target.files
    if (selectedFiles.length > 0) {
      handleFileSelect(selectedFiles)
    }
  }

  const uploadFile = async (fileItem) => {
    if (!onFileUpload) return

    setUploadProgress(prev => ({ ...prev, [fileItem.id]: 0 }))
    
    try {
      const result = await onFileUpload(fileItem.file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [fileItem.id]: progress }))
      })
      
      setUploadedFiles(prev => [...prev, { ...fileItem, url: result.url }])
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'uploaded', url: result.url } : f
      ))
      
      return result
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id ? { ...f, status: 'error', error: error.message } : f
      ))
      throw error
    }
  }

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'selected')
    const uploadPromises = pendingFiles.map(uploadFile)
    
    try {
      await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId)
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
    
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileId]
      return newProgress
    })
  }

  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
    setFiles([])
    setUploadProgress({})
    setUploadedFiles([])
  }

  return (
    <div className={`file-upload ${className}`}>
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <div className="text-lg font-medium text-gray-900">
            {isDragOver ? 'Drop files here' : 'Choose files or drag and drop'}
          </div>
          <div className="text-sm text-gray-500">
            {accept.includes('image') ? 'Images only' : 'Supported files'} • Max {formatFileSize(maxSize)}
          </div>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Selected Files</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFiles}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
            
            {files.map((fileItem) => (
              <motion.div
                key={fileItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* File Preview */}
                {showPreview && fileItem.preview && (
                  <img
                    src={fileItem.preview}
                    alt={fileItem.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {fileItem.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(fileItem.size)}
                  </div>
                  
                  {/* Upload Progress */}
                  {uploadProgress[fileItem.id] !== undefined && (
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress[fileItem.id])}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className="bg-primary-600 h-1 rounded-full transition-all"
                          style={{ width: `${uploadProgress[fileItem.id]}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Status */}
                  {fileItem.status === 'uploaded' && (
                    <div className="text-xs text-green-600 mt-1">✓ Uploaded</div>
                  )}
                  {fileItem.status === 'error' && (
                    <div className="text-xs text-red-600 mt-1">✗ {fileItem.error}</div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {fileItem.status === 'selected' && onFileUpload && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => uploadFile(fileItem)}
                    >
                      Upload
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileItem.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </Button>
                </div>
              </motion.div>
            ))}
            
            {/* Upload All Button */}
            {files.some(f => f.status === 'selected') && onFileUpload && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={uploadAllFiles}
                  className="w-full"
                >
                  Upload All Files
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUpload