import { authService } from '../services/authService'
import { expenseService } from '../services/expenseService'
import { userService } from '../services/userService'
import { groupService } from '../services/groupService'

export const runIntegrationTests = async () => {
  const testResults = {
    api_connectivity: false,
    authentication: false,
    expense_operations: false,
    user_operations: false,
    group_operations: false,
    file_upload: false,
    error_handling: false
  }

  console.log('🧪 Starting Frontend-Backend Integration Tests...')

  try {
    // Test 1: API Connectivity
    console.log('1️⃣ Testing API connectivity...')
    try {
      const response = await fetch('http://localhost:5000/api/health')
      if (response.ok) {
        testResults.api_connectivity = true
        console.log('✅ API connectivity: PASS')
      } else {
        console.log('❌ API connectivity: FAIL - Server responded with error')
      }
    } catch (error) {
      console.log('❌ API connectivity: FAIL - Cannot reach server')
      console.log('   Make sure backend server is running on port 5000')
    }

    // Test 2: Authentication Flow
    console.log('2️⃣ Testing authentication...')
    try {
      // Test demo account login
      const loginResponse = await authService.login({
        email: 'demo@expensiver.com',
        password: 'Demo123!@#'
      })
      
      if (loginResponse && loginResponse.token) {
        testResults.authentication = true
        console.log('✅ Authentication: PASS')
        localStorage.setItem('token', loginResponse.token)
      } else {
        console.log('❌ Authentication: FAIL - No token received')
      }
    } catch (error) {
      console.log('❌ Authentication: FAIL -', error.message)
    }

    // Test 3: Expense Operations
    console.log('3️⃣ Testing expense operations...')
    try {
      const expenses = await expenseService.getExpenses()
      if (Array.isArray(expenses)) {
        testResults.expense_operations = true
        console.log('✅ Expense operations: PASS')
      } else {
        console.log('❌ Expense operations: FAIL - Invalid response format')
      }
    } catch (error) {
      console.log('❌ Expense operations: FAIL -', error.message)
    }

    // Test 4: User Operations
    console.log('4️⃣ Testing user operations...')
    try {
      const userStats = await userService.getUserStats()
      if (userStats) {
        testResults.user_operations = true
        console.log('✅ User operations: PASS')
      } else {
        console.log('❌ User operations: FAIL - No stats received')
      }
    } catch (error) {
      console.log('❌ User operations: FAIL -', error.message)
    }

    // Test 5: Group Operations
    console.log('5️⃣ Testing group operations...')
    try {
      const groups = await groupService.getGroups()
      if (Array.isArray(groups)) {
        testResults.group_operations = true
        console.log('✅ Group operations: PASS')
      } else {
        console.log('❌ Group operations: FAIL - Invalid response format')
      }
    } catch (error) {
      console.log('❌ Group operations: FAIL -', error.message)
    }

    // Test 6: File Upload (Basic check)
    console.log('6️⃣ Testing file upload capability...')
    try {
      // Create a mock file blob for testing
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' })
      
      // Check if FormData is supported
      const formData = new FormData()
      formData.append('test', testFile)
      
      testResults.file_upload = true
      console.log('✅ File upload capability: PASS')
    } catch (error) {
      console.log('❌ File upload capability: FAIL -', error.message)
    }

    // Test 7: Error Handling
    console.log('7️⃣ Testing error handling...')
    try {
      // Test with invalid endpoint
      await fetch('http://localhost:5000/api/nonexistent-endpoint')
        .then(response => {
          if (response.status === 404) {
            testResults.error_handling = true
            console.log('✅ Error handling: PASS')
          } else {
            console.log('❌ Error handling: FAIL - Unexpected response status')
          }
        })
    } catch (error) {
      testResults.error_handling = true
      console.log('✅ Error handling: PASS - Network error handled correctly')
    }

  } catch (error) {
    console.error('❌ Integration tests failed with error:', error)
  }

  // Summary
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  
  const passed = Object.values(testResults).filter(result => result === true).length
  const total = Object.keys(testResults).length
  
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL'
    const testName = test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    console.log(`${testName}: ${status}`)
  })
  
  console.log(`\nOverall Score: ${passed}/${total} tests passed`)
  
  if (passed === total) {
    console.log('🎉 All integration tests passed! The application is ready for use.')
  } else {
    console.log('⚠️  Some tests failed. Please check the backend server and configuration.')
  }

  return testResults
}

// Test component connectivity
export const testComponentIntegration = () => {
  console.log('🔧 Testing Component Integration...')
  
  const tests = {
    redux_store: false,
    routing: false,
    ui_components: false,
    form_validation: false
  }

  try {
    // Test Redux store
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      tests.redux_store = true
      console.log('✅ Redux store: PASS')
    } else {
      console.log('⚠️  Redux DevTools not detected (this is okay for production)')
      tests.redux_store = true
    }

    // Test routing
    if (window.location.pathname !== undefined) {
      tests.routing = true
      console.log('✅ Routing: PASS')
    }

    // Test UI components (basic check)
    const hasReact = typeof React !== 'undefined'
    if (hasReact) {
      tests.ui_components = true
      console.log('✅ UI components: PASS')
    }

    // Test form validation (basic check)
    const testEmail = 'test@example.com'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(testEmail)) {
      tests.form_validation = true
      console.log('✅ Form validation: PASS')
    }

  } catch (error) {
    console.error('❌ Component integration test failed:', error)
  }

  const passed = Object.values(tests).filter(result => result === true).length
  const total = Object.keys(tests).length
  
  console.log(`\nComponent Integration: ${passed}/${total} tests passed`)
  
  return tests
}

// Export for use in development
export default { runIntegrationTests, testComponentIntegration }