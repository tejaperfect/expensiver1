import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../common/Button'
import { addToast } from '../../store/slices/uiSlice'

const SettlementTracker = ({ group, settlements, onCreateSettlement, onMarkSettled, onPayNow }) => {
  const dispatch = useDispatch()
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [settlementMethod, setSettlementMethod] = useState('cash')
  const [loading, setLoading] = useState(false)

  // Mock settlements data
  const mockSettlements = settlements || [
    {
      id: 'settlement_1',
      from: 'current_user',
      to: 'member_2',
      amount: 150.00,
      status: 'pending',
      createdAt: '2024-01-15T10:00:00Z',
      description: 'Restaurant bills and shopping'
    },
    {
      id: 'settlement_2',
      from: 'member_3',
      to: 'current_user',
      amount: 75.00,
      status: 'pending',
      createdAt: '2024-01-14T15:30:00Z',
      description: 'Travel expenses split'
    },
    {
      id: 'settlement_3',
      from: 'current_user',
      to: 'member_2',
      amount: 200.00,
      status: 'settled',
      settledAt: '2024-01-13T18:45:00Z',
      method: 'upi',
      description: 'Group dinner and entertainment'
    }
  ]

  // Mock balances calculation
  const mockBalances = [
    {
      fromId: 'current_user',
      toId: 'member_2',
      amount: 150.00,
      description: 'You owe Alice'
    },
    {
      fromId: 'member_3',
      toId: 'current_user',
      amount: 75.00,
      description: 'Bob owes you'
    }
  ]

  const settlementMethods = [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'upi', name: 'UPI/Digital Payment', icon: '📱' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
    { id: 'other', name: 'Other', icon: '💳' }
  ]

  const getMemberName = (memberId) => {
    const member = group?.members?.find(m => m.id === memberId)
    return member ? (member.id === 'current_user' ? 'You' : member.name) : 'Unknown'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCreateSimplifiedSettlements = () => {
    // This would typically call an API to create optimal settlements
    dispatch(addToast({
      type: 'info',
      message: 'Creating simplified settlements...'
    }))

    setTimeout(() => {
      dispatch(addToast({
        type: 'success',
        message: 'Settlements optimized! Check the pending settlements below.'
      }))
    }, 1500)
  }

  const handleMarkSettled = async (settlement) => {
    setSelectedSettlement(settlement)
    setShowSettleModal(true)
  }

  const confirmSettlement = async () => {
    if (!selectedSettlement) return

    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      dispatch(addToast({
        type: 'success',
        message: `Settlement of ₹${selectedSettlement.amount} marked as settled!`
      }))

      if (onMarkSettled) {
        onMarkSettled({
          ...selectedSettlement,
          status: 'settled',
          settledAt: new Date().toISOString(),
          method: settlementMethod
        })
      }

      setShowSettleModal(false)
      setSelectedSettlement(null)
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to mark settlement. Please try again.'
      }))
    } finally {
      setLoading(false)
    }
  }

  const getSettlementColor = (settlement) => {
    if (settlement.status === 'settled') return 'border-green-200 bg-green-50'
    if (settlement.from === 'current_user') return 'border-red-200 bg-red-50'
    return 'border-blue-200 bg-blue-50'
  }

  const getSettlementIcon = (settlement) => {
    if (settlement.status === 'settled') return '✅'
    if (settlement.from === 'current_user') return '📤'
    return '📥'
  }

  const pendingSettlements = mockSettlements.filter(s => s.status === 'pending')
  const settledSettlements = mockSettlements.filter(s => s.status === 'settled')

  const yourOwings = pendingSettlements.filter(s => s.from === 'current_user')
  const owedToYou = pendingSettlements.filter(s => s.to === 'current_user')

  const totalYouOwe = yourOwings.reduce((sum, s) => sum + s.amount, 0)
  const totalOwedToYou = owedToYou.reduce((sum, s) => sum + s.amount, 0)
  const netBalance = totalOwedToYou - totalYouOwe

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">You Owe</div>
          <div className="text-2xl font-bold text-red-600">
            ₹{totalYouOwe.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {yourOwings.length} pending settlements
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">You Are Owed</div>
          <div className="text-2xl font-bold text-green-600">
            ₹{totalOwedToYou.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {owedToYou.length} pending settlements
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-500">Net Balance</div>
          <div className={`text-2xl font-bold ${
            netBalance > 0 ? 'text-green-600' : netBalance < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {netBalance >= 0 ? '+' : ''}₹{netBalance.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {netBalance > 0 ? 'You will receive' : netBalance < 0 ? 'You need to pay' : 'All settled'}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Settlement Actions</h3>
            <p className="text-sm text-gray-500">Manage group debt settlements</p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateSimplifiedSettlements}
          >
            Simplify Debts
          </Button>
        </div>
      </div>

      {/* Pending Settlements */}
      {pendingSettlements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Pending Settlements</h3>
            <p className="text-sm text-gray-500">Settlements waiting to be completed</p>
          </div>
          <div className="p-4 space-y-3">
            {pendingSettlements.map((settlement, index) => (
              <motion.div
                key={settlement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border-2 ${getSettlementColor(settlement)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getSettlementIcon(settlement)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getMemberName(settlement.from)} → {getMemberName(settlement.to)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {settlement.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        Created {formatDate(settlement.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      ₹{settlement.amount.toFixed(2)}
                    </div>
                    {settlement.from === 'current_user' || settlement.to === 'current_user' ? (
                      <div className="space-y-2">
                        {settlement.from === 'current_user' && onPayNow && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onPayNow(settlement)}
                            className="w-full"
                          >
                            💳 Pay Now
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkSettled(settlement)}
                          className="w-full"
                        >
                          Mark as Settled
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 mt-2">
                        Between others
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Settled Settlements */}
      {settledSettlements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Recent Settlements</h3>
            <p className="text-sm text-gray-500">Completed settlements history</p>
          </div>
          <div className="p-4 space-y-3">
            {settledSettlements.slice(0, 3).map((settlement, index) => (
              <motion.div
                key={settlement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${getSettlementColor(settlement)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getSettlementIcon(settlement)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {getMemberName(settlement.from)} → {getMemberName(settlement.to)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {settlement.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        Settled {formatDate(settlement.settledAt)} via {settlement.method?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">
                      ₹{settlement.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Settled
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No Settlements State */}
      {pendingSettlements.length === 0 && settledSettlements.length === 0 && (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
          <div className="text-gray-400 text-4xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Settlements Yet</h3>
          <p className="text-gray-500">
            Add some group expenses first, then settlements will appear here automatically.
          </p>
        </div>
      )}

      {/* Settlement Confirmation Modal */}
      {showSettleModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Mark Settlement as Settled</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Settlement Details:</div>
              <div className="font-medium text-gray-900">
                {getMemberName(selectedSettlement.from)} → {getMemberName(selectedSettlement.to)}
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                ₹{selectedSettlement.amount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {selectedSettlement.description}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Settlement Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                {settlementMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSettlementMethod(method.id)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      settlementMethod === method.id
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-1">{method.icon}</div>
                    <div>{method.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSettleModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                loading={loading}
                onClick={confirmSettlement}
                className="flex-1"
              >
                {loading ? 'Confirming...' : 'Confirm Settlement'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SettlementTracker