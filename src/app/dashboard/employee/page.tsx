'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  FileText,
  Package,
  Plus,
  Bell,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { canAccessDashboard } from '@/lib/access-control'

interface Stat {
  name: string
  value: string
  change: string
  changeType: 'increase' | 'decrease' | 'neutral'
}

interface RecentRequest {
  id: string
  title: string
  status: string
  amount: string
  date: string
  itemCount: number
}

interface Notification {
  id: string
  title: string
  status: string
  date: string
  message: string
}

interface UserInfo {
  name: string
  department: string
  role: string
}

interface EmployeeDashboardData {
  stats: Stat[]
  recentRequests: RecentRequest[]
  notifications: Notification[]
  userInfo: UserInfo
}

const getStatConfig = (name: string) => {
  const configs = {
    'My Requests': { icon: FileText, color: 'bg-blue-500' },
    'Pending Requests': { icon: Clock, color: 'bg-yellow-500' },
    'Approved Requests': { icon: CheckCircle, color: 'bg-green-500' },
    'Monthly Spending': { icon: TrendingUp, color: 'bg-purple-500' },
  }
  return configs[name as keyof typeof configs] || { icon: Package, color: 'bg-gray-500' }
}

export default function EmployeeDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Access control check
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canAccessDashboard(session.user.role, 'EMPLOYEE')) {
      router.push('/dashboard')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/employee')
      if (!response.ok) {
        throw new Error('Failed to fetch employee dashboard data')
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading your dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error || 'Failed to load data'}</div>
        </div>
      </DashboardLayout>
    )
  }

  const { stats, recentRequests, notifications, userInfo } = dashboardData

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Personal Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {userInfo.name}! Here's your personal activity overview.
            </p>
            <p className="text-sm text-gray-500">
              {userInfo.department} Department • {userInfo.role}
            </p>
          </div>
          <Link
            href="/requests?action=create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const config = getStatConfig(stat.name)
            const IconComponent = config.icon
            return (
              <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`${config.color} p-3 rounded-md`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stat.value}
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">
                      {stat.change}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  My Recent Requests
                </h3>
                <Link
                  href="/requests?filter=my"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentRequests.length > 0 ? (
                  recentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{request.title}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{request.amount}</span>
                          <span className="mx-2">•</span>
                          <span>{request.itemCount} items</span>
                          <span className="mx-2">•</span>
                          <span>{request.date}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No requests yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first request.</p>
                    <div className="mt-6">
                      <Link
                        href="/requests?action=create"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Request
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Recent Notifications
              </h3>
              <div className="space-y-3">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {notification.status === 'APPROVED' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                    <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/requests?action=create"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Create Request</p>
                  <p className="text-sm text-gray-500">Submit a new supply request</p>
                </div>
              </Link>
              <Link
                href="/inventory"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Browse Inventory</p>
                  <p className="text-sm text-gray-500">View available items</p>
                </div>
              </Link>
              <Link
                href="/requests?filter=my"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">My Requests</p>
                  <p className="text-sm text-gray-500">Track your requests</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
