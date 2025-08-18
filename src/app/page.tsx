'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session) {
      // Redirect directly to role-based dashboard
      const userRole = session.user.role
      let dashboardUrl = '/dashboard'

      switch (userRole) {
        case 'ADMIN':
          dashboardUrl = '/dashboard/admin'
          break
        case 'MANAGER':
          dashboardUrl = '/dashboard/manager'
          break
        case 'EMPLOYEE':
          dashboardUrl = '/dashboard/employee'
          break
        default:
          dashboardUrl = '/dashboard'
      }

      console.log(`Home page redirecting ${userRole} to ${dashboardUrl}`)
      window.location.href = dashboardUrl
    } else {
      window.location.href = '/auth/signin'
    }
  }, [session, status])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  )
}
