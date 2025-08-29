import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../components/common/Button'
import GroupList from '../components/groups/GroupList'
import CreateGroupForm from '../components/groups/CreateGroupForm'
import JoinGroupForm from '../components/groups/JoinGroupForm'
import { fetchGroups, createGroup, joinGroup, leaveGroup, clearError } from '../store/slices/groupSlice'
import { addToast } from '../store/slices/uiSlice'

const GroupsPage = () => {
  const dispatch = useDispatch()
  const { groups, loading, error, createLoading, joinLoading } = useSelector((state) => state.groups)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  
  useEffect(() => {
    dispatch(fetchGroups())
  }, [])
  
  const handleCreateGroup = async (groupData) => {
    try {
      await dispatch(createGroup(groupData)).unwrap()
      setShowCreateForm(false)
    } catch (error) {
      // Error handled by the thunk and displayed via toast
    }
  }
  
  const handleJoinGroup = async (joinData) => {
    try {
      await dispatch(joinGroup(joinData)).unwrap()
      setShowJoinForm(false)
    } catch (error) {
      // Error handled by the thunk and displayed via toast
    }
  }
  
  const handleLeaveGroup = async (group) => {
    if (window.confirm(`Are you sure you want to leave "${group.name}"?`)) {
      try {
        await dispatch(leaveGroup(group.id)).unwrap()
        dispatch(addToast({
          type: 'success',
          message: `Left "${group.name}" successfully`
        }))
      } catch (error) {
        dispatch(addToast({
          type: 'error',
          message: 'Failed to leave group. Please try again.'
        }))
      }
    }
  }
  
  const getGroupStats = () => {
    const totalGroups = groups.length
    const adminGroups = groups.filter(group => 
      group.members?.find(member => member.id === 'current_user')?.role === 'admin'
    ).length
    const totalExpenses = groups.reduce((sum, group) => sum + (group.totalExpenses || 0), 0)
    const yourTotalShare = groups.reduce((sum, group) => sum + (group.yourShare || 0), 0)
    
    return { totalGroups, adminGroups, totalExpenses, yourTotalShare }
  }
  
  const stats = getGroupStats()
  
  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your groups...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups</h1>
          <p className="text-gray-600 mt-1">
            Manage shared expenses with friends, family, and colleagues
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowJoinForm(true)}
            loading={joinLoading}
          >
            🔗 Join Group
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateForm(true)}
            loading={createLoading}
          >
            ➕ Create Group
          </Button>
        </div>
      </motion.div>
      
      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl">👥</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalGroups}</div>
              <div className="text-sm text-gray-500">Total Groups</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl">👑</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.adminGroups}</div>
              <div className="text-sm text-gray-500">Admin Groups</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">${stats.totalExpenses.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Total Expenses</div>
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">${stats.yourTotalShare.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Your Share</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Groups List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <GroupList
          groups={groups}
          onLeaveGroup={handleLeaveGroup}
        />
      </motion.div>
      
      {/* Modals */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <CreateGroupForm
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateGroup}
          />
        </div>
      )}
      
      {showJoinForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <JoinGroupForm
            onClose={() => setShowJoinForm(false)}
            onSubmit={handleJoinGroup}
          />
        </div>
      )}
    </div>
  )
}

export default GroupsPage