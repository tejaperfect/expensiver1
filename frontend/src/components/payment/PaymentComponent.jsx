import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../common/Button'
import LoadingSpinner from '../common/LoadingSpinner'
import { paymentService } from '../../services/paymentService'
import { addToast } from '../../store/slices/uiSlice'

const PaymentComponent = ({
  amount,
  description,
  onSuccess,
  onFailure,
  onCancel,
  groupId = null,
  expenseId = null,
  className = ''
}) => {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const [activeMethod, setActiveMethod] = useState('razorpay')
  const [loading, setLoading] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [razorpayKey, setRazorpayKey] = useState(null)

  useEffect(() => {
    // Load Razorpay key on component mount
    loadRazorpayKey()
    
    // Load Razorpay script
    if (!window.Razorpay) {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)
    }
  }, [])

  const loadRazorpayKey = async () => {
    try {
      const response = await paymentService.getRazorpayKey()
      setRazorpayKey(response.key)
    } catch (error) {
      console.error('Failed to load Razorpay key:', error)
    }
  }

  const handleRazorpayPayment = async () => {
    if (!window.Razorpay) {
      dispatch(addToast({
        type: 'error',
        message: 'Razorpay SDK not loaded. Please try again.'
      }))
      return
    }

    setLoading(true)
    try {
      // Create order
      const orderResponse = await paymentService.createRazorpayOrder({
        amount: amount * 100, // Convert to paisa
        currency: 'INR',
        description,
        groupId,
        expenseId
      })

      const options = {
        key: razorpayKey,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: 'Expensiver',
        description: description,
        order_id: orderResponse.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verificationResponse = await paymentService.verifyRazorpayPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              groupId,
              expenseId
            })

            dispatch(addToast({
              type: 'success',
              message: 'Payment successful!'
            }))

            if (onSuccess) {
              onSuccess(verificationResponse)
            }
          } catch (error) {
            dispatch(addToast({
              type: 'error',
              message: 'Payment verification failed'
            }))
            if (onFailure) {
              onFailure(error)
            }
          }
        },
        prefill: {
          name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            if (onCancel) {
              onCancel()
            }
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to initialize payment'
      }))
      if (onFailure) {
        onFailure(error)
      }
    } finally {
      setLoading(false)
    }
  }

  const generateUPIQR = async () => {
    setLoading(true)
    try {
      const response = await paymentService.generateUPIQR({
        amount,
        description,
        groupId,
        expenseId
      })
      setQrCode(response.qrCode)
      
      dispatch(addToast({
        type: 'success',
        message: 'UPI QR code generated successfully'
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to generate UPI QR code'
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleUPIPayment = async () => {
    if (!paymentService.validateUPIId(upiId)) {
      dispatch(addToast({
        type: 'error',
        message: 'Please enter a valid UPI ID'
      }))
      return
    }

    setLoading(true)
    try {
      const response = await paymentService.createUPIPaymentLink({
        amount,
        description,
        upiId,
        groupId,
        expenseId
      })

      // Open UPI app
      window.open(response.paymentLink, '_blank')
      
      dispatch(addToast({
        type: 'info',
        message: 'UPI payment link opened. Complete payment in your UPI app.'
      }))

      // Start payment verification polling
      pollPaymentStatus(response.transactionId)
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to create UPI payment'
      }))
      if (onFailure) {
        onFailure(error)
      }
    } finally {
      setLoading(false)
    }
  }

  const pollPaymentStatus = async (transactionId) => {
    let attempts = 0
    const maxAttempts = 30 // 5 minutes with 10 second intervals

    const checkStatus = async () => {
      try {
        const response = await paymentService.verifyUPIPayment(transactionId)
        
        if (response.status === 'SUCCESS') {
          dispatch(addToast({
            type: 'success',
            message: 'UPI payment successful!'
          }))
          if (onSuccess) {
            onSuccess(response)
          }
          return
        }

        if (response.status === 'FAILED') {
          dispatch(addToast({
            type: 'error',
            message: 'UPI payment failed'
          }))
          if (onFailure) {
            onFailure(new Error('Payment failed'))
          }
          return
        }

        // Continue polling if status is PENDING
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000) // Check every 10 seconds
        } else {
          dispatch(addToast({
            type: 'warning',
            message: 'Payment status check timed out. Please verify manually.'
          }))
        }
      } catch (error) {
        console.error('Payment status check failed:', error)
      }
    }

    setTimeout(checkStatus, 5000) // Start checking after 5 seconds
  }

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Card/Netbanking',
      icon: '💳',
      description: 'Pay with Credit/Debit Card, Netbanking, Wallets'
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: '📱',
      description: 'Pay with UPI ID or scan QR code'
    }
  ]

  return (
    <div className={`payment-component ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
        
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Amount:</span>
            <span className="text-xl font-bold text-gray-900">
              {paymentService.formatAmount(amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Description:</span>
            <span className="text-gray-900">{description}</span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <motion.button
                key={method.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition-colors text-left ${
                  activeMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{method.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-500">{method.description}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Payment Method Specific UI */}
        <AnimatePresence mode="wait">
          {activeMethod === 'razorpay' && (
            <motion.div
              key="razorpay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Secure Payment with Razorpay</h5>
                <p className="text-sm text-blue-700">
                  Your payment is secured with 256-bit SSL encryption. We support all major cards, 
                  netbanking, and digital wallets.
                </p>
              </div>
              
              <Button
                onClick={handleRazorpayPayment}
                disabled={loading || !razorpayKey}
                variant="primary"
                className="w-full"
                loading={loading}
              >
                {loading ? 'Processing...' : `Pay ${paymentService.formatAmount(amount)}`}
              </Button>
            </motion.div>
          )}

          {activeMethod === 'upi' && (
            <motion.div
              key="upi"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* UPI ID Payment */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Pay with UPI ID</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <Button
                      onClick={handleUPIPayment}
                      disabled={loading || !upiId}
                      variant="primary"
                      className="w-full"
                      loading={loading}
                    >
                      Pay with UPI
                    </Button>
                  </div>
                </div>

                {/* QR Code Payment */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Scan QR Code</h5>
                  <div className="text-center">
                    {qrCode ? (
                      <div className="space-y-3">
                        <img
                          src={qrCode}
                          alt="UPI QR Code"
                          className="w-32 h-32 mx-auto border border-gray-200 rounded"
                        />
                        <p className="text-sm text-gray-600">
                          Scan with any UPI app to pay
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-32 h-32 mx-auto bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="text-4xl text-gray-400">📱</span>
                        </div>
                        <Button
                          onClick={generateUPIQR}
                          disabled={loading}
                          variant="outline"
                          className="w-full"
                          loading={loading}
                        >
                          Generate QR Code
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full"
          >
            Cancel Payment
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentComponent