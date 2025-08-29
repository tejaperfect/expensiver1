import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Button from '../common/Button'

const UPIAppSelector = ({ 
  amount, 
  recipient, 
  description, 
  onAppSelect, 
  onClose 
}) => {
  const [selectedApp, setSelectedApp] = useState(null)
  const [isDetecting, setIsDetecting] = useState(true)
  const [installedApps, setInstalledApps] = useState([])

  // Popular UPI apps with their details
  const upiApps = [
    {
      id: 'googlepay',
      name: 'Google Pay',
      packageName: 'com.google.android.apps.nbu.paisa.user',
      scheme: 'tez://upi/pay',
      icon: '🟢',
      color: 'from-green-500 to-green-600',
      description: 'Fast & secure payments'
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      packageName: 'com.phonepe.app',
      scheme: 'phonepe://pay',
      icon: '🟣',
      color: 'from-purple-500 to-purple-600',
      description: 'Digital wallet & payments'
    },
    {
      id: 'paytm',
      name: 'Paytm',
      packageName: 'net.one97.paytm',
      scheme: 'paytmmp://pay',
      icon: '🔵',
      color: 'from-blue-500 to-blue-600',
      description: 'Payments & financial services'
    },
    {
      id: 'bhim',
      name: 'BHIM UPI',
      packageName: 'in.org.npci.upiapp',
      scheme: 'bhim://pay',
      icon: '🇮🇳',
      color: 'from-orange-500 to-orange-600',
      description: 'Government UPI app'
    },
    {
      id: 'amazonpay',
      name: 'Amazon Pay',
      packageName: 'in.amazon.mShop.android.shopping',
      scheme: 'amazonpay://pay',
      icon: '🟠',
      color: 'from-orange-400 to-orange-500',
      description: 'Shop & pay with Amazon'
    },
    {
      id: 'freecharge',
      name: 'Freecharge',
      packageName: 'com.freecharge.android',
      scheme: 'freecharge://pay',
      icon: '🔷',
      color: 'from-blue-400 to-blue-500',
      description: 'Mobile recharge & payments'
    },
    {
      id: 'mobikwik',
      name: 'MobiKwik',
      packageName: 'com.mobikwik_new',
      scheme: 'mobikwik://pay',
      icon: '🔴',
      color: 'from-red-500 to-red-600',
      description: 'Digital wallet & UPI'
    },
    {
      id: 'yono',
      name: 'YONO SBI',
      packageName: 'com.sbi.lotza',
      scheme: 'yonosbi://pay',
      icon: '🏦',
      color: 'from-blue-600 to-blue-700',
      description: 'SBI official app'
    }
  ]

  // Detect installed UPI apps (this is a simulation for web)
  useEffect(() => {
    const detectInstalledApps = async () => {
      setIsDetecting(true)
      
      // Simulate detection delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // For web, we'll show all apps as "available"
      // In a real mobile app, you would check which apps are actually installed
      const availableApps = upiApps.map(app => ({
        ...app,
        isInstalled: Math.random() > 0.3, // 70% chance of being "installed"
        isRecommended: ['googlepay', 'phonepe', 'paytm'].includes(app.id)
      }))
      
      setInstalledApps(availableApps)
      setIsDetecting(false)
    }

    detectInstalledApps()
  }, [])

  const handleAppSelect = (app) => {
    setSelectedApp(app)
    
    // Generate UPI URL for the selected app
    const params = new URLSearchParams({
      pa: recipient?.upiId || 'expensiver@upi',
      pn: recipient?.name || 'Expensiver',
      am: amount.toString(),
      cu: 'INR',
      tn: description || 'Payment via Expensiver',
    })
    
    const upiUrl = `${app.scheme}?${params.toString()}`
    
    // Call the callback with app and URL
    onAppSelect(app, upiUrl)
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const openAppStore = (app) => {
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${app.packageName}`
    window.open(playStoreUrl, '_blank')
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
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Choose UPI App</h3>
              <p className="text-blue-100 text-sm">Pay {formatAmount(amount)}</p>
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
          {isDetecting ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Detecting UPI Apps
              </h3>
              <p className="text-gray-500">
                Checking which payment apps are available...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recommended Apps */}
              {installedApps.some(app => app.isRecommended && app.isInstalled) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-yellow-500 mr-2">⭐</span>
                    Recommended
                  </h4>
                  <div className="grid gap-3">
                    {installedApps
                      .filter(app => app.isRecommended && app.isInstalled)
                      .map((app) => (
                        <motion.button
                          key={app.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleAppSelect(app)}
                          className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                          <div className={`w-12 h-12 bg-gradient-to-r ${app.color} rounded-full flex items-center justify-center text-white text-xl mr-4`}>
                            {app.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                              {app.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {app.description}
                            </div>
                          </div>
                          <div className="text-blue-600">
                            →
                          </div>
                        </motion.button>
                      ))}
                  </div>
                </div>
              )}

              {/* Installed Apps */}
              {installedApps.some(app => app.isInstalled && !app.isRecommended) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    Installed Apps
                  </h4>
                  <div className="grid gap-3">
                    {installedApps
                      .filter(app => app.isInstalled && !app.isRecommended)
                      .map((app) => (
                        <motion.button
                          key={app.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleAppSelect(app)}
                          className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                          <div className={`w-12 h-12 bg-gradient-to-r ${app.color} rounded-full flex items-center justify-center text-white text-xl mr-4`}>
                            {app.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                              {app.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {app.description}
                            </div>
                          </div>
                          <div className="text-blue-600">
                            →
                          </div>
                        </motion.button>
                      ))}
                  </div>
                </div>
              )}

              {/* Not Installed Apps */}
              {installedApps.some(app => !app.isInstalled) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-gray-400 mr-2">📱</span>
                    Available to Install
                  </h4>
                  <div className="grid gap-3">
                    {installedApps
                      .filter(app => !app.isInstalled)
                      .map((app) => (
                        <motion.div
                          key={app.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center p-4 border-2 border-gray-100 rounded-lg bg-gray-50"
                        >
                          <div className={`w-12 h-12 bg-gradient-to-r ${app.color} rounded-full flex items-center justify-center text-white text-xl mr-4 opacity-60`}>
                            {app.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-gray-600">
                              {app.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {app.description}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAppStore(app)}
                            className="text-blue-600 border-blue-200"
                          >
                            Install
                          </Button>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}

              {/* No Apps Found */}
              {installedApps.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No UPI Apps Found
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Install a UPI app to make payments
                  </p>
                  <Button
                    onClick={() => openAppStore(upiApps[0])}
                    className="bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    Install Google Pay
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Payment Details */}
          {!isDetecting && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Payment Details:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold">{formatAmount(amount)}</span>
                </div>
                {recipient && (
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-semibold">{recipient.name}</span>
                  </div>
                )}
                {description && (
                  <div className="text-xs text-gray-500 mt-2">
                    {description}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default UPIAppSelector