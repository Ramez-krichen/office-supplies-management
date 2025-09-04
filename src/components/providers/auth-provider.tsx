'use client'

import { SessionProvider } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface AuthProviderProps {
  children: React.ReactNode
}

// Create a session provider that handles errors gracefully
export function AuthProvider({ children }: AuthProviderProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Handle NextAuth-specific fetch errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || event.message
      if (error && typeof error === 'string') {
        if (error.includes('CLIENT_FETCH_ERROR') || 
            error.includes('Unexpected token') ||
            error.includes('not valid JSON')) {
          console.warn('NextAuth fetch error detected, will retry...', error)
          setHasError(true)
          // Reset error state after a delay to allow retry
          setTimeout(() => setHasError(false), 2000)
        }
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Initializing authentication...</p>
          <div className="mt-2 animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <SessionProvider 
      refetchInterval={0} 
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
