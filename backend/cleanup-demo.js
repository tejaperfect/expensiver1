import mongoose from 'mongoose'
import { User } from './src/models/userModel.js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const cleanupDemoUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find and delete existing demo user
    const existingDemo = await User.findOne({ email: 'demo@expensiver.com' })
    if (existingDemo) {
      await User.deleteOne({ email: 'demo@expensiver.com' })
      console.log('Existing demo user deleted')
    }

    console.log('Demo user cleanup completed')
    process.exit(0)
  } catch (error) {
    console.error('Error cleaning up demo user:', error)
    process.exit(1)
  }
}

cleanupDemoUser()