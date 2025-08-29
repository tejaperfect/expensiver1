import React, { useState } from 'react'
import { motion } from 'framer-motion'
import GroupCard from './GroupCard'
import Button from '../common/Button'

const GroupList = ({ groups = [], onEditGroup, onLeaveGroup, onViewGroup }) => {
  const [filter, setFilter] = useState('all') // 'all', 'admin', 'member'
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recent') // 'recent', 'name', 'members', 'expenses'
  
  // Filter groups based on search and filter criteria
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const currentUserRole = group.members?.find(member => member.id === 'current_user')?.role
    const matchesFilter = filter === 'all' || 
                         (filter === 'admin' && currentUserRole === 'admin') ||
                         (filter === 'member' && currentUserRole === 'member')
    
    return matchesSearch && matchesFilter
  })
  
  // Sort groups
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'members':
        return (b.totalMembers || 0) - (a.totalMembers || 0)
      case 'expenses':
        return (b.totalExpenses || 0) - (a.totalExpenses || 0)
      case 'recent':
      default:
        return new Date(b.lastActivity || b.createdAt) - new Date(a.lastActivity || a.createdAt)
    }
  })
  
  const getStatsForFilter = (filterType) => {
    if (filterType === 'all') return groups.length
    return groups.filter(group => {
      const currentUserRole = group.members?.find(member => member.id === 'current_user')?.role
      return filterType === 'admin' ? currentUserRole === 'admin' : currentUserRole === 'member'
    }).length
  }
  
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>
        
        {/* Filter Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: 'All', count: getStatsForFilter('all') },
            { key: 'admin', label: 'Admin', count: getStatsForFilter('admin') },
            { key: 'member', label: 'Member', count: getStatsForFilter('member') }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input min-w-0 sm:w-auto"
        >
          <option value="recent">Recent Activity</option>
          <option value="name">Name A-Z</option>
          <option value="members">Most Members</option>
          <option value="expenses">Highest Expenses</option>
        </select>
      </div>
      
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {sortedGroups.length} group{sortedGroups.length !== 1 ? 's' : ''} found
          {searchTerm && ` for "${searchTerm}"`}
        </p>
        
        {sortedGroups.length > 1 && (
          <div className="text-sm text-gray-500">
            Sorted by {sortBy === 'recent' ? 'recent activity' : 
                      sortBy === 'name' ? 'name' :
                      sortBy === 'members' ? 'member count' : 'total expenses'}
          </div>
        )}
      </div>
      
      {/* Groups Grid */}
      {sortedGroups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">👥</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No groups found' : 'No groups yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? `No groups match "${searchTerm}". Try a different search term.`
              : 'Create your first group or join an existing one to get started.'
            }
          </p>
          {!searchTerm && (
            <div className="flex justify-center space-x-3">
              <Button variant="primary">
                Create Group
              </Button>
              <Button variant="outline">
                Join Group
              </Button>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGroups.map((group, index) => (
            <GroupCard
              key={group.id}
              group={group}
              index={index}
              onEdit={onEditGroup}
              onLeave={onLeaveGroup}
              onView={onViewGroup}
            />
          ))}
        </div>
      )}
      
      {/* Load More (for pagination if needed) */}
      {sortedGroups.length > 0 && sortedGroups.length % 9 === 0 && (
        <div className="text-center pt-6">
          <Button variant="outline">
            Load More Groups
          </Button>
        </div>
      )}
    </div>
  )
}

export default GroupList