import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../common/Button'
import { addToast } from '../../store/slices/uiSlice'

const GroupMemberManagement = ({ group, onClose }) => {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState('members')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMethod, setInviteMethod] = useState('email')
  const [loading, setLoading] = useState(false)
  
  // Assume current user is admin for demo
  const currentUserRole = 'admin'
  
  const generateInviteLink = () => {
    return `https://expensiver.com/join/${group?.id || 'demo'}`
  }
  
  const generateInviteCode = () => {
    return 'ABC123'
  }
  
  const handleInviteByEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      dispatch(addToast({
        type: 'success',
        message: `Invitation sent to ${inviteEmail}`
      }))
      
      setInviteEmail('')
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to send invitation. Please try again.'
      }))
    } finally {
      setLoading(false)
    }
  }
  
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(generateInviteLink())
    dispatch(addToast({
      type: 'success',
      message: 'Invite link copied to clipboard!'
    }))
  }
  
  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(generateInviteCode())
    dispatch(addToast({
      type: 'success',
      message: 'Invite code copied to clipboard!'
    }))
  }
  
  const handleRemoveMember = async (member) => {
    if (member.id === 'current_user') {
      dispatch(addToast({
        type: 'error',
        message: 'You cannot remove yourself from the group'
      }))
      return
    }
    
    if (window.confirm(`Remove ${member.name} from the group?`)) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        dispatch(addToast({
          type: 'success',
          message: `${member.name} has been removed from the group`
        }))
      } catch (error) {
        dispatch(addToast({
          type: 'error',
          message: 'Failed to remove member. Please try again.'
        }))
      }
    }
  }
  
  const handleToggleMemberRole = async (member) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      dispatch(addToast({
        type: 'success',
        message: `${member.name} is now ${newRole === 'admin' ? 'an admin' : 'a member'}`
      }))
    } catch (error) {
      dispatch(addToast({
        type: 'error',
        message: 'Failed to update member role. Please try again.'
      }))
    }
  }
  
  const formatJoinDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl shadow-lg w-full max-w-2xl mx-auto max-h-[80vh] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Manage Members</h2>
          <p className="text-sm text-gray-500 mt-1">{group.name}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-gray-400">×</span>
          </button>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Members ({group.members?.length || 0})
        </button>
        {currentUserRole === 'admin' && (
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Invite Members
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'members' ? (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {group.members?.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
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
                        Joined {formatJoinDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {currentUserRole === 'admin' && member.id !== 'current_user' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleMemberRole(member)}
                      >
                        {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="invite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Invite Method Selector */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setInviteMethod('email')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    inviteMethod === 'email'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Invite by Email
                </button>
                <button
                  onClick={() => setInviteMethod('link')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    inviteMethod === 'link'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Share Link/Code
                </button>
              </div>
              
              {inviteMethod === 'email' ? (
                <form onSubmit={handleInviteByEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="input w-full"
                      required
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    loading={loading}
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Invite Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invite Link
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={generateInviteLink()}
                        readOnly
                        className="input flex-1 bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        onClick={handleCopyInviteLink}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Anyone with this link can join the group
                    </p>
                  </div>
                  
                  {/* Invite Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invite Code
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={generateInviteCode()}
                        readOnly
                        className="input flex-1 bg-gray-50 font-mono text-center text-lg tracking-widest"
                      />
                      <Button
                        variant="outline"
                        onClick={handleCopyInviteCode}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this 6-digit code for easy joining
                    </p>
                  </div>
                  
                  {/* QR Code placeholder */}
                  <div className="text-center">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <span className="text-4xl">📄</span>
                    </div>
                    <p className="text-sm text-gray-500">QR Code for quick joining</p>
                    <p className="text-xs text-gray-400">(Feature coming soon)</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default GroupMemberManagement