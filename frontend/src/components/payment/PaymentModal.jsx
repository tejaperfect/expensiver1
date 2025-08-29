import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PaymentComponent from './PaymentComponent'

const PaymentModal = ({
  isOpen,
  onClose,
  amount,
  description,
  onSuccess,
  onFailure,
  groupId = null,
  expenseId = null,
  title = 'Make Payment'
}) => {
  const handleSuccess = (paymentData) => {
    if (onSuccess) {
      onSuccess(paymentData)
    }
    onClose()
  }

  const handleFailure = (error) => {
    if (onFailure) {
      onFailure(error)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Payment Component */}
            <div className="p-6">
              <PaymentComponent
                amount={amount}
                description={description}
                onSuccess={handleSuccess}
                onFailure={handleFailure}
                onCancel={handleCancel}
                groupId={groupId}
                expenseId={expenseId}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PaymentModal