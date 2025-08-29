import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../components/common/Button'
import GroupExpenseForm from '../components/groupExpense/GroupExpenseForm'
import GroupExpenseList from '../components/groupExpense/GroupExpenseList'
import SharedWallet from '../components/groupExpense/SharedWallet'
import SettlementTracker from '../components/groupExpense/SettlementTracker'
import GroupMemberManagement from '../components/groups/GroupMemberManagement'
import ChatInterface from '../components/chat/ChatInterface'
import PaymentModal from '../components/payment/PaymentModal'
import { 
  fetchGroupExpenses, 
  addGroupExpense, 
  settleExpense, 
  setCurrentGroup 
} from '../store/slices/groupSlice'
import { addToast } from '../store/slices/uiSlice'

const GroupDetailPage = () => {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { groups, groupExpenses, expenseLoading, addExpenseLoading } = useSelector(state => state.groups)
  const [activeTab, setActiveTab] = useState('expenses')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showMemberManagement, setShowMemberManagement] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState(null)
  
  // Find current group
  const currentGroup = groups.find(group => group.id === groupId)
  const expenses = groupExpenses[groupId] || []

  useEffect(() => {
    if (!currentGroup) {
      navigate('/groups')
      return
    }

    dispatch(setCurrentGroup(currentGroup))
    dispatch(fetchGroupExpenses(groupId))

    return () => {
      dispatch(setCurrentGroup(null))
    }
  }, [dispatch, currentGroup, groupId, navigate])

  const handleAddExpense = async (expenseData) => {
    try {
      await dispatch(addGroupExpense({ groupId, expenseData })).unwrap()
      setShowExpenseForm(false)
    } catch (error) {
      // Error is handled in the slice
    }
  }

  const handleExpenseClick = (expense) => {
    // Navigate to expense detail or show expense modal
    console.log('Expense clicked:', expense)
  }

  const handleSettleUp = () => {
    setActiveTab('settlements')
  }

  const handleMarkSettled = async (settlement) => {
    try {
      await dispatch(settleExpense({
        groupId,
        expenseId: settlement.expenseId,
        settlementData: settlement
      })).unwrap()
      
      dispatch(addToast({
        type: 'success',
        message: 'Settlement marked as completed!'
      }))
    } catch (error) {
      // Error is handled in the slice
    }
  }

  const handlePaymentRequest = (settlement) => {
    setPaymentData({
      amount: settlement.amount,
      description: `Settlement for ${settlement.description || 'group expense'}`,
      groupId: groupId,
      expenseId: settlement.expenseId,
      recipientId: settlement.recipientId
    })
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (paymentResponse) => {
    dispatch(addToast({
      type: 'success',
      message: 'Payment completed successfully!'
    }))
    
    // Mark settlement as paid
    if (paymentData) {
      handleMarkSettled({
        expenseId: paymentData.expenseId,
        amount: paymentData.amount,
        paymentId: paymentResponse.id,
        status: 'paid'
      })
    }
    
    setPaymentData(null)
  }

  const handlePaymentFailure = (error) => {
    dispatch(addToast({
      type: 'error',
      message: 'Payment failed. Please try again.'
    }))
    console.error('Payment failed:', error)
  }

  const tabs = [
    { id: 'expenses', name: 'Expenses', icon: '💰' },
    { id: 'wallet', name: 'Shared Wallet', icon: '👝' },
    { id: 'settlements', name: 'Settlements', icon: '🤝' },
    { id: 'members', name: 'Members', icon: '👥' }
  ]

  const getCurrentUserRole = () => {
    const currentUser = currentGroup?.members?.find(m => m.id === 'current_user')
    return currentUser?.role || 'member'
  }

  const getGroupStats = () => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    const yourExpenses = expenses.filter(exp => exp.paidBy === 'current_user')
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
    const pendingCount = expenses.filter(exp => exp.status === 'pending').length
    
    return {
      totalExpenses,
      yourExpenses,
      pendingCount,
      totalCount: expenses.length
    }
  }

  if (!currentGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-500 mb-4">The group you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/groups')}>
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  const stats = getGroupStats()

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => navigate('/groups')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to Groups
              </button>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentGroup.name}</h1>
            <p className="text-gray-600 mb-4">{currentGroup.description}</p>
            
            {/* Group Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Expenses</div>
                <div className="text-lg font-bold text-gray-900">
                  ₹{stats.totalExpenses.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Your Expenses</div>
                <div className="text-lg font-bold text-blue-600">
                  ₹{stats.yourExpenses.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Total Count</div>
                <div className="text-lg font-bold text-gray-900">
                  {stats.totalCount}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">Pending</div>
                <div className="text-lg font-bold text-orange-600">
                  {stats.pendingCount}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowChat(true)}
            >
              💬 Chat
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowMemberManagement(true)}
            >
              👥 Manage Members
            </Button>
            <Button
              variant="primary"
              onClick={() => setShowExpenseForm(true)}
            >
              + Add Expense
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'expenses' && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {expenseLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading expenses...</p>
                  </div>
                </div>
              ) : (
                <GroupExpenseList
                  expenses={expenses}
                  group={currentGroup}
                  onExpenseClick={handleExpenseClick}
                  onSettleUp={handleSettleUp}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SharedWallet
                group={currentGroup}
                onAddFunds={(transaction) => console.log('Add funds:', transaction)}
                onWithdrawFunds={(transaction) => console.log('Withdraw funds:', transaction)}
                onViewTransactions={() => console.log('View all transactions')}
              />
            </motion.div>
          )}

          {activeTab === 'settlements' && (
            <motion.div
              key="settlements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SettlementTracker
                group={currentGroup}
                onCreateSettlement={(settlement) => console.log('Create settlement:', settlement)}
                onMarkSettled={handleMarkSettled}
                onPayNow={handlePaymentRequest}
              />
            </motion.div>
          )}

          {activeTab === 'members' && (
            <motion.div
              key="members"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Group Members</h3>
                  <div className="text-sm text-gray-500">
                    {currentGroup.members.length} members
                  </div>
                </div>

                <div className="grid gap-4">
                  {currentGroup.members.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="font-medium text-primary-700">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              member.role === 'admin'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Role: {member.role}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {getCurrentUserRole() === 'admin' && (
                  <div className="pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => setShowMemberManagement(true)}
                      className="w-full"
                    >
                      Manage Members & Invitations
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GroupExpenseForm
            group={currentGroup}
            onClose={() => setShowExpenseForm(false)}
            onExpenseAdded={handleAddExpense}
          />
        </div>
      )}

      {/* Member Management Modal */}
      {showMemberManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <GroupMemberManagement
            group={currentGroup}
            onClose={() => setShowMemberManagement(false)}
          />
        </div>
      )}

      {/* Chat Interface Modal */}
      {showChat && (
        <ChatInterface
          group={currentGroup}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setPaymentData(null)
          }}
          amount={paymentData.amount}
          description={paymentData.description}
          groupId={paymentData.groupId}
          expenseId={paymentData.expenseId}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          title="Settle Group Expense"
        />
      )}
    </div>
  )
}

export default GroupDetailPage