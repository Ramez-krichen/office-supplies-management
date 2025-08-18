'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from './sidebar'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import NotificationBadge from '@/components/admin/NotificationBadge'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/auth/signin')
  }, [session, status, router])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Office Supplies</h1>
            {session?.user?.role === 'ADMIN' && <NotificationBadge />}
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block bg-white shadow-sm border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              {session?.user?.role === 'ADMIN' && <NotificationBadge />}
              <div className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content area */}
        <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
          "p-4 sm:p-6"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}
