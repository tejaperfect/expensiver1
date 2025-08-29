// Utility function to clean up localStorage
export const cleanupLocalStorage = () => {
  const token = localStorage.getItem('token')
  
  // Remove invalid tokens
  if (token === 'undefined' || token === 'null' || token === '' || !token) {
    localStorage.removeItem('token')
    console.log('Removed invalid token from localStorage')
  }
}

// Call this on app initialization
cleanupLocalStorage()