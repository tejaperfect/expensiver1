import React, { Suspense, lazy } from 'react'
import LoadingSpinner from './LoadingSpinner'

// Lazy load heavy components for better performance
const LazyAnalyticsPage = lazy(() => import('../../pages/AnalyticsPage'))
const LazyGroupDetailPage = lazy(() => import('../../pages/GroupDetailPage'))
const LazySettingsPage = lazy(() => import('../../pages/SettingsPage'))

// HOC for lazy loading with error boundary
const withLazyLoading = (LazyComponent, fallback = <LoadingSpinner />) => {
  return React.forwardRef((props, ref) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ))
}

// Pre-configured lazy components
export const AnalyticsPageLazy = withLazyLoading(LazyAnalyticsPage)
export const GroupDetailPageLazy = withLazyLoading(LazyGroupDetailPage)
export const SettingsPageLazy = withLazyLoading(LazySettingsPage)

// Utility for dynamic imports with retry logic
export const loadComponentWithRetry = (importFn, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attemptLoad = (attemptNumber) => {
      importFn()
        .then(resolve)
        .catch((error) => {
          if (attemptNumber < retries) {
            console.warn(`Component load failed, retrying... (${attemptNumber}/${retries})`)
            setTimeout(() => attemptLoad(attemptNumber + 1), 1000)
          } else {
            reject(error)
          }
        })
    }
    attemptLoad(1)
  })
}

export default {
  AnalyticsPageLazy,
  GroupDetailPageLazy,
  SettingsPageLazy,
  withLazyLoading,
  loadComponentWithRetry
}