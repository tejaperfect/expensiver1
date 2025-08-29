import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  // Message Content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    trim: true
  },
  
  // Message Type
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'expense', 'settlement', 'system', 'emoji'],
    default: 'text'
  },
  
  // Sender Information
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: String, // Cached for performance
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  editedAt: Date,
  
  // Message Status
  isEdited: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'receipt']
    },
    url: String,
    thumbnailUrl: String,
    filename: String,
    originalName: String,
    size: Number,
    mimeType: String
  }],
  
  // Related Data
  relatedData: {
    expenseId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Expense'
    },
    transactionId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Transaction'
    },
    amount: Number,
    currency: String
  },
  
  // Message Reactions
  reactions: [{
    emoji: String,
    users: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    count: { type: Number, default: 0 }
  }],
  
  // Reply/Thread
  replyTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  },
  
  // Read Receipts
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Mentions
  mentions: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    position: Number // Position in text where mention occurs
  }]
})

const chatSchema = new mongoose.Schema({
  // Chat Identification
  group: {
    type: mongoose.Schema.ObjectId,
    ref: 'Group',
    required: true
  },
  
  // Chat Type
  type: {
    type: String,
    enum: ['group', 'announcement'],
    default: 'group'
  },
  
  // Messages
  messages: [messageSchema],
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    },
    unreadCount: {
      type: Number,
      default: 0
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    mutedUntil: Date
  }],
  
  // Chat Settings
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024 // 10MB
    },
    allowedFileTypes: {
      type: [String],
      default: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    },
    messageRetentionDays: {
      type: Number,
      default: 365 // 1 year
    }
  },
  
  // Statistics
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    lastActivity: Date,
    mostActiveUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    messagesByUser: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      count: Number
    }]
  },
  
  // Pinned Messages
  pinnedMessages: [{
    message: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message'
    },
    pinnedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Audit Fields
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
chatSchema.index({ group: 1 })
chatSchema.index({ 'participants.user': 1 })
chatSchema.index({ 'messages.sender': 1 })
chatSchema.index({ 'messages.createdAt': -1 })
chatSchema.index({ 'messages.type': 1 })
chatSchema.index({ 'messages.isDeleted': 1 })

// Message sub-document indexes
messageSchema.index({ createdAt: -1 })
messageSchema.index({ sender: 1, createdAt: -1 })
messageSchema.index({ type: 1 })

// Virtual fields
chatSchema.virtual('participantCount').get(function() {
  return this.participants ? this.participants.length : 0
})

chatSchema.virtual('activeParticipantCount').get(function() {
  return this.participants ? this.participants.filter(p => p.user).length : 0
})

chatSchema.virtual('lastMessage').get(function() {
  if (this.messages && this.messages.length > 0) {
    return this.messages[this.messages.length - 1]
  }
  return null
})

chatSchema.virtual('unreadMessageCount').get(function() {
  // This would need to be calculated per user
  return 0
})

// Message virtual fields
messageSchema.virtual('reactionCount').get(function() {
  return this.reactions.reduce((total, reaction) => total + reaction.count, 0)
})

messageSchema.virtual('isSystemMessage').get(function() {
  return this.type === 'system'
})

messageSchema.virtual('hasAttachments').get(function() {
  return this.attachments && this.attachments.length > 0
})

// Pre-save middleware
chatSchema.pre('save', function(next) {
  // Update stats
  if (this.messages) {
    this.stats.totalMessages = this.messages.filter(m => !m.isDeleted).length
    
    if (this.messages.length > 0) {
      this.stats.lastActivity = this.messages[this.messages.length - 1].createdAt
    }
  }
  
  // Update timestamp
  this.updatedAt = Date.now()
  
  next()
})

// Instance methods
chatSchema.methods.addMessage = function(senderId, content, type = 'text', additionalData = {}) {
  const message = {
    sender: senderId,
    content,
    type,
    createdAt: Date.now(),
    ...additionalData
  }
  
  this.messages.push(message)
  
  // Update participant unread counts
  this.participants.forEach(participant => {
    if (participant.user.toString() !== senderId.toString()) {
      participant.unreadCount += 1
    }
  })
  
  return this.save()
}

chatSchema.methods.editMessage = function(messageId, newContent, userId) {
  const message = this.messages.id(messageId)
  
  if (!message) {
    throw new Error('Message not found')
  }
  
  if (message.sender.toString() !== userId.toString()) {
    throw new Error('You can only edit your own messages')
  }
  
  message.content = newContent
  message.isEdited = true
  message.editedAt = Date.now()
  
  return this.save()
}

chatSchema.methods.deleteMessage = function(messageId, userId) {
  const message = this.messages.id(messageId)
  
  if (!message) {
    throw new Error('Message not found')
  }
  
  if (message.sender.toString() !== userId.toString()) {
    throw new Error('You can only delete your own messages')
  }
  
  message.isDeleted = true
  message.deletedAt = Date.now()
  message.deletedBy = userId
  message.content = '[Message deleted]'
  
  return this.save()
}

chatSchema.methods.addReaction = function(messageId, userId, emoji) {
  const message = this.messages.id(messageId)
  
  if (!message) {
    throw new Error('Message not found')
  }
  
  let reaction = message.reactions.find(r => r.emoji === emoji)
  
  if (!reaction) {
    reaction = {
      emoji,
      users: [],
      count: 0
    }
    message.reactions.push(reaction)
  }
  
  // Toggle reaction
  const userIndex = reaction.users.indexOf(userId)
  if (userIndex > -1) {
    reaction.users.splice(userIndex, 1)
    reaction.count -= 1
  } else {
    reaction.users.push(userId)
    reaction.count += 1
  }
  
  // Remove reaction if no users
  if (reaction.count === 0) {
    message.reactions = message.reactions.filter(r => r.emoji !== emoji)
  }
  
  return this.save()
}

chatSchema.methods.markAsRead = function(userId, messageId = null) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString())
  
  if (participant) {
    participant.lastReadAt = Date.now()
    participant.unreadCount = 0
    
    // Add read receipt to specific message
    if (messageId) {
      const message = this.messages.id(messageId)
      if (message) {
        const existingRead = message.readBy.find(r => r.user.toString() === userId.toString())
        if (!existingRead) {
          message.readBy.push({
            user: userId,
            readAt: Date.now()
          })
        }
      }
    }
  }
  
  return this.save()
}

chatSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString())
  
  if (existingParticipant) {
    throw new Error('User is already a participant')
  }
  
  this.participants.push({
    user: userId,
    joinedAt: Date.now(),
    lastReadAt: Date.now(),
    unreadCount: 0
  })
  
  return this.save()
}

chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString())
  return this.save()
}

chatSchema.methods.muteChat = function(userId, muteUntil = null) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString())
  
  if (participant) {
    participant.isMuted = true
    participant.mutedUntil = muteUntil
  }
  
  return this.save()
}

chatSchema.methods.unmuteChat = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString())
  
  if (participant) {
    participant.isMuted = false
    participant.mutedUntil = null
  }
  
  return this.save()
}

chatSchema.methods.pinMessage = function(messageId, pinnedBy) {
  const message = this.messages.id(messageId)
  
  if (!message) {
    throw new Error('Message not found')
  }
  
  const existingPin = this.pinnedMessages.find(p => p.message.toString() === messageId.toString())
  
  if (existingPin) {
    throw new Error('Message is already pinned')
  }
  
  this.pinnedMessages.push({
    message: messageId,
    pinnedBy,
    pinnedAt: Date.now()
  })
  
  return this.save()
}

chatSchema.methods.unpinMessage = function(messageId) {
  this.pinnedMessages = this.pinnedMessages.filter(p => p.message.toString() !== messageId.toString())
  return this.save()
}

chatSchema.methods.getUnreadCount = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString())
  return participant ? participant.unreadCount : 0
}

chatSchema.methods.searchMessages = function(query, options = {}) {
  let messages = this.messages.filter(m => !m.isDeleted)
  
  if (query) {
    messages = messages.filter(m => 
      m.content.toLowerCase().includes(query.toLowerCase())
    )
  }
  
  if (options.type) {
    messages = messages.filter(m => m.type === options.type)
  }
  
  if (options.sender) {
    messages = messages.filter(m => m.sender.toString() === options.sender.toString())
  }
  
  if (options.startDate || options.endDate) {
    messages = messages.filter(m => {
      const messageDate = m.createdAt
      let include = true
      
      if (options.startDate && messageDate < options.startDate) {
        include = false
      }
      
      if (options.endDate && messageDate > options.endDate) {
        include = false
      }
      
      return include
    })
  }
  
  return messages.sort((a, b) => b.createdAt - a.createdAt)
}

// Static methods
chatSchema.statics.findByGroup = function(groupId) {
  return this.findOne({ group: groupId })
}

chatSchema.statics.findUserChats = function(userId) {
  return this.find({
    'participants.user': userId
  }).populate('group', 'name avatar')
}

chatSchema.statics.createGroupChat = function(groupId, creatorId) {
  return this.create({
    group: groupId,
    type: 'group',
    participants: [{
      user: creatorId,
      joinedAt: Date.now(),
      lastReadAt: Date.now(),
      unreadCount: 0
    }]
  })
}

// Query middleware
chatSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'group',
    select: 'name avatar settings'
  }).populate({
    path: 'participants.user',
    select: 'name avatar'
  }).populate({
    path: 'messages.sender',
    select: 'name avatar'
  })
  next()
})

const Chat = mongoose.model('Chat', chatSchema)

export { Chat }
