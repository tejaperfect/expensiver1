import mongoose from 'mongoose'
import { logger } from '../utils/logger.js'

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/expensiver'
    
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    }

    const conn = await mongoose.connect(mongoURI, options)

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    logger.info(`MongoDB Connected: ${conn.connection.host}`)

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB')
      logger.info('Mongoose connected to MongoDB')
    })

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err)
      logger.error('Mongoose connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('💔 Mongoose disconnected from MongoDB')
      logger.warn('Mongoose disconnected from MongoDB')
    })

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('🔚 Mongoose connection closed through app termination')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    logger.error('Database connection failed:', error)
    process.exit(1)
  }
}

// Database health check
export const checkDBHealth = async () => {
  try {
    const adminDB = mongoose.connection.db.admin()
    const result = await adminDB.ping()
    return { status: 'healthy', ping: result }
  } catch (error) {
    return { status: 'unhealthy', error: error.message }
  }
}

// Close database connection
export const closeDB = async () => {
  try {
    await mongoose.connection.close()
    console.log('🔚 Database connection closed')
    logger.info('Database connection closed')
  } catch (error) {
    console.error('❌ Error closing database connection:', error.message)
    logger.error('Error closing database connection:', error)
  }
}