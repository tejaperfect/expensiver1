import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'
import hpp from 'hpp'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import custom modules
import { connectDB } from './src/config/database.js'
import { errorHandler, notFound } from './src/middleware/errorMiddleware.js'
import { logger } from './src/utils/logger.js'

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const server = createServer(app)

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

// Connect to MongoDB
connectDB()

// Trust proxy for deployment environments
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api/', limiter)

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ]
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Data sanitization against NoSQL query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xss())

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'date']
}))

// Compression middleware
app.use(compression())

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // Store user connection
  let userId = null
  
  // Join user to their personal room
  socket.on('join-user-room', (uid) => {
    userId = uid
    socket.join(`user-${userId}`)
    console.log(`User ${userId} joined their personal room`)
  })
  
  // Join group room
  socket.on('join-group', (groupId) => {
    socket.join(`group-${groupId}`)
    console.log(`User joined group ${groupId}`)
    
    // Emit updated online users list
    const onlineUsers = []
    // In a real app, you would track online users in a database or cache
    io.to(`group-${groupId}`).emit('online-users', {
      groupId,
      users: onlineUsers
    })
  })
  
  // Leave group room
  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`)
    console.log(`User left group ${groupId}`)
  })
  
  // Handle chat messages
  socket.on('send-message', (data) => {
    // Broadcast to group room
    socket.to(`group-${data.groupId}`).emit('new-message', data)
  })
  
  // Handle expense updates
  socket.on('expense-update', (data) => {
    socket.to(`group-${data.groupId}`).emit('expense-updated', data)
  })
  
  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(`group-${data.groupId}`).emit('typing', data)
  })
  
  // Handle message read
  socket.on('message-read', (data) => {
    socket.to(`group-${data.groupId}`).emit('message-read', data)
  })
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    // In a real app, you would update online status in database or cache
  })
})

// Make io accessible to routes
app.set('io', io)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API Routes
app.use('/api/auth', (await import('./src/routes/authRoutes.js')).default)
app.use('/api/users', (await import('./src/routes/userRoutes.js')).default)
app.use('/api/expenses', (await import('./src/routes/expenseRoutes.js')).default)
app.use('/api/groups', (await import('./src/routes/groupRoutes.js')).default)
app.use('/api/chat', (await import('./src/routes/chatRoutes.js')).default)
app.use('/api/payments', (await import('./src/routes/paymentRoutes.js')).default)
app.use('/api/analytics', (await import('./src/routes/analyticsRoutes.js')).default)
app.use('/api/ai', (await import('./src/routes/aiRoutes.js')).default)
app.use('/api/notifications', (await import('./src/routes/notificationRoutes.js')).default)

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('public'))
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('public', 'index.html'))
  })
}

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully')
  server.close(() => {
    console.log('💥 Process terminated!')
    mongoose.connection.close()
  })
})

process.on('SIGINT', () => {
  console.log('👋 SIGINT RECEIVED. Shutting down gracefully')
  server.close(() => {
    console.log('💥 Process terminated!')
    mongoose.connection.close()
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...')
  console.log(err.name, err.message)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  logger.info(`Server started on port ${PORT}`)
})