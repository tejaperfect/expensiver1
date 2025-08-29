import { logger } from '../utils/logger.js'

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404)
  next(error)
}

// Global error handler
export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  logger.error(err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new AppError(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new AppError(message, 400)
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ')
    error = new AppError(message, 400)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again'
    error = new AppError(message, 401)
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again'
    error = new AppError(message, 401)
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large'
    error = new AppError(message, 400)
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected field'
    error = new AppError(message, 400)
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.message = 'Too many requests, please try again later'
    error.statusCode = 429
  }

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error',
      stack: err.stack,
      details: err
    })
  } else {
    // Production error response
    if (error.isOperational) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error'
      })
    } else {
      // Don't leak error details in production
      logger.error('ERROR 💥', err)
      res.status(500).json({
        success: false,
        error: 'Something went wrong!'
      })
    }
  }
}

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Validation error formatter
export const formatValidationError = (errors) => {
  const formattedErrors = {}
  
  errors.forEach(error => {
    const field = error.path || error.param
    if (!formattedErrors[field]) {
      formattedErrors[field] = []
    }
    formattedErrors[field].push(error.msg)
  })
  
  return formattedErrors
}

// Success response helper
export const sendSuccessResponse = (res, statusCode = 200, data = null, message = 'Success') => {
  const response = {
    success: true,
    message
  }
  
  if (data !== null) {
    response.data = data
  }
  
  res.status(statusCode).json(response)
}

// Paginated response helper
export const sendPaginatedResponse = (res, data, pagination, message = 'Success') => {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    }
  })
}

// Error response helper
export const sendErrorResponse = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  const response = {
    success: false,
    error: message
  }
  
  if (errors) {
    response.errors = errors
  }
  
  res.status(statusCode).json(response)
}