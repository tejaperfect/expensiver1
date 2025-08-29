import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

const ReceiptViewer = ({ receipts = [], onDelete, className = '' }) => {
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const openLightbox = (receipt) => {
    setSelectedReceipt(receipt)
    setIsLightboxOpen(true)
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setSelectedReceipt(null)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const downloadReceipt = (receipt) => {
    const link = document.createElement('a')
    link.href = receipt.url
    link.download = receipt.filename || 'receipt'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!receipts.length) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <div className="text-4xl mb-2">📄</div>
        <p>No receipts uploaded</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Receipt Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {receipts.map((receipt, index) => (
          <motion.div
            key={receipt.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Receipt Preview */}
            <div
              className="aspect-square bg-gray-50 flex items-center justify-center cursor-pointer"
              onClick={() => openLightbox(receipt)}
            >
              {receipt.type?.startsWith('image/') ? (
                <img
                  src={receipt.url}
                  alt={receipt.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-xs text-gray-500 px-2">
                    {receipt.filename?.split('.').pop()?.toUpperCase() || 'FILE'}
                  </div>
                </div>
              )}
            </div>

            {/* Receipt Info */}
            <div className="p-3">
              <div className="text-sm font-medium text-gray-900 truncate mb-1">
                {receipt.filename || 'Receipt'}
              </div>
              <div className="text-xs text-gray-500">
                {receipt.size ? formatFileSize(receipt.size) : 'Unknown size'}
              </div>
            </div>

            {/* Actions Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openLightbox(receipt)}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  👁️ View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadReceipt(receipt)}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  📥 Download
                </Button>
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(receipt, index)}
                    className="bg-red-500 text-white hover:bg-red-600"
                  >
                    🗑️
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="absolute -top-10 right-0 text-white text-xl hover:text-gray-300 z-10"
              >
                ✕ Close
              </button>

              {/* Receipt Content */}
              <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
                {selectedReceipt.type?.startsWith('image/') ? (
                  <img
                    src={selectedReceipt.url}
                    alt={selectedReceipt.filename}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {selectedReceipt.filename}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {selectedReceipt.size ? formatFileSize(selectedReceipt.size) : 'Unknown size'}
                    </p>
                    <Button
                      onClick={() => downloadReceipt(selectedReceipt)}
                      variant="primary"
                    >
                      📥 Download File
                    </Button>
                  </div>
                )}

                {/* Receipt Actions */}
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedReceipt.filename}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedReceipt.size ? formatFileSize(selectedReceipt.size) : 'Unknown size'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => downloadReceipt(selectedReceipt)}
                    >
                      📥 Download
                    </Button>
                    {onDelete && (
                      <Button
                        variant="danger"
                        onClick={() => {
                          const receiptIndex = receipts.findIndex(r => r.id === selectedReceipt.id)
                          onDelete(selectedReceipt, receiptIndex)
                          closeLightbox()
                        }}
                      >
                        🗑️ Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReceiptViewer