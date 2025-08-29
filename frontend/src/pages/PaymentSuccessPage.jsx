import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/common/Button'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const paymentId = searchParams.get('payment_id')
  const amount = searchParams.get('amount')
  const description = searchParams.get('description')
  const groupId = searchParams.get('group_id')

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timer = setTimeout(() => {
      if (groupId) {
        navigate(`/groups/${groupId}`)
      } else {
        navigate('/dashboard')
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [navigate, groupId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl text-green-600"
          >
            ✅
          </motion.span>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully
          </p>
        </motion.div>

        {/* Payment Details */}
        {(amount || description || paymentId) && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-50 rounded-lg p-4 mb-6 text-left"
          >
            <h3 className="font-medium text-gray-900 mb-3">Payment Details</h3>
            {amount && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-gray-900">₹{amount}</span>
              </div>
            )}
            {description && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium text-gray-900">{description}</span>
              </div>
            )}
            {paymentId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-medium text-gray-900 text-sm">{paymentId}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {groupId ? (
            <Button
              onClick={() => navigate(`/groups/${groupId}`)}
              variant="primary"
              className="w-full"
            >
              Back to Group
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/dashboard')}
              variant="primary"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          )}
          
          <Button
            onClick={() => navigate('/expenses')}
            variant="outline"
            className="w-full"
          >
            View All Expenses
          </Button>
        </motion.div>

        {/* Auto redirect notice */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-gray-500 mt-6"
        >
          You will be automatically redirected in 10 seconds
        </motion.p>
      </motion.div>
    </div>
  )
}

export default PaymentSuccessPage