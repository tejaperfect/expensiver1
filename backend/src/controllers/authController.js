import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { User } from '../models/userModel.js'
import { AppError, asyncHandler, sendSuccessResponse } from '../middleware/errorMiddleware.js'
import { logger, securityLogger } from '../utils/logger.js'

// Generate JWT Token
const signToken = (id) => {
  const secret = process.env.JWT_SECRET
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d'
  
  logger.info('Signing token:', {
    userId: id,
    secretAvailable: !!secret,
    secretLength: secret ? secret.length : 0,
    expiresIn
  })
  
  const token = jwt.sign({ id }, secret, { expiresIn })
  
  logger.info('Token signed successfully:', {
    tokenLength: token.length,
    tokenStart: token.substring(0, 20)
  })
  
  return token
}

// Create and send token response
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id)
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }

  res.cookie('jwt', token, cookieOptions)

  // Remove password from output
  user.password = undefined

  sendSuccessResponse(res, statusCode, {
    token,
    user
  }, message)
}

// Register new user
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, passwordConfirm, phone } = req.body

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase()

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    return next(new AppError('User with this email already exists', 400))
  }

  // Check if username is taken (if provided)
  if (req.body.username) {
    const existingUsername = await User.findOne({ username: req.body.username.toLowerCase() })
    if (existingUsername) {
      return next(new AppError('Username is already taken', 400))
    }
  }

  try {
    // Create new user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      passwordConfirm,
      phone: phone?.trim(),
      username: req.body.username?.toLowerCase().trim()
    })

    // Generate email verification token
    const verifyToken = user.createEmailVerificationToken()
    await user.save({ validateBeforeSave: false })

    // Add security event
    await user.addSecurityEvent('registration', req.ip, req.get('User-Agent'), 'New user registration')

    // Log successful registration
    securityLogger.logSuccessfulLogin(
      user._id,
      user.email,
      req.ip,
      req.get('User-Agent')
    )

    logger.info(`New user registered: ${normalizedEmail}`, {
      userId: user._id,
      name: user.name,
      ip: req.ip
    })

    // Send response
    createSendToken(user, 201, res, 'User registered successfully! Please verify your email.')
  } catch (error) {
    logger.error('Registration error:', {
      email: normalizedEmail,
      error: error.message,
      stack: error.stack
    })

    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return next(new AppError(`Validation Error: ${errors.join(', ')}`, 400))
    }

    if (error.code === 11000) {
      return next(new AppError('Email address is already registered', 400))
    }

    return next(new AppError('Registration failed. Please try again.', 500))
  }
})

// Login user
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // Normalize email
  const normalizedEmail = email.trim().toLowerCase()

  // Check for demo account first
  if (normalizedEmail === 'demo@expensiver.com' && password === 'Demo123!@#') {
    // Create/get demo user
    let demoUser = await User.findOne({ email: 'demo@expensiver.com' })
    
    if (!demoUser) {
      // Create demo user without triggering password middleware issues
      demoUser = new User({
        name: 'Demo User',
        email: 'demo@expensiver.com',
        password: 'Demo123!@#',
        passwordConfirm: 'Demo123!@#',
        isEmailVerified: true,
        role: 'user',
        accountStatus: 'active',
        active: true
      })
      
      // Save and then clear passwordChangedAt to prevent token validation issues
      await demoUser.save()
      await User.updateOne(
        { _id: demoUser._id },
        { $unset: { passwordChangedAt: 1 } }
      )
      
      // Refetch the user to get the clean version
      demoUser = await User.findById(demoUser._id)
      logger.info('Demo user created in database without passwordChangedAt')
    }

    // Update last login info
    demoUser.lastLogin = Date.now()
    demoUser.lastLoginIP = req.ip
    await demoUser.save({ validateBeforeSave: false })

    // Add login history
    await demoUser.addLoginHistory(req.ip, req.get('User-Agent'), {
      country: 'Demo',
      city: 'Demo City',
      timezone: 'UTC'
    })

    // Log demo login
    logger.info('Demo account login', {
      userId: demoUser._id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    return createSendToken(demoUser, 200, res, 'Demo login successful')
  }

  // Validate input
  if (!normalizedEmail || !password) {
    return next(new AppError('Please provide email and password', 400))
  }

  try {
    // Check if user exists and password is correct
    const user = await User.findOne({ email: normalizedEmail }).select('+password +loginAttempts +lockUntil')

    // Check if account is locked
    if (user && user.isLocked) {
      securityLogger.logFailedLogin(normalizedEmail, req.ip, req.get('User-Agent'))
      await user.addSecurityEvent('failed_login', req.ip, req.get('User-Agent'), 'Account locked - login attempt')
      return next(new AppError('Account is temporarily locked due to too many failed login attempts. Please try again later.', 423))
    }

    // Verify user and password
    if (!user || !(await user.correctPassword(password, user.password))) {
      // Increment login attempts if user exists
      if (user) {
        await user.incrementLoginAttempts()
        await user.addSecurityEvent('failed_login', req.ip, req.get('User-Agent'), 'Incorrect password')
      }
      
      securityLogger.logFailedLogin(normalizedEmail, req.ip, req.get('User-Agent'))
      return next(new AppError('Incorrect email or password', 401))
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      await user.addSecurityEvent('failed_login', req.ip, req.get('User-Agent'), 'Suspended account login attempt')
      return next(new AppError('Your account has been suspended. Please contact support.', 403))
    }

    if (user.accountStatus === 'inactive') {
      await user.addSecurityEvent('failed_login', req.ip, req.get('User-Agent'), 'Inactive account login attempt')
      return next(new AppError('Your account is inactive. Please contact support.', 403))
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Update last login info
    user.lastLogin = Date.now()
    user.lastLoginIP = req.ip
    await user.save({ validateBeforeSave: false })

    // Add login history and security event
    await user.addLoginHistory(req.ip, req.get('User-Agent'))
    await user.addSecurityEvent('login', req.ip, req.get('User-Agent'), 'Successful login')

    // Log successful login
    securityLogger.logSuccessfulLogin(
      user._id,
      user.email,
      req.ip,
      req.get('User-Agent')
    )

    logger.info('User login successful', {
      userId: user._id,
      email: user.email,
      ip: req.ip
    })

    createSendToken(user, 200, res, 'Login successful')
  } catch (error) {
    logger.error('Login error:', {
      email: normalizedEmail,
      error: error.message,
      stack: error.stack,
      ip: req.ip
    })
    return next(new AppError('Login failed. Please try again.', 500))
  }
})

// Logout user
export const logout = asyncHandler(async (req, res, next) => {
  try {
    // Clear JWT cookie
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    // Add security event if user is authenticated
    if (req.user) {
      await req.user.addSecurityEvent('logout', req.ip, req.get('User-Agent'), 'User logout')
      logger.info(`User logged out: ${req.user.email}`, {
        userId: req.user._id,
        ip: req.ip
      })
    }

    sendSuccessResponse(res, 200, null, 'Logged out successfully')
  } catch (error) {
    logger.error('Logout error:', {
      error: error.message,
      userId: req.user?._id,
      ip: req.ip
    })
    sendSuccessResponse(res, 200, null, 'Logged out successfully')
  }
})

// Get current user
export const getMe = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('groups.groupId', 'name avatar')
      .select('-password -passwordResetToken -emailVerificationToken -emailChangeToken')
    
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Update last activity
    await user.updateOne({ 'stats.lastActivity': Date.now() })
    
    sendSuccessResponse(res, 200, { user }, 'User data retrieved successfully')
  } catch (error) {
    logger.error('Get user error:', {
      error: error.message,
      userId: req.user.id,
      ip: req.ip
    })
    return next(new AppError('Failed to retrieve user data', 500))
  }
})

