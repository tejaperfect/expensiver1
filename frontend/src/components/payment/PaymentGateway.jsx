import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UPIPayment from './UPIPayment'
import Button from '../common/Button'

const PaymentGateway = ({ 
  amount, 
  recipient, 
  description, 
  isOpen, 
  onClose, 
  onSuccess, 
  onFailure 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('upi')
  const [showPaymentFlow, setShowPaymentFlow] = useState(false)

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Payment',
      description: 'Pay instantly with UPI',
      icon: '📱',
      color: 'from-blue-500 to-blue-600',
      recommended: true,
      features: ['Instant payment', 'No charges', 'Secure & fast']
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Pay with your card',
      icon: '💳',
      color: 'from-purple-500 to-purple-600',
      features: ['All major cards', 'Secure payment', 'Quick checkout']
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      description: 'Pay via your bank',
      icon: '🏦',
      color: 'from-green-500 to-green-600',
      features: ['All major banks', 'Direct bank transfer', 'Secure gateway']
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      description: 'Pay with wallet balance',
      icon: '👝',
      color: 'from-orange-500 to-orange-600',
      features: ['Instant payment', 'No OTP required', 'Cashback offers']
    }
  ]

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId)
    if (methodId === 'upi') {
      setShowPaymentFlow(true)
    } else {
      // For demo, show coming soon for other methods
      alert(`${paymentMethods.find(m => m.id === methodId)?.name} coming soon!`)
    }
  }

  const handlePaymentSuccess = (result) => {
    setShowPaymentFlow(false)
    onSuccess && onSuccess(result)
  }

  const handlePaymentFailure = (error) => {
    setShowPaymentFlow(false)
    onFailure && onFailure(error)
  }

  if (!isOpen) return null

  if (showPaymentFlow && selectedMethod === 'upi') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <UPIPayment
          amount={amount}
          recipient={recipient}
          description={description}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onClose={() => {
            setShowPaymentFlow(false)
            onClose && onClose()
          }}
        />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Choose Payment Method</h3>
              <p className="text-primary-100 text-sm mt-1">
                Pay {formatAmount(amount)} securely
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Payment Details */}
          <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-primary-100">Amount:</span>
              <span className="font-bold text-lg">{formatAmount(amount)}</span>
            </div>
            {recipient && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-primary-100">To:</span>
                <span className="font-medium">{recipient.name}</span>
              </div>
            )}
            {description && (
              <div className="text-primary-100 text-sm mt-2">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <div className="space-y-4">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleMethodSelect(method.id)}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                  selectedMethod === method.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Recommended Badge */}
                {method.recommended && (
                  <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  {/* Method Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${method.color} rounded-xl flex items-center justify-center text-white text-2xl`}>
                    {method.icon}
                  </div>

                  {/* Method Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {method.name}
                      </h4>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedMethod === method.id
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedMethod === method.id && (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">
                      {method.description}
                    </p>
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-1">
                      {method.features.map((feature, featureIndex) => (
                        <span
                          key={featureIndex}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedMethod === method.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-sm">✓</span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Security Info */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <span className="text-green-600 text-xl">🔒</span>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  Secure Payment Gateway
                </h4>
                <p className="text-sm text-gray-600">
                  Your payment information is encrypted and secured with bank-grade security. 
                  We never store your payment details.
                </p>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-6">
            <Button
              onClick={() => handleMethodSelect(selectedMethod)}
              disabled={!selectedMethod}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-lg py-3"
            >
              Continue with {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </Button>
          </div>

          {/* Payment Partners */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">Powered by</p>
            <div className="flex items-center justify-center space-x-4 opacity-60">
              <span className="text-sm font-semibold">RazorPay</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-semibold">Payu</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-semibold">CCAvenue</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PaymentGateway