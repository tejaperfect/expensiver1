import jwt from 'jsonwebtoken'
import { User } from '../models/userModel.js'
import { AppError, asyncHandler } from './errorMiddleware.js'
import { logger, securityLogger } from '../utils/logger.js'

// Protect routes - verify JWT token
export const protect = asyncHandler(async (req, res, next) => {
  let token

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
    logger.debug('Token extracted from Authorization header:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    })
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
    logger.debug('Token extracted from cookie:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    })
  }

  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    logger.warn('No valid token found in request:', {
      hasAuthHeader: !!req.headers.authorization,
      hasCookie: !!req.cookies.jwt,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    return next(new AppError('You are not logged in! Please log in to get access.', 401))
  }

  try {
    // Validate JWT secret
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not set')
      return next(new AppError('Server configuration error', 500))
    }

    // Verify token
    logger.debug('Attempting to verify token:', {
      tokenLength: token.length,
      tokenStart: token.substring(0, 10),
      hasSecret: !!process.env.JWT_SECRET
    })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    logger.debug('Token decoded successfully:', {
      userId: decoded.id,
      iat: new Date(decoded.iat * 1000),
      exp: new Date(decoded.exp * 1000),
      isExpired: decoded.exp < Date.now() / 1000
    })

    // Check if user still exists
    const currentUser = await User.findById(decoded.id)
      .select('+active +accountStatus +passwordChangedAt +loginAttempts +lockUntil')
    
    if (!currentUser) {
      logger.error('User not found for token:', { 
        userId: decoded.id,
        ip: req.ip
      })
      return next(new AppError('The user belonging to this token does no longer exist.', 401))
    }

    logger.debug('User found:', {
      userId: currentUser._id,
      email: currentUser.email,
      active: currentUser.active,
      accountStatus: currentUser.accountStatus,
      isLocked: currentUser.isLocked
    })

    // Check if user is active
    if (!currentUser.active) {
      logger.warn('Inactive user attempted access:', { 
        userId: currentUser._id,
        email: currentUser.email,
        ip: req.ip
      })
      await currentUser.addSecurityEvent('failed_access', req.ip, req.get('User-Agent'), 'Inactive account access attempt')
      return next(new AppError('Your account has been deactivated. Please contact support.', 401))
    }

    // Check account status
    if (currentUser.accountStatus !== 'active') {
      logger.warn('Non-active account attempted access:', {
        userId: currentUser._id,
        email: currentUser.email,
        accountStatus: currentUser.accountStatus,
        ip: req.ip
      })
      await currentUser.addSecurityEvent('failed_access', req.ip, req.get('User-Agent'), `${currentUser.accountStatus} account access attempt`)
      return next(new AppError(`Your account is ${currentUser.accountStatus}. Please contact support.`, 403))
    }

    // Check if account is locked
    if (currentUser.isLocked) {
      logger.warn('Locked account attempted access:', {
        userId: currentUser._id,
        email: currentUser.email,
        lockUntil: currentUser.lockUntil,
        ip: req.ip
      })
      await currentUser.addSecurityEvent('failed_access', req.ip, req.get('User-Agent'), 'Locked account access attempt')
      return next(new AppError('Account is temporarily locked. Please try again later.', 423))
    }

    // Check if user changed password after the token was issued
    if (typeof currentUser.changedPasswordAfter === 'function' && currentUser.passwordChangedAt) {
      const passwordChanged = currentUser.changedPasswordAfter(decoded.iat)
      logger.debug('Password change check:', {
        hasPasswordChangedAt: !!currentUser.passwordChangedAt,
        passwordChangedAt: currentUser.passwordChangedAt,
        tokenIat: new Date(decoded.iat * 1000),
        passwordChanged
      })
      
      if (passwordChanged) {
        logger.warn('Token invalidated due to password change:', {
          userId: currentUser._id,
          email: currentUser.email,
          passwordChangedAt: currentUser.passwordChangedAt,
          tokenIat: new Date(decoded.iat * 1000),
          ip: req.ip
        })
        await currentUser.addSecurityEvent('failed_access', req.ip, req.get('User-Agent'), 'Token invalidated - password changed')
        return next(new AppError('User recently changed password! Please log in again.', 401))
      }
    }

    // Update user activity
    await currentUser.updateOne({
      'stats.lastActivity': Date.now()
    })

    // Grant access to protected route
    req.user = currentUser
    logger.debug('Authentication successful for user:', { 
      userId: currentUser._id,
      email: currentUser.email,
      ip: req.ip
    })
    next()
  } catch (error) {
    logger.error('Auth middleware error:', {
      name: error.name,
      message: error.message,
      token: token ? token.substring(0, 20) + '...' : 'none',
      hasSecret: !!process.env.JWT_SECRET,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again!', 401))
    } else if (error.name === 'TokenExpiredError') {
      logger.info('Token expired:', {
        expiredAt: error.expiredAt,
        currentTime: new Date(),
        ip: req.ip
      })
      return next(new AppError('Your token has expired! Please log in again.', 401))
    } else if (error.name === 'NotBeforeError') {
      return next(new AppError('Token not active yet. Please log in again!', 401))
    }
    
    return next(new AppError('Authentication failed. Please log in again.', 401))
  }
})

// Restrict to certain roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }
    next()
  }
}

