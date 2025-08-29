import React, { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store/store'
import { useDispatch, useSelector } from 'react-redux'
import { verifyToken } from './store/slices/authSlice'
import socketService from './services/socketService'

// Cleanup localStorage on app start
import './utils/cleanup'

// Performance optimizations
import ErrorBoundary from './components/common/ErrorBoundary'
import { usePerformanceMonitor } from './utils/performance'

// Immediately needed components
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'

// Lazy loaded components for better performance
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const BudgetPage = lazy(() => import('./pages/BudgetPage'))
const GroupsPage = lazy(() => import('./pages/GroupsPage'))
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))

// Enhanced lazy loading wrapper with error handling
const LazyWrapper = ({ children }) => (
  <Suspense 
    fallback={
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    }
  >
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  </Suspense>
)

// Main App Component
function AppContent() {
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth)
  const { logPerformance } = usePerformanceMonitor('AppContent')

  useEffect(() => {
    // Verify token on app start with performance monitoring
    logPerformance('tokenVerification', () => {
      const token = localStorage.getItem('token')
      if (token) {
        dispatch(verifyToken())
      }
    })
    
    // Initialize socket connection
    socketService.connect()
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect()
    }
  }, [dispatch, logPerformance])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
          />
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <ExpensesPage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <WalletPage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/budget" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <BudgetPage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <GroupsPage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/groups/:id" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <GroupDetailPage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <AnalyticsPage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <ProfilePage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Layout>
                  <LazyWrapper>
                    <SettingsPage />
                  </LazyWrapper>
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/success" 
            element={
              <ProtectedRoute>
                <LazyWrapper>
                  <PaymentSuccessPage />
                </LazyWrapper>
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

// App wrapper with Redux Provider and Error Boundary
function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
  )
}

export default App