// Forgot password
export const forgotPassword = asyncHandler(async (req, res, next) => {
  // Get user based on posted email
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    return next(new AppError('There is no user with that email address', 404))
  }

  // Generate random reset token
  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // Log password reset request
  securityLogger.logPasswordReset(user.email, req.ip)

  try {
    // TODO: Send email with reset token
    // For now, we'll return the token in development
    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`

    if (process.env.NODE_ENV === 'development') {
      sendSuccessResponse(res, 200, { 
        resetToken,
        resetURL,
        message: 'Password reset token generated (development mode)'
      }, 'Password reset token sent')
    } else {
      sendSuccessResponse(res, 200, null, 'Password reset token sent to email')
    }
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })

    return next(new AppError('There was an error sending the email. Try again later.', 500))
  }
})

// Reset password
export const resetPassword = asyncHandler(async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })

  // If token has not expired and there is a user, set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }

  user.password = req.body.password
  user.passwordConfirm = req.body.confirmPassword
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  user.passwordChangedAt = Date.now()
  await user.save()

  logger.info(`Password reset successful for user: ${user.email}`)

  // Log the user in
  createSendToken(user, 200, res, 'Password reset successful')
})

// Update password
export const updatePassword = asyncHandler(async (req, res, next) => {
  try {
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password')

    if (!user) {
      return next(new AppError('User not found', 404))
    }

    // Check if posted current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      await user.addSecurityEvent('failed_password_change', req.ip, req.get('User-Agent'), 'Incorrect current password')
      return next(new AppError('Your current password is incorrect', 401))
    }

    // Update password
    user.password = req.body.newPassword
    user.passwordConfirm = req.body.confirmNewPassword
    user.passwordChangedAt = Date.now()
    await user.save()

    // Add security event
    await user.addSecurityEvent('password_change', req.ip, req.get('User-Agent'), 'Password updated successfully')

    logger.info(`Password updated for user: ${user.email}`, {
      userId: user._id,
      ip: req.ip
    })

    // Log user in with new password
    createSendToken(user, 200, res, 'Password updated successfully')
  } catch (error) {
    logger.error('Password update error:', {
      error: error.message,
      userId: req.user.id,
      ip: req.ip
    })

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return next(new AppError(`Validation Error: ${errors.join(', ')}`, 400))
    }

    return next(new AppError('Password update failed. Please try again.', 500))
  }
})

// Verify email
export const verifyEmail = asyncHandler(async (req, res, next) => {
  // Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  })

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }

  // Update user verification status
  user.isEmailVerified = true
  user.emailVerificationToken = undefined
  user.emailVerificationExpires = undefined
  await user.save({ validateBeforeSave: false })

  logger.info(`Email verified for user: ${user.email}`)

  sendSuccessResponse(res, 200, null, 'Email verified successfully')
})

// Refresh token
export const refreshToken = asyncHandler(async (req, res, next) => {
  let token

  // Check for token in headers or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (!token) {
    return next(new AppError('No refresh token provided', 401))
  }

  try {
    // Verify token (even if expired, we want to check if it's valid)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true })

    // Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
      return next(new AppError('The user belonging to this token does no longer exist', 401))
    }

    // Check account status
    if (!currentUser.active || currentUser.accountStatus !== 'active') {
      return next(new AppError('Account is not active', 401))
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User recently changed password! Please log in again.', 401))
    }

    // Add security event
    await currentUser.addSecurityEvent('token_refresh', req.ip, req.get('User-Agent'), 'Token refreshed')

    logger.info('Token refreshed successfully', {
      userId: currentUser._id,
      ip: req.ip
    })

    // Create new token
    createSendToken(currentUser, 200, res, 'Token refreshed successfully')
  } catch (error) {
    logger.error('Token refresh error:', {
      error: error.message,
      ip: req.ip
    })
    return next(new AppError('Invalid refresh token', 401))
  }
})

// Resend email verification
export const resendEmailVerification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  if (user.isEmailVerified) {
    return next(new AppError('Email is already verified', 400))
  }

  // Generate new verification token
  const verifyToken = user.createEmailVerificationToken()
  await user.save({ validateBeforeSave: false })

  // TODO: Send verification email
  // For now, return token in development
  if (process.env.NODE_ENV === 'development') {
    sendSuccessResponse(res, 200, { 
      verificationToken: verifyToken,
      message: 'Verification token generated (development mode)'
    }, 'Verification email sent')
  } else {
    sendSuccessResponse(res, 200, null, 'Verification email sent')
  }
})

// Additional endpoints for enhanced auth functionality

// Check email availability
export const checkEmailAvailability = asyncHandler(async (req, res, next) => {
  const { email } = req.params
  
  if (!email) {
    return next(new AppError('Email is required', 400))
  }

  const normalizedEmail = email.toLowerCase().trim()
  const existingUser = await User.findOne({ email: normalizedEmail })
  const isAvailable = !existingUser

  sendSuccessResponse(res, 200, { 
    email: normalizedEmail,
    isAvailable 
  }, isAvailable ? 'Email is available' : 'Email is already taken')
})

// Check username availability
export const checkUsernameAvailability = asyncHandler(async (req, res, next) => {
  const { username } = req.params
  
  if (!username) {
    return next(new AppError('Username is required', 400))
  }

  const normalizedUsername = username.toLowerCase().trim()
  const existingUser = await User.findOne({ username: normalizedUsername })
  const isAvailable = !existingUser

  sendSuccessResponse(res, 200, { 
    username: normalizedUsername,
    isAvailable 
  }, isAvailable ? 'Username is available' : 'Username is already taken')
})

// Get user security events
export const getSecurityEvents = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('securityEvents loginHistory')
    
    if (!user) {
      return next(new AppError('User not found', 404))
    }

    sendSuccessResponse(res, 200, {
      securityEvents: user.securityEvents.slice(-20), // Last 20 events
      loginHistory: user.loginHistory.slice(-10) // Last 10 logins
    }, 'Security events retrieved successfully')
  } catch (error) {
    logger.error('Get security events error:', {
      error: error.message,
      userId: req.user.id
    })
    return next(new AppError('Failed to retrieve security events', 500))
  }
})

// Enable two-factor authentication
export const enableTwoFactorAuth = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  if (user.twoFactorAuth.enabled) {
    return next(new AppError('Two-factor authentication is already enabled', 400))
  }

  // Generate secret and backup codes
  const secret = crypto.randomBytes(32).toString('hex')
  const backupCodes = Array.from({ length: 10 }, () => 
    crypto.randomBytes(4).toString('hex').toUpperCase()
  )

  user.twoFactorAuth = {
    enabled: true,
    secret,
    backupCodes
  }

  await user.save({ validateBeforeSave: false })

  logger.info(`Two-factor authentication enabled for user: ${user.email}`)

  sendSuccessResponse(res, 200, {
    backupCodes,
    message: 'Please save these backup codes in a secure location'
  }, 'Two-factor authentication enabled successfully')
})

// Disable two-factor authentication
export const disableTwoFactorAuth = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  // Verify current password
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError('Current password is incorrect', 401))
  }

  user.twoFactorAuth = {
    enabled: false,
    secret: undefined,
    backupCodes: []
  }

  await user.save({ validateBeforeSave: false })

  logger.info(`Two-factor authentication disabled for user: ${user.email}`)

  sendSuccessResponse(res, 200, null, 'Two-factor authentication disabled successfully')
})