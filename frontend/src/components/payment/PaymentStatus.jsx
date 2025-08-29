import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../common/Button'

const PaymentStatus = ({ 
  amount, 
  recipient, 
  method, 
  app, 
  status = 'processing', 
  onCancel, 
  onRetry, 
  onComplete 
}) => {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  // Status progression for demo
  const statusSteps = [
    { key: 'initiated', label: 'Payment Initiated', icon: '🚀' },
    { key: 'processing', label: 'Processing...', icon: '⏳' },
    { key: 'verifying', label: 'Verifying Payment', icon: '🔍' },
    { key: 'success', label: 'Payment Successful', icon: '✅' },
  ]

  const errorSteps = [
    { key: 'initiated', label: 'Payment Initiated', icon: '🚀' },
    { key: 'processing', label: 'Processing...', icon: '⏳' },
    { key: 'failed', label: 'Payment Failed', icon: '❌' },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Update status message based on current status
    const messages = {
      initiated: 'Starting your payment...',
      processing: 'Please complete the payment in your UPI app',
      verifying: 'Confirming payment with your bank...',
      success: 'Payment completed successfully!',
      failed: 'Payment could not be processed',
      timeout: 'Payment verification timed out'
    }
    
    setStatusMessage(messages[currentStatus] || 'Processing payment...')
  }, [currentStatus])

  // Simulate payment status progression (for demo)
  useEffect(() => {
    if (currentStatus === 'processing') {
      const progressTimer = setTimeout(() => {
        // Simulate random success/failure for demo
        if (Math.random() > 0.3) {
          setCurrentStatus('verifying')
          setTimeout(() => {
            setCurrentStatus('success')
            onComplete && onComplete({ status: 'success', amount, recipient })
          }, 2000)
        } else {
          setCurrentStatus('failed')
        }
      }, 5000)

      return () => clearTimeout(progressTimer)
    }
  }, [currentStatus, amount, recipient, onComplete])

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentStepIndex = () => {
    const steps = currentStatus === 'failed' ? errorSteps : statusSteps
    return steps.findIndex(step => step.key === currentStatus)
  }

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'success': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'timeout': return 'text-orange-600'
      default: return 'text-blue-600'
    }
  }

  const getBackgroundGradient = () => {
    switch (currentStatus) {
      case 'success': return 'from-green-500 to-green-600'
      case 'failed': return 'from-red-500 to-red-600'
      case 'timeout': return 'from-orange-500 to-orange-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${getBackgroundGradient()} text-white p-6 rounded-t-xl`}>
        <div className="text-center">
          <div className="text-4xl mb-2">
            {currentStatus === 'success' ? '🎉' : 
             currentStatus === 'failed' ? '😔' : 
             currentStatus === 'timeout' ? '⏰' : '💳'}
          </div>
          <h3 className="text-lg font-bold">Payment Status</h3>
          <p className="text-blue-100 text-sm">
            {formatAmount(amount)} to {recipient?.name || 'Recipient'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Payment Method Info */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-lg">
            {app && (
              <div className={`w-8 h-8 ${app.color} rounded-full flex items-center justify-center text-white`}>
                {app.icon}
              </div>
            )}
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {method === 'qr' ? 'QR Code Payment' : 
                 method === 'app' ? `${app?.name} Payment` : 
                 'UPI Payment'}
              </div>
              <div className="text-gray-500">
                {timeElapsed > 0 && `${formatTime(timeElapsed)} elapsed`}
              </div>
            </div>
          </div>
        </div>

        {/* Status Steps */}
        <div className="mb-6">
          <div className="space-y-4">
            {(currentStatus === 'failed' ? errorSteps : statusSteps).map((step, index) => {
              const currentIndex = getCurrentStepIndex()
              const isActive = index <= currentIndex
              const isCurrent = index === currentIndex
              
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-3 ${
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isActive 
                      ? currentStatus === 'failed' && step.key === 'failed'
                        ? 'bg-red-100 text-red-600'
                        : currentStatus === 'success' && step.key === 'success'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCurrent && ['processing', 'verifying'].includes(currentStatus) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${isCurrent ? 'text-gray-900' : ''}`}>
                      {step.label}
                    </div>
                    {isCurrent && (
                      <div className="text-sm text-gray-500 mt-1">
                        {statusMessage}
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className={`text-lg ${getStatusColor()}`}>
                      {step.key === 'success' ? '✅' : 
                       step.key === 'failed' ? '❌' : 
                       isCurrent ? '⏳' : '✅'}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Status-specific content */}
        <AnimatePresence mode="wait">
          {currentStatus === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-blue-50 p-4 rounded-lg mb-6 text-center"
            >
              <div className="text-blue-800 font-medium mb-2">
                Complete payment in your UPI app
              </div>
              <div className="text-blue-600 text-sm">
                {app ? `Open ${app.name} to authorize the payment` : 'Use your UPI app to complete the transaction'}
              </div>
            </motion.div>
          )}

          {currentStatus === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-green-50 p-4 rounded-lg mb-6 text-center"
            >
              <div className="text-green-800 font-medium mb-2">
                🎉 Payment Successful!
              </div>
              <div className="text-green-600 text-sm">
                Your payment of {formatAmount(amount)} has been processed successfully
              </div>
            </motion.div>
          )}

          {currentStatus === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-red-50 p-4 rounded-lg mb-6 text-center"
            >
              <div className="text-red-800 font-medium mb-2">
                Payment Failed
              </div>
              <div className="text-red-600 text-sm">
                The payment could not be completed. Please try again or use a different payment method.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="space-y-3">
          {currentStatus === 'success' && (
            <Button
              onClick={onComplete}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              ✅ Continue
            </Button>
          )}

          {currentStatus === 'failed' && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={onRetry}
              >
                🔄 Try Again
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          )}

          {['processing', 'verifying'].includes(currentStatus) && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Cancel Payment
            </Button>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <details className="text-sm">
            <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
              Need help?
            </summary>
            <div className="mt-2 text-gray-600 text-left">
              <div className="space-y-2">
                <div>• Ensure you have sufficient balance</div>
                <div>• Check your internet connection</div>
                <div>• Verify UPI PIN is correct</div>
                <div>• Contact your bank if issues persist</div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </motion.div>
  )
}

export default PaymentStatus