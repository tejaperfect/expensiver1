import { Chat, Group, Notification } from '../models/index.js'
import { AppError, asyncHandler, sendSuccessResponse, sendPaginatedResponse } from '../middleware/errorMiddleware.js'
import { logger } from '../utils/logger.js'

// Get group chat
export const getGroupChat = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params
  
  // Check if group exists and user is a member
  const group = await Group.findById(groupId)
  if (!group) {
    return next(new AppError('Group not found', 404))
  }

  if (!group.isUserMember(req.user.id)) {
    return next(new AppError('You are not a member of this group', 403))
  }

  // Find or create chat for group
  let chat = await Chat.findByGroup(groupId)
  
  if (!chat) {
    chat = await Chat.createGroupChat(groupId, req.user.id)
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => p.user._id.toString() === req.user.id.toString())
  if (!isParticipant) {
    await chat.addParticipant(req.user.id)
    
    // Emit user joined event
    const io = req.app.get('io')
    if (io) {
      io.to(`group-${groupId}`).emit('user-joined', {
        userId: req.user.id,
        userName: req.user.name,
        groupId
      })
      
      // Emit updated online users list
      const onlineUsers = chat.participants.map(p => p.user._id.toString())
      io.to(`group-${groupId}`).emit('online-users', {
        groupId,
        users: onlineUsers
      })
    }
  }

  sendSuccessResponse(res, 200, { chat }, 'Group chat retrieved successfully')
})

// Get chat messages
export const getChatMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  const skip = (page - 1) * limit

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  // Filter messages (exclude deleted messages unless they're from current user)
  let messages = chat.messages.filter(msg => 
    !msg.isDeleted || msg.sender.toString() === req.user.id.toString()
  )

  // Apply search filter if provided
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase()
    messages = messages.filter(msg => 
      msg.content.toLowerCase().includes(searchTerm)
    )
  }

  // Apply type filter if provided
  if (req.query.type) {
    messages = messages.filter(msg => msg.type === req.query.type)
  }

  // Sort by date (newest first) and paginate
  messages.sort((a, b) => b.createdAt - a.createdAt)
  const total = messages.length
  const paginatedMessages = messages.slice(skip, skip + limit)

  // Mark messages as read for current user
  await chat.markAsRead(req.user.id)

  sendPaginatedResponse(res, {
    messages: paginatedMessages.reverse(), // Return in chronological order
    chatInfo: {
      id: chat._id,
      type: chat.type,
      participantCount: chat.participantCount,
      unreadCount: chat.getUnreadCount(req.user.id)
    }
  }, {
    page,
    limit,
    total
  }, 'Messages retrieved successfully')
})

// Send message
export const sendMessage = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params
  const { content, type = 'text', replyTo, mentions } = req.body

  if (!content || content.trim().length === 0) {
    return next(new AppError('Message content is required', 400))
  }

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  // Check if chat is active
  if (!chat.settings.isActive) {
    return next(new AppError('This chat is not active', 403))
  }

  // Prepare message data
  const messageData = {
    content: content.trim(),
    type,
    sender: req.user.id,
    senderName: req.user.name
  }

  // Handle reply
  if (replyTo) {
    const replyMessage = chat.messages.id(replyTo)
    if (!replyMessage) {
      return next(new AppError('Reply message not found', 404))
    }
    messageData.replyTo = replyTo
  }

  // Handle mentions
  if (mentions && mentions.length > 0) {
    messageData.mentions = mentions.map(mention => ({
      user: mention.userId,
      position: mention.position
    }))
  }

  // Handle attachments from file upload
  if (req.files && req.files.length > 0) {
    messageData.attachments = req.files.map(file => ({
      type: file.mimetype.startsWith('image/') ? 'image' : 'document',
      url: file.url,
      thumbnailUrl: file.thumbnailUrl,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype
    }))
    
    if (messageData.attachments.length > 0) {
      messageData.type = messageData.attachments[0].type
    }
  }

  // Add message to chat
  await chat.addMessage(req.user.id, messageData.content, messageData.type, {
    replyTo: messageData.replyTo,
    mentions: messageData.mentions,
    attachments: messageData.attachments
  })

  // Get the newly added message
  const newMessage = chat.messages[chat.messages.length - 1]
  await chat.populate('messages.sender', 'name avatar')

  // Emit real-time message via Socket.IO
  const io = req.app.get('io')
  if (io) {
    io.to(`group-${chat.group}`).emit('new-message', {
      chatId: chat._id,
      message: newMessage,
      sender: {
        _id: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar
      }
    })
  }

  // Send notifications to mentioned users
  if (mentions && mentions.length > 0) {
    for (const mention of mentions) {
      if (mention.userId !== req.user.id) {
        await Notification.create({
          recipient: mention.userId,
          type: 'group_mention',
          category: 'group',
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in ${chat.group.name}`,
          data: {
            groupId: chat.group,
            chatId: chat._id,
            messageId: newMessage._id,
            actionUrl: `/groups/${chat.group}/chat`
          },
          sender: req.user.id
        })
      }
    }
  }

  logger.info(`Message sent in chat ${chatId} by user ${req.user.email}`)

  sendSuccessResponse(res, 201, { 
    message: newMessage 
  }, 'Message sent successfully')
})

// Edit message
export const editMessage = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params
  const { content } = req.body

  if (!content || content.trim().length === 0) {
    return next(new AppError('Message content is required', 400))
  }

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  // Edit message
  await chat.editMessage(messageId, content.trim(), req.user.id)

  // Emit real-time update
  const io = req.app.get('io')
  if (io) {
    io.to(`group-${chat.group}`).emit('message-edited', {
      chatId: chat._id,
      messageId,
      newContent: content.trim(),
      editedAt: Date.now()
    })
  }

  sendSuccessResponse(res, 200, null, 'Message edited successfully')
})

// Delete message
export const deleteMessage = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  // Delete message
  await chat.deleteMessage(messageId, req.user.id)

  // Emit real-time update
  const io = req.app.get('io')
  if (io) {
    io.to(`group-${chat.group}`).emit('message-deleted', {
      chatId: chat._id,
      messageId,
      deletedBy: req.user.id
    })
  }

  sendSuccessResponse(res, 200, null, 'Message deleted successfully')
})

// Add reaction to message
export const addReaction = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params
  const { emoji } = req.body

  if (!emoji) {
    return next(new AppError('Emoji is required', 400))
  }

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  // Add reaction
  await chat.addReaction(messageId, req.user.id, emoji)

  // Emit real-time update
  const io = req.app.get('io')
  if (io) {
    const message = chat.messages.id(messageId)
    io.to(`group-${chat.group}`).emit('reaction-added', {
      chatId: chat._id,
      messageId,
      reactions: message.reactions,
      userId: req.user.id,
      emoji
    })
  }

  sendSuccessResponse(res, 200, null, 'Reaction added successfully')
})

// Pin message
export const pinMessage = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is admin of the group
  const group = await Group.findById(chat.group)
  if (!group.isUserAdmin(req.user.id)) {
    return next(new AppError('Only group admins can pin messages', 403))
  }

  // Pin message
  await chat.pinMessage(messageId, req.user.id)

  // Emit real-time update
  const io = req.app.get('io')
  if (io) {
    io.to(`group-${chat.group}`).emit('message-pinned', {
      chatId: chat._id,
      messageId,
      pinnedBy: req.user.id
    })
  }

  sendSuccessResponse(res, 200, null, 'Message pinned successfully')
})

// Unpin message
export const unpinMessage = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is admin of the group
  const group = await Group.findById(chat.group)
  if (!group.isUserAdmin(req.user.id)) {
    return next(new AppError('Only group admins can unpin messages', 403))
  }

  // Unpin message
  await chat.unpinMessage(messageId)

  // Emit real-time update
  const io = req.app.get('io')
  if (io) {
    io.to(`group-${chat.group}`).emit('message-unpinned', {
      chatId: chat._id,
      messageId
    })
  }

  sendSuccessResponse(res, 200, null, 'Message unpinned successfully')
})

// Get pinned messages
export const getPinnedMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)
    .populate('pinnedMessages.message')
    .populate('pinnedMessages.pinnedBy', 'name avatar')

  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  sendSuccessResponse(res, 200, {
    pinnedMessages: chat.pinnedMessages
  }, 'Pinned messages retrieved successfully')
})

// Search messages
export const searchMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params
  const { query, type, sender, startDate, endDate } = req.query

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  const searchOptions = {
    type,
    sender,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  }

  const messages = chat.searchMessages(query, searchOptions)

  sendSuccessResponse(res, 200, {
    messages,
    query,
    resultsCount: messages.length
  }, 'Message search completed successfully')
})

// Mute/Unmute chat
export const muteChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params
  const { muted, muteUntil } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  if (muted) {
    await chat.muteChat(req.user.id, muteUntil ? new Date(muteUntil) : null)
  } else {
    await chat.unmuteChat(req.user.id)
  }

  sendSuccessResponse(res, 200, null, muted ? 'Chat muted successfully' : 'Chat unmuted successfully')
})

// Get chat participants
export const getChatParticipants = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params

  const chat = await Chat.findById(chatId)
    .populate('participants.user', 'name avatar lastLogin')

  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  sendSuccessResponse(res, 200, {
    participants: chat.participants
  }, 'Chat participants retrieved successfully')
})

// Mark messages as read
export const markAsRead = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params
  const { messageId } = req.body

  const chat = await Chat.findById(chatId)
  if (!chat) {
    return next(new AppError('Chat not found', 404))
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => 
    p.user._id.toString() === req.user.id.toString()
  )

  if (!isParticipant) {
    return next(new AppError('You are not a participant in this chat', 403))
  }

  await chat.markAsRead(req.user.id, messageId)

  // Emit read receipt
  const io = req.app.get('io')
  if (io) {
    io.to(`group-${chat.group}`).emit('message-read', {
      chatId: chat._id,
      userId: req.user.id,
      messageId: messageId || 'all',
      readAt: Date.now()
    })
  }

  sendSuccessResponse(res, 200, null, 'Messages marked as read')
})

// Get user's chats
export const getUserChats = asyncHandler(async (req, res, next) => {
  const chats = await Chat.findUserChats(req.user.id)

  // Add unread count for each chat
  const chatsWithUnread = chats.map(chat => ({
    ...chat.toObject(),
    unreadCount: chat.getUnreadCount(req.user.id),
    lastMessage: chat.lastMessage
  }))

  sendSuccessResponse(res, 200, {
    chats: chatsWithUnread
  }, 'User chats retrieved successfully')
})