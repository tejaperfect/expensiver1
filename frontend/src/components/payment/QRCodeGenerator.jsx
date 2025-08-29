import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const QRCodeGenerator = ({ 
  amount, 
  recipient, 
  description, 
  upiUrl, 
  onClose, 
  onPaymentComplete 
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes timeout
  const [isExpired, setIsExpired] = useState(false)

  // Generate QR code using an API or library
  const generateQRCode = async () => {
    try {
      setIsLoading(true)
      
      // For demo, we'll use a QR code API service
      // In production, you might want to use a library like qrcode
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUrl)}&format=png`
      
      // Create a promise to handle image loading
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Create canvas to convert to data URL
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        setQrDataUrl(canvas.toDataURL())
        setIsLoading(false)
      }
      
      img.onerror = () => {
        // Fallback: create a placeholder QR code
        createPlaceholderQR()
      }
      
      img.src = qrApiUrl
      
    } catch (error) {
      createPlaceholderQR()
    }
  }

  const createPlaceholderQR = () => {
    // Create a simple placeholder QR code pattern
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 300
    canvas.height = 300
    
    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 300, 300)
    
    // Black border
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 300, 20)
    ctx.fillRect(0, 280, 300, 20)
    ctx.fillRect(0, 0, 20, 300)
    ctx.fillRect(280, 0, 20, 300)
    
    // QR pattern (simplified)
    ctx.fillStyle = '#000000'
    for (let i = 30; i < 270; i += 20) {
      for (let j = 30; j < 270; j += 20) {
        if (Math.random() > 0.5) {
          ctx.fillRect(i, j, 15, 15)
        }
      }
    }
    
    // Corner markers
    const drawCornerMarker = (x, y) => {
      ctx.fillStyle = '#000000'
      ctx.fillRect(x, y, 60, 60)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 10, y + 10, 40, 40)
      ctx.fillStyle = '#000000'
      ctx.fillRect(x + 20, y + 20, 20, 20)
    }
    
    drawCornerMarker(30, 30)
    drawCornerMarker(210, 30)
    drawCornerMarker(30, 210)
    
    setQrDataUrl(canvas.toDataURL())
    setIsLoading(false)
  }

  useEffect(() => {
    generateQRCode()
  }, [upiUrl])

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a')
      link.download = `UPI-Payment-QR-${amount}.png`
      link.href = qrDataUrl
      link.click()
    }
  }

  const handleCopyUPILink = () => {
    navigator.clipboard.writeText(upiUrl)
    // You could add a toast notification here
  }

  const handleRefreshQR = () => {
    setIsExpired(false)
    setTimeLeft(300)
    generateQRCode()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Scan to Pay</h3>
              <p className="text-blue-100 text-sm">UPI QR Code</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Details */}
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatAmount(amount)}
            </div>
            {recipient && (
              <div className="text-gray-600">
                To: {recipient.name}
              </div>
            )}
            {description && (
              <div className="text-sm text-gray-500 mt-1">
                {description}
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {isLoading ? (
                <div className="w-72 h-72 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Generating QR Code...</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={qrDataUrl}
                    alt="UPI Payment QR Code"
                    className={`w-72 h-72 rounded-lg border-2 border-gray-200 ${
                      isExpired ? 'opacity-50 grayscale' : ''
                    }`}
                  />
                  {isExpired && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">⏰</div>
                        <div className="font-bold">QR Code Expired</div>
                        <div className="text-sm">Click refresh to generate new</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Timer */}
                  {!isExpired && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                      {formatTime(timeLeft)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">How to pay:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
              <li>2. Tap on "Scan QR" or "Pay by QR"</li>
              <li>3. Point your camera at the QR code above</li>
              <li>4. Verify amount and complete the payment</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isExpired ? (
              <Button
                onClick={handleRefreshQR}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                🔄 Generate New QR Code
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadQR}
                  disabled={isLoading}
                >
                  📥 Download
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyUPILink}
                  disabled={isLoading}
                >
                  📋 Copy Link
                </Button>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              Cancel Payment
            </Button>
          </div>

          {/* Payment Status Check */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-3">
              Waiting for payment confirmation...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPaymentComplete({ status: 'success', message: 'Payment completed successfully!' })}
              className="mt-2 text-green-600"
            >
              ✅ Mark as Paid (Demo)
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default QRCodeGenerator