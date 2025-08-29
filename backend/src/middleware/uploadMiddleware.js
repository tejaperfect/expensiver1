import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { AppError, asyncHandler } from './errorMiddleware.js'
import { logger, apiLogger } from '../utils/logger.js'
import crypto from 'crypto'

// Create uploads directory if it doesn't exist
const createUploadDir = async (dir) => {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

// Generate unique filename
const generateFileName = (originalName, userId) => {
  const timestamp = Date.now()
  const randomString = crypto.randomBytes(6).toString('hex')
  const ext = path.extname(originalName)
  return `${userId}_${timestamp}_${randomString}${ext}`
}

// Multer storage configuration
const storage = multer.memoryStorage()

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'text/csv': 'csv',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
  }

  if (allowedTypes[file.mimetype]) {
    cb(null, true)
  } else {
    cb(new AppError(`File type ${file.mimetype} is not allowed`, 400), false)
  }
}

// Base multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files
  }
})

// Image processing middleware
export const processImage = (options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 80,
    format = 'jpeg',
    createThumbnail = false,
    thumbnailSize = 150
  } = options

  return asyncHandler(async (req, res, next) => {
    if (!req.file && !req.files) {
      return next()
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'images')
    await createUploadDir(uploadDir)

    const processFile = async (file) => {
      if (!file.mimetype.startsWith('image/')) {
        return file
      }

      const filename = generateFileName(file.originalname, req.user?.id || 'anonymous')
      const filepath = path.join(uploadDir, filename)

      try {
        // Process main image
        await sharp(file.buffer)
          .resize(width, height, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality })
          .toFile(filepath)

        // Create thumbnail if requested
        if (createThumbnail) {
          const thumbnailFilename = `thumb_${filename}`
          const thumbnailPath = path.join(uploadDir, thumbnailFilename)
          
          await sharp(file.buffer)
            .resize(thumbnailSize, thumbnailSize, { 
              fit: 'cover' 
            })
            .jpeg({ quality: 70 })
            .toFile(thumbnailPath)

          file.thumbnailUrl = `/uploads/images/${thumbnailFilename}`
        }

        file.filename = filename
        file.path = filepath
        file.url = `/uploads/images/${filename}`
        
        // Log file upload
        if (req.user) {
          apiLogger.logFileUpload(
            req.user.id,
            file.originalname,
            file.size,
            file.mimetype
          )
        }

        return file
      } catch (error) {
        logger.error('Image processing failed:', error)
        throw new AppError('Failed to process image', 500)
      }
    }

    try {
      if (req.file) {
        req.file = await processFile(req.file)
      }

      if (req.files) {
        if (Array.isArray(req.files)) {
          req.files = await Promise.all(req.files.map(processFile))
        } else {
          // Handle object with field names
          for (const fieldName in req.files) {
            req.files[fieldName] = await Promise.all(
              req.files[fieldName].map(processFile)
            )
          }
        }
      }

      next()
    } catch (error) {
      next(error)
    }
  })
}

// Avatar upload middleware
export const uploadAvatar = [
  upload.single('avatar'),
  processImage({
    width: 400,
    height: 400,
    quality: 85,
    createThumbnail: true,
    thumbnailSize: 100
  })
]

// Multiple image upload middleware
export const uploadImages = [
  upload.array('images', 5),
  processImage({
    width: 1200,
    height: 900,
    quality: 80,
    createThumbnail: true
  })
]

// Document upload middleware (no processing)
export const uploadDocument = asyncHandler(async (req, res, next) => {
  const uploadHandler = upload.single('document')
  
  uploadHandler(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large', 400))
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError('Too many files', 400))
        }
      }
      return next(err)
    }

    if (req.file) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents')
      await createUploadDir(uploadDir)

      const filename = generateFileName(req.file.originalname, req.user?.id || 'anonymous')
      const filepath = path.join(uploadDir, filename)

      try {
        await fs.writeFile(filepath, req.file.buffer)
        
        req.file.filename = filename
        req.file.path = filepath
        req.file.url = `/uploads/documents/${filename}`

        // Log document upload
        if (req.user) {
          apiLogger.logFileUpload(
            req.user.id,
            req.file.originalname,
            req.file.size,
            req.file.mimetype
          )
        }
      } catch (error) {
        logger.error('Document upload failed:', error)
        return next(new AppError('Failed to save document', 500))
      }
    }

    next()
  })
})

// Expense receipt upload
export const uploadReceipt = [
  upload.single('receipt'),
  processImage({
    width: 800,
    height: 1200,
    quality: 85,
    format: 'jpeg'
  })
]

// Bulk file upload with different types
export const uploadMixed = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'images', maxCount: 5 },
  { name: 'documents', maxCount: 3 }
])

// File deletion utility
export const deleteFile = async (filePath) => {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath)
    await fs.unlink(fullPath)
    logger.info(`File deleted: ${filePath}`)
  } catch (error) {
    logger.error(`Failed to delete file ${filePath}:`, error)
  }
}

// Cleanup old files middleware
export const cleanupOldFiles = (maxAge = 24 * 60 * 60 * 1000) => { // 24 hours default
  return asyncHandler(async (req, res, next) => {
    if (req.user?.oldFiles && Array.isArray(req.user.oldFiles)) {
      const cutoffTime = Date.now() - maxAge
      
      for (const fileInfo of req.user.oldFiles) {
        if (fileInfo.uploadedAt < cutoffTime) {
          await deleteFile(fileInfo.path)
        }
      }
    }
    
    next()
  })
}

// File size middleware
export const checkFileSize = (maxSizeInMB = 5) => {
  return (req, res, next) => {
    const maxSize = maxSizeInMB * 1024 * 1024
    
    const checkSize = (file) => {
      if (file.size > maxSize) {
        throw new AppError(`File size cannot exceed ${maxSizeInMB}MB`, 400)
      }
    }

    if (req.file) {
      checkSize(req.file)
    }

    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach(checkSize)
      } else {
        Object.values(req.files).flat().forEach(checkSize)
      }
    }

    next()
  }
}

export { upload }