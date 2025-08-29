import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../common/Button'
import QRCodeGenerator from './QRCodeGenerator'
import UPIAppSelector from './UPIAppSelector'
import PaymentStatus from './PaymentStatus'
import { initiateUPIPayment, checkPaymentStatus } from '../../store/slices/paymentSlice'
import { addToast } from '../../store/slices/uiSlice'

const UPIPayment = ({ 
  amount, 
  recipient, 
  description, 
  onSuccess, 
  onFailure, 
  onClose 
}) => {
  const dispatch = useDispatch()
  const { loading, paymentStatus, paymentId } = useSelector(state => state.payment)
  
  const [paymentMethod, setPaymentMethod] = useState('qr') // 'qr', 'app', 'manual'
  const [selectedApp, setSelectedApp] = useState(null)
  const [upiId, setUpiId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showQR, setShowQR] = useState(false)

  // Popular UPI apps
  const upiApps = [
    { 
      id: 'googlepay', 
      name: 'Google Pay', 
      icon: '🟢',
      scheme: 'tez://upi/pay',
      color: 'bg-green-500'
    },
    { 
      id: 'phonepe', 
      name: 'PhonePe', 
      icon: '🟣',
      scheme: 'phonepe://pay',
      color: 'bg-purple-500'
    },
    { 
      id: 'paytm', 
      name: 'Paytm', 
      icon: '🔵',
      scheme: 'paytmmp://pay',
      color: 'bg-blue-500'
    },
    { 
      id: 'bhim', 
      name: 'BHIM', 
      icon: '🇮🇳',
      scheme: 'bhim://pay',
      color: 'bg-orange-500'
    },
    { 
      id: 'amazonpay', 
      name: 'Amazon Pay', 
      icon: '🟠',
      scheme: 'amazonpay://pay',
      color: 'bg-orange-400'
    }
  ]

  // Generate UPI payment URL
  const generateUPIUrl = (app = null) => {
    const params = new URLSearchParams({
      pa: recipient?.upiId || 'expensiver@upi', // Payee address
      pn: recipient?.name || 'Expensiver', // Payee name
      am: amount.toString(), // Amount
      cu: 'INR', // Currency
      tn: description || 'Payment via Expensiver', // Transaction note
    })

    if (app) {
      return `${app.scheme}?${params.toString()}`
    }
    
    return `upi://pay?${params.toString()}`
  }

  const handlePayment = async (method, app = null) => {
    setIsProcessing(true)
    
    try {
      let paymentUrl = ''
      
      switch (method) {
        case 'qr':
          setShowQR(true)
          break
        case 'app':
          if (app) {
            paymentUrl = generateUPIUrl(app)
            // Attempt to open the UPI app
            window.location.href = paymentUrl
            setSelectedApp(app)
          }
          break
        case 'manual':
          if (upiId) {
            // Create payment with manual UPI ID
            paymentUrl = generateUPIUrl()
            window.location.href = paymentUrl
          } else {
            dispatch(addToast({
              type: 'error',
              message: 'Please enter a valid UPI ID'
            }))
            setIsProcessing(false)
            return
          }
          break
      }

      // Initiate payment tracking
      const paymentData = {
        amount,
        recipient,
        description,
        method,
        app: app?.name,
        upiUrl: paymentUrl
      }

      const result = await dispatch(initiateUPIPayment(paymentData)).unwrap()
      
      // Start polling for payment status
      startPaymentStatusCheck(result.paymentId)
      
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to initiate payment. Please try again.'
      }))
      setIsProcessing(false)
    }
  }

  const startPaymentStatusCheck = (paymentId) => {
    const interval = setInterval(async () => {
      try {
        const status = await dispatch(checkPaymentStatus(paymentId)).unwrap()
        
        if (status.status === 'success') {
          clearInterval(interval)
          setIsProcessing(false)
          onSuccess && onSuccess(status)
          dispatch(addToast({
            type: 'success',
            message: 'Payment completed successfully!'
          }))
        } else if (status.status === 'failed') {
          clearInterval(interval)
          setIsProcessing(false)
          onFailure && onFailure(status)
          dispatch(addToast({
            type: 'error',
            message: 'Payment failed. Please try again.'
          }))
        }
      } catch (error) {
        // Continue polling on error
      }
    }, 3000) // Check every 3 seconds

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval)
      if (isProcessing) {
        setIsProcessing(false)
        dispatch(addToast({
          type: 'warning',
          message: 'Payment status check timeout. Please verify manually.'
        }))
      }
    }, 300000)
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (isProcessing) {
    return (
      <PaymentStatus 
        amount={amount}
        recipient={recipient}
        method={paymentMethod}
        app={selectedApp}
        onCancel={() => {
          setIsProcessing(false)
          onClose && onClose()
        }}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">UPI Payment</h3>
            <p className="text-blue-100 text-sm">Secure & Instant</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              ✕
            </button>
          )}
        </div>
        
        {/* Payment Details */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-blue-100">Amount:</span>
            <span className="text-xl font-bold">{formatAmount(amount)}</span>
          </div>
          {recipient && (
            <div className="flex justify-between items-center">
              <span className="text-blue-100">To:</span>
              <span className="font-medium">{recipient.name}</span>
            </div>
          )}
          {description && (
            <div className="text-blue-100 text-sm">
              {description}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="p-6">
        <div className="space-y-4">
          {/* QR Code Payment */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📱</span>
                <span className="font-medium">Scan QR Code</span>
              </div>
              <Button
                variant={paymentMethod === 'qr' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('qr')}
              >
                {paymentMethod === 'qr' ? 'Selected' : 'Select'}
              </Button>
            </div>
            {paymentMethod === 'qr' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-gray-600">
                  Scan with any UPI app to pay instantly
                </p>
                <Button
                  onClick={() => handlePayment('qr')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  loading={loading}
                >
                  Generate QR Code
                </Button>
              </motion.div>
            )}
          </div>

          {/* UPI App Payment */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📲</span>
                <span className="font-medium">Pay with UPI App</span>
              </div>
              <Button
                variant={paymentMethod === 'app' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('app')}
              >
                {paymentMethod === 'app' ? 'Selected' : 'Select'}
              </Button>
            </div>
            {paymentMethod === 'app' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-gray-600">
                  Choose your preferred UPI app
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {upiApps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handlePayment('app', app)}
                      disabled={loading}
                      className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className={`w-10 h-10 ${app.color} rounded-full flex items-center justify-center text-white text-lg mb-1`}>
                        {app.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Manual UPI ID */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">✏️</span>
                <span className="font-medium">Enter UPI ID</span>
              </div>
              <Button
                variant={paymentMethod === 'manual' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod('manual')}
              >
                {paymentMethod === 'manual' ? 'Selected' : 'Select'}
              </Button>
            </div>
            {paymentMethod === 'manual' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <input
                  type="text"
                  placeholder="Enter UPI ID (e.g., user@paytm)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  onClick={() => handlePayment('manual')}
                  disabled={!upiId.trim() || loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  loading={loading}
                >
                  Pay with UPI ID
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-6 bg-green-50 p-3 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-green-600">🔒</span>
            <div className="text-sm text-green-800">
              <div className="font-medium">Secure Payment</div>
              <div>Your payment is protected by UPI's bank-grade security</div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <QRCodeGenerator
            amount={amount}
            recipient={recipient}
            description={description}
            upiUrl={generateUPIUrl()}
            onClose={() => setShowQR(false)}
            onPaymentComplete={(result) => {
              setShowQR(false)
              setIsProcessing(false)
              onSuccess && onSuccess(result)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default UPIPayment