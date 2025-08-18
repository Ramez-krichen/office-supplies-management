'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}
