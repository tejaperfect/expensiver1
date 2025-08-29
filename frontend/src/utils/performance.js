import { useMemo, useCallback, useRef, useEffect, useState } from 'react'

// Custom hook for debounced values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Custom hook for throttled callbacks
export const useThrottle = (callback, delay) => {
  const lastRan = useRef(Date.now())

  return useCallback(
    (...args) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args)
        lastRan.current = Date.now()
      }
    },
    [callback, delay]
  )
}

// Custom hook for expensive calculations
export const useExpensiveCalculation = (computeFn, deps) => {
  return useMemo(() => {
    console.log('Performing expensive calculation...')
    return computeFn()
  }, deps)
}

// Custom hook for previous value tracking
export const usePrevious = (value) => {
  const ref = useRef()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

// Custom hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    const currentTarget = targetRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [options])

  return [targetRef, isIntersecting]
}

// Virtual scrolling utility for large lists
export const useVirtualScroll = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  const visibleItems = useMemo(() => {
    return items.slice(visibleStart, visibleEnd + 1).map((item, index) => ({
      ...item,
      index: visibleStart + index
    }))
  }, [items, visibleStart, visibleEnd])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleStart * itemHeight

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  }
}

// Memory-efficient cache hook
export const useCache = (maxSize = 100) => {
  const cache = useRef(new Map())

  const get = useCallback((key) => {
    return cache.current.get(key)
  }, [])

  const set = useCallback((key, value) => {
    if (cache.current.size >= maxSize) {
      const firstKey = cache.current.keys().next().value
      cache.current.delete(firstKey)
    }
    cache.current.set(key, value)
  }, [maxSize])

  const has = useCallback((key) => {
    return cache.current.has(key)
  }, [])

  const clear = useCallback(() => {
    cache.current.clear()
  }, [])

  return { get, set, has, clear }
}

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0)
  const startTime = useRef(performance.now())

  useEffect(() => {
    renderCount.current += 1
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`)
      console.log(`Render time: ${performance.now() - startTime.current}ms`)
    }
  })

  const logPerformance = useCallback((operationName, operation) => {
    const start = performance.now()
    const result = operation()
    const end = performance.now()
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} - ${operationName}: ${end - start}ms`)
    }
    
    return result
  }, [componentName])

  return { renderCount: renderCount.current, logPerformance }
}

// Efficient array operations
export const arrayUtils = {
  // Batch update for large arrays
  batchUpdate: (array, updates, batchSize = 1000) => {
    const result = [...array]
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      batch.forEach(update => {
        if (update.index < result.length) {
          result[update.index] = update.value
        }
      })
    }
    return result
  },

  // Memory-efficient filter
  lazyFilter: function* (array, predicate) {
    for (let i = 0; i < array.length; i++) {
      if (predicate(array[i], i)) {
        yield array[i]
      }
    }
  },

  // Efficient pagination
  paginate: (array, page, pageSize) => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return {
      items: array.slice(start, end),
      totalPages: Math.ceil(array.length / pageSize),
      currentPage: page,
      hasNext: end < array.length,
      hasPrev: page > 1
    }
  }
}