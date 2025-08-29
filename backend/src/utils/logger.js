import { createLogger, format, transports } from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define log format
const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.json()
)

// Create logger instance
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'expensiver-api' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
})

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
      format.printf(({ timestamp, level, message, service, ...meta }) => {
        return `${timestamp} [${service}] ${level}: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`
      })
    )
  }))
}

// Create logs directory if it doesn't exist
import fs from 'fs'
const logsDir = path.join(__dirname, '../../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    }
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData)
    } else {
      logger.info('HTTP Request', logData)
    }
  })
  
  next()
}

// Security logger for suspicious activities
export const securityLogger = {
  logFailedLogin: (email, ip, userAgent) => {
    logger.warn('Failed login attempt', {
      event: 'failed_login',
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    })
  },
  
  logSuccessfulLogin: (userId, email, ip, userAgent) => {
    logger.info('Successful login', {
      event: 'successful_login',
      userId,
      email,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    })
  },
  
  logPasswordReset: (email, ip) => {
    logger.info('Password reset requested', {
      event: 'password_reset_request',
      email,
      ip,
      timestamp: new Date().toISOString()
    })
  },
  
  logSuspiciousActivity: (userId, activity, details) => {
    logger.warn('Suspicious activity detected', {
      event: 'suspicious_activity',
      userId,
      activity,
      details,
      timestamp: new Date().toISOString()
    })
  },
  
  logRateLimitExceeded: (ip, endpoint) => {
    logger.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    })
  }
}

// API logger for tracking API usage
export const apiLogger = {
  logExpenseCreated: (userId, expenseId, amount) => {
    logger.info('Expense created', {
      event: 'expense_created',
      userId,
      expenseId,
      amount,
      timestamp: new Date().toISOString()
    })
  },
  
  logGroupCreated: (userId, groupId, memberCount) => {
    logger.info('Group created', {
      event: 'group_created',
      userId,
      groupId,
      memberCount,
      timestamp: new Date().toISOString()
    })
  },
  
  logPaymentProcessed: (userId, paymentId, amount, method) => {
    logger.info('Payment processed', {
      event: 'payment_processed',
      userId,
      paymentId,
      amount,
      method,
      timestamp: new Date().toISOString()
    })
  },
  
  logFileUpload: (userId, fileName, fileSize, fileType) => {
    logger.info('File uploaded', {
      event: 'file_upload',
      userId,
      fileName,
      fileSize,
      fileType,
      timestamp: new Date().toISOString()
    })
  },
  
  logDataExport: (userId, exportType, recordCount) => {
    logger.info('Data exported', {
      event: 'data_export',
      userId,
      exportType,
      recordCount,
      timestamp: new Date().toISOString()
    })
  }
}

// Performance logger
export const performanceLogger = {
  logSlowQuery: (query, duration, collection) => {
    logger.warn('Slow database query', {
      event: 'slow_query',
      query: JSON.stringify(query),
      duration: `${duration}ms`,
      collection,
      timestamp: new Date().toISOString()
    })
  },
  
  logMemoryUsage: () => {
    const usage = process.memoryUsage()
    logger.info('Memory usage', {
      event: 'memory_usage',
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    })
  }
}

export default logger