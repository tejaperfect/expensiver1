import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../common/Button'
import { addToast } from '../../store/slices/uiSlice'

const SharedWallet = ({ group, balances, onAddFunds, onWithdrawFunds, onViewTransactions }) => {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState('balance')
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  const mockBalances = balances || {
    total: 2500.00,
    yourContribution: 800.00,
    yourBalance: -150.00, // negative means you owe
    members: [
      { id: 'current_user', name: 'You', contribution: 800.00, balance: -150.00 },
      { id: 'member_2', name: 'Alice', contribution: 950.00, balance: 200.00 },
      { id: 'member_3', name: 'Bob', contribution: 750.00, balance: -50.00 }
    ]
  }

  const mockTransactions = [
    {
      id: 'tx_1',
      type: 'add_funds',
      amount: 500.00,
      description: 'Adding funds for trip expenses',
      member: 'You',
      date: '2024-01-15T10:30:00Z'
    },
    {
      id: 'tx_2',
      type: 'expense',
      amount: -120.00,
      description: 'Restaurant bill - Group dinner',
      member: 'Alice',
      date: '2024-01-14T19:45:00Z'
    },
    {
      id: 'tx_3',
      type: 'add_funds',
      amount: 300.00,
      description: 'Initial contribution',
      member: 'Bob',
      date: '2024-01-14T15:20:00Z'
    }
  ]

  const handleAddFunds = async (e) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      dispatch(addToast({ type: 'error', message: 'Please enter a valid amount' }))
      return
    }

    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      const transaction = {
        type: 'add_funds',
        amount: parseFloat(amount),
        description: description || 'Added funds to shared wallet',
        member: 'You',
        date: new Date().toISOString()
      }

      dispatch(addToast({
        type: 'success',
        message: `₹${amount} added to shared wallet successfully!`
      }))

      if (onAddFunds) {
        onAddFunds(transaction)
      }

      setAmount('')
      setDescription('')
      setShowAddFunds(false)
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to add funds. Please try again.'
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (e) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      dispatch(addToast({ type: 'error', message: 'Please enter a valid amount' }))
      return
    }

    if (parseFloat(amount) > mockBalances.total) {
      dispatch(addToast({ type: 'error', message: 'Insufficient funds in shared wallet' }))
      return
    }

    setLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      const transaction = {
        type: 'withdraw',
        amount: -parseFloat(amount),
        description: description || 'Withdrawn from shared wallet',
        member: 'You',
        date: new Date().toISOString()
      }

      dispatch(addToast({
        type: 'success',
        message: `₹${amount} withdrawn from shared wallet successfully!`
      }))

      if (onWithdrawFunds) {
        onWithdrawFunds(transaction)
      }

      setAmount('')
      setDescription('')
      setShowWithdraw(false)
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to withdraw funds. Please try again.'
      }))
    } finally {
      setLoading(false)
    }
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'add_funds': return '💰'
      case 'withdraw': return '💸'
      case 'expense': return '🛒'
      default: return '💳'
    }
  }

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-green-600'
    if (balance < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Shared Wallet</h3>
            <p className="text-sm text-gray-500 mt-1">{group?.name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ₹{mockBalances.total.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Total Balance</div>
          </div>
        </div>

        {/* Your Balance Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Your Contribution</div>
              <div className="text-lg font-bold text-blue-600">
                ₹{mockBalances.yourContribution.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Your Balance</div>
              <div className={`text-lg font-bold ${getBalanceColor(mockBalances.yourBalance)}`}>
                {mockBalances.yourBalance >= 0 ? '+' : ''}₹{mockBalances.yourBalance.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">
                {mockBalances.yourBalance > 0 ? 'You are owed' : 'You owe'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('balance')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'balance'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Balances
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'transactions'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'balance' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="primary"
                onClick={() => setShowAddFunds(true)}
                className="w-full"
              >
                💰 Add Funds
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWithdraw(true)}
                className="w-full"
              >
                💸 Withdraw
              </Button>
            </div>

            {/* Member Balances */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Member Balances</h4>
              <div className="space-y-3">
                {mockBalances.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">
                          Contributed: ₹{member.contribution.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${getBalanceColor(member.balance)}`}>
                        {member.balance >= 0 ? '+' : ''}₹{member.balance.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {member.balance > 0 ? 'is owed' : member.balance < 0 ? 'owes' : 'settled'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Recent Transactions</h4>
              {onViewTransactions && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onViewTransactions}
                >
                  View All
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {mockTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.member} • {formatDate(transaction.date)}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Funds to Shared Wallet</h3>
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this for?"
                  className="input w-full"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                >
                  {loading ? 'Adding...' : 'Add Funds'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Withdraw Funds Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Withdraw from Shared Wallet</h3>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                Available Balance: ₹{mockBalances.total.toFixed(2)}
              </div>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  max={mockBalances.total}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this for?"
                  className="input w-full"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                >
                  {loading ? 'Withdrawing...' : 'Withdraw'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SharedWallet