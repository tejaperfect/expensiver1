import moment from 'moment'

// Currency formatting
export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch (error) {
    // Fallback formatting
    return `${currency} ${parseFloat(amount).toFixed(2)}`
  }
}

// Number formatting
export const formatNumber = (number, locale = 'en-IN', options = {}) => {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(number)
  } catch (error) {
    return parseFloat(number).toFixed(2)
  }
}

// Percentage formatting
export const formatPercentage = (value, decimals = 1) => {
  return `${parseFloat(value).toFixed(decimals)}%`
}

// Date formatting
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  return moment(date).format(format)
}

// Relative time formatting
export const formatRelativeTime = (date) => {
  return moment(date).fromNow()
}

// Time formatting
export const formatTime = (date, format = 'HH:mm') => {
  return moment(date).format(format)
}

// DateTime formatting
export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  return moment(date).format(format)
}

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// Duration formatting
export const formatDuration = (milliseconds) => {
  const duration = moment.duration(milliseconds)
  
  if (duration.asMinutes() < 1) {
    return `${Math.round(duration.asSeconds())}s`
  } else if (duration.asHours() < 1) {
    return `${Math.round(duration.asMinutes())}m`
  } else if (duration.asDays() < 1) {
    return `${Math.round(duration.asHours())}h`
  } else {
    return `${Math.round(duration.asDays())}d`
  }
}

// Phone number formatting
export const formatPhoneNumber = (phone, country = 'IN') => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (country === 'IN' && cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`
  } else if (country === 'IN' && cleaned.length === 12 && cleaned.startsWith('91')) {
    const number = cleaned.substring(2)
    return `+91 ${number.substring(0, 5)} ${number.substring(5)}`
  }
  
  // Generic international format
  return `+${cleaned}`
}

// Credit card formatting
export const formatCreditCard = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
  const matches = cleaned.match(/\d{4,16}/g)
  const match = matches && matches[0] || ''
  const parts = []

  for (let i = 0, len = match.length; i < len; i += 4) {
    parts.push(match.substring(i, i + 4))
  }

  if (parts.length) {
    return parts.join(' ')
  } else {
    return cleaned
  }
}

// Name formatting
export const formatName = (firstName, lastName, middleName = '') => {
  const parts = [firstName, middleName, lastName].filter(part => part && part.trim())
  return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ')
}

// Address formatting
export const formatAddress = (address) => {
  const { street, city, state, zipCode, country } = address
  const parts = [street, city, state, zipCode, country].filter(part => part && part.trim())
  return parts.join(', ')
}

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Title case formatting
export const formatTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

// Camel case to readable format
export const camelCaseToReadable = (str) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

// Snake case to readable format
export const snakeCaseToReadable = (str) => {
  return str
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Format list with proper conjunctions
export const formatList = (items, conjunction = 'and') => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
  
  const lastItem = items.pop()
  return `${items.join(', ')}, ${conjunction} ${lastItem}`
}

// Truncate text
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

// Format JSON for display
export const formatJSON = (obj, indent = 2) => {
  return JSON.stringify(obj, null, indent)
}

// Format error message
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error
  if (error.message) return error.message
  if (error.error) return error.error
  return 'An unknown error occurred'
}

// Format validation errors
export const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(err => err.message || err.msg || err).join(', ')
  }
  
  if (typeof errors === 'object') {
    return Object.values(errors).flat().join(', ')
  }
  
  return errors.toString()
}

// Format expense category
export const formatExpenseCategory = (category) => {
  const categoryMap = {
    food: 'Food & Dining',
    transport: 'Transportation',
    entertainment: 'Entertainment',
    shopping: 'Shopping',
    bills: 'Bills & Utilities',
    health: 'Healthcare',
    education: 'Education',
    travel: 'Travel',
    groceries: 'Groceries',
    fuel: 'Fuel',
    clothing: 'Clothing',
    electronics: 'Electronics',
    home: 'Home & Garden',
    pets: 'Pets',
    gifts: 'Gifts & Donations',
    charity: 'Charity',
    investment: 'Investment',
    insurance: 'Insurance',
    business: 'Business',
    other: 'Other'
  }
  
  return categoryMap[category] || formatTitleCase(category)
}

// Format payment method
export const formatPaymentMethod = (method) => {
  const methodMap = {
    cash: 'Cash',
    card: 'Credit/Debit Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    wallet: 'Digital Wallet',
    cheque: 'Cheque',
    other: 'Other'
  }
  
  return methodMap[method] || formatTitleCase(method)
}

// Format notification priority
export const formatNotificationPriority = (priority) => {
  const priorityMap = {
    low: 'Low Priority',
    medium: 'Medium Priority',
    high: 'High Priority',
    urgent: 'Urgent'
  }
  
  return priorityMap[priority] || formatTitleCase(priority)
}

// Format user role
export const formatUserRole = (role) => {
  const roleMap = {
    user: 'User',
    admin: 'Administrator',
    moderator: 'Moderator'
  }
  
  return roleMap[role] || formatTitleCase(role)
}

// Format status badge
export const formatStatusBadge = (status) => {
  const statusMap = {
    active: { label: 'Active', color: 'green' },
    inactive: { label: 'Inactive', color: 'gray' },
    pending: { label: 'Pending', color: 'yellow' },
    approved: { label: 'Approved', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
    completed: { label: 'Completed', color: 'blue' },
    failed: { label: 'Failed', color: 'red' },
    cancelled: { label: 'Cancelled', color: 'gray' }
  }
  
  return statusMap[status] || { label: formatTitleCase(status), color: 'gray' }
}

// Format expense split type
export const formatSplitType = (splitType) => {
  const splitMap = {
    equal: 'Equal Split',
    exact: 'Exact Amount',
    percentage: 'Percentage',
    by_shares: 'By Shares'
  }
  
  return splitMap[splitType] || formatTitleCase(splitType)
}

// Format compact number (1K, 1M, etc.)
export const formatCompactNumber = (number) => {
  if (number < 1000) return number.toString()
  if (number < 1000000) return `${(number / 1000).toFixed(1)}K`
  if (number < 1000000000) return `${(number / 1000000).toFixed(1)}M`
  return `${(number / 1000000000).toFixed(1)}B`
}

// Format ordinal numbers (1st, 2nd, 3rd, etc.)
export const formatOrdinal = (number) => {
  const j = number % 10
  const k = number % 100
  
  if (j === 1 && k !== 11) return `${number}st`
  if (j === 2 && k !== 12) return `${number}nd`
  if (j === 3 && k !== 13) return `${number}rd`
  return `${number}th`
}

// Format timezone
export const formatTimezone = (timezone) => {
  try {
    const date = new Date()
    const options = { timeZone: timezone, timeZoneName: 'short' }
    return new Intl.DateTimeFormat('en', options)
      .formatToParts(date)
      .find(part => part.type === 'timeZoneName')?.value || timezone
  } catch {
    return timezone
  }
}

// Format metric value with units
export const formatMetric = (value, unit, decimals = 1) => {
  return `${parseFloat(value).toFixed(decimals)} ${unit}`
}

// Format initials
export const formatInitials = (name, maxLength = 2) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, maxLength)
}

// Format search highlight
export const formatSearchHighlight = (text, searchTerm) => {
  if (!searchTerm) return text
  
  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Format URL slug
export const formatSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .trim()
}