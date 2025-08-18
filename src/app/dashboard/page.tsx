'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  FileText,
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDefaultDashboard } from '@/lib/access-control'

interface Stat {
  name: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
}

interface RecentRequest {
  id: string
  title: string
  requester: string
  status: string
  amount: string
  date: string
}

interface DashboardData {
  stats: Stat[]
  recentRequests: RecentRequest[]
}

const getStatConfig = (name: string) => {
  const configs = {
    'Pending Requests': { icon: FileText, color: 'bg-blue-500' },
    'Low Stock Items': { icon: AlertTriangle, color: 'bg-red-500' },
    'Active Orders': { icon: ShoppingCart, color: 'bg-green-500' },
    'Total Items': { icon: Package, color: 'bg-purple-500' },
  }
  return configs[name as keyof typeof configs] || { icon: Package, color: 'bg-gray-500' }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRoleBasedOptions, setShowRoleBasedOptions] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Redirect immediately to role-based dashboard using window.location for faster redirect
    const defaultDashboard = getDefaultDashboard(session.user.role)
    if (defaultDashboard !== '/dashboard') {
      console.log(`Redirecting from /dashboard to ${defaultDashboard}`)
      window.location.href = defaultDashboard
      return
    } else {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading || showRoleBasedOptions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Office Supplies Management
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Choose your dashboard view based on your role
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Employee Dashboard */}
              {session?.user?.role && ['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(session.user.role) && (
                <Link
                  href="/dashboard/employee"
                  className="group p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-300"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🟩</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Dashboard</h3>
                    <p className="text-sm text-gray-600">View your personal requests and activities</p>
                  </div>
                </Link>
              )}

              {/* Manager Dashboard */}
              {session?.user?.role && ['MANAGER', 'ADMIN'].includes(session.user.role) && (
                <Link
                  href="/dashboard/manager"
                  className="group p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🟧</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Manager Dashboard</h3>
                    <p className="text-sm text-gray-600">Manage department requests and approvals</p>
                  </div>
                </Link>
              )}

              {/* Department Dashboard */}
              {session?.user?.role && ['MANAGER', 'ADMIN'].includes(session.user.role) && (
                <Link
                  href="/dashboard/department"
                  className="group p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🟧</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Department Dashboard</h3>
                    <p className="text-sm text-gray-600">Department analytics and performance</p>
                  </div>
                </Link>
              )}

              {/* Admin Dashboard */}
              {session?.user?.role === 'ADMIN' && (
                <Link
                  href="/dashboard/admin"
                  className="group p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-300"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-3">🟪</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">System Dashboard</h3>
                    <p className="text-sm text-gray-600">Complete system administration</p>
                  </div>
                </Link>
              )}
            </div>

            <div className="mt-8">
              <p className="text-sm text-gray-500">
                Redirecting to your default dashboard in a few seconds...
              </p>
              <button
                onClick={() => {
                  setShowRoleBasedOptions(false)
                  fetchDashboardData()
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-500 underline"
              >
                Or continue to main dashboard
              </button>
            </div>
          </div>
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

  const { stats, recentRequests } = dashboardData

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to the Office Supplies Management System</p>
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
          )})
        }</div>

        {/* Recent Requests */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Requests
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRequests.map((request) => {
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
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.requester}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.date}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