// Optional authentication - doesn't fail if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }

  if (token && token !== 'undefined' && token !== 'null' && token.trim() !== '') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const currentUser = await User.findById(decoded.id)
        .select('+active +accountStatus +passwordChangedAt')
      
      if (currentUser && 
          currentUser.active && 
          currentUser.accountStatus === 'active' &&
          (!currentUser.passwordChangedAt || 
           (typeof currentUser.changedPasswordAfter === 'function' && !currentUser.changedPasswordAfter(decoded.iat)))) {
        req.user = currentUser
        
        // Update last activity
        await currentUser.updateOne({
          'stats.lastActivity': Date.now()
        })
        
        logger.debug('Optional auth successful:', {
          userId: currentUser._id,
          ip: req.ip
        })
      }
    } catch (error) {
      // Silently fail for optional auth
      logger.debug('Optional auth failed:', {
        error: error.message,
        ip: req.ip
      })
    }
  }

  next()
})

// Check if user owns resource
export const checkOwnership = (Model, populatePath = null) => {
  return asyncHandler(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    
    if (populatePath) {
      query = query.populate(populatePath)
    }
    
    const doc = await query
    
    if (!doc) {
      return next(new AppError('No document found with that ID', 404))
    }

    // Check if user owns the resource or is admin
    if (doc.user && doc.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You can only access your own resources', 403))
    }

    // For group resources, check if user is member
    if (doc.members && !doc.members.some(member => member.user.toString() === req.user.id) && req.user.role !== 'admin') {
      return next(new AppError('You are not a member of this group', 403))
    }

    req.resource = doc
    next()
  })
}

// Rate limiting per user with enhanced tracking
export const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map()
  const suspiciousActivity = new Map()

  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return next()
    }

    const userId = req.user.id
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean old entries
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart)
      userRequests.set(userId, requests)
    }

    // Get current request count
    const userRequestCount = userRequests.get(userId)?.length || 0
    
    // Check for suspicious activity (>75% of rate limit)
    if (userRequestCount > maxRequests * 0.75) {
      const suspiciousCount = suspiciousActivity.get(userId) || 0
      suspiciousActivity.set(userId, suspiciousCount + 1)
      
      if (suspiciousCount > 3) {
        await req.user.addSecurityEvent('suspicious_activity', req.ip, req.get('User-Agent'), 
          `High request rate: ${userRequestCount}/${maxRequests}`)
      }
    }
    
    if (userRequestCount >= maxRequests) {
      await req.user.addSecurityEvent('rate_limit_exceeded', req.ip, req.get('User-Agent'), 
        `Rate limit exceeded: ${userRequestCount}/${maxRequests}`)
      securityLogger.logRateLimitExceeded(req.ip, req.originalUrl)
      return next(new AppError('Rate limit exceeded for user', 429))
    }

    // Add current request
    const requests = userRequests.get(userId) || []
    requests.push(now)
    userRequests.set(userId, requests)

    next()
  })
}

// Check if user is verified
export const requireVerification = asyncHandler(async (req, res, next) => {
  if (!req.user.isEmailVerified) {
    await req.user.addSecurityEvent('verification_required', req.ip, req.get('User-Agent'), 
      'Attempted access to verified-only resource')
    return next(new AppError('Please verify your email address to access this resource', 403))
  }
  next()
})

// Check account status
export const checkAccountStatus = asyncHandler(async (req, res, next) => {
  if (req.user.accountStatus === 'suspended') {
    await req.user.addSecurityEvent('suspended_access_attempt', req.ip, req.get('User-Agent'), 
      'Suspended account access attempt')
    return next(new AppError('Your account has been suspended. Please contact support.', 403))
  }
  
  if (req.user.accountStatus === 'pending') {
    await req.user.addSecurityEvent('pending_access_attempt', req.ip, req.get('User-Agent'), 
      'Pending account access attempt')
    return next(new AppError('Your account is pending approval. Please wait for admin approval.', 403))
  }
  
  next()
})

// Logout middleware
export const logout = asyncHandler(async (req, res, next) => {
  try {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    
    if (req.user) {
      await req.user.addSecurityEvent('logout', req.ip, req.get('User-Agent'), 'User logout')
      logger.info(`User logged out: ${req.user.email}`, {
        userId: req.user._id,
        ip: req.ip
      })
    }
  } catch (error) {
    logger.error('Logout middleware error:', {
      error: error.message,
      userId: req.user?._id
    })
  }
  
  next()
})