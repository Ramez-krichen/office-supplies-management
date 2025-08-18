'use client'

import { SessionProvider } from 'next-auth/react'

interface AuthProviderProps {
  children: React.ReactNode
}

// Create a session provider that handles errors gracefully
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
