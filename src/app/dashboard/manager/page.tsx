'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import Link from 'next/link'
import {
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { safeFetch, safeJsonParse } from '@/lib/api-utils'
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
  requester: string
  department: string
  status: string
  amount: string
  date: string
  priority: string
}

interface PendingApproval {
  id: string
  title: string
  requester: string
  amount: string
  date: string
  priority: string
  itemCount: number
}

interface DepartmentInfo {
  name: string
  managerName: string
  role: string
}

interface ManagerDashboardData {
  stats: Stat[]
  recentRequests: RecentRequest[]
  pendingApprovals: PendingApproval[]
  departmentInfo: DepartmentInfo
}

interface DashboardData {
  stats: Stat[]
  recentRequests: RecentRequest[]
  pendingApprovals: PendingApproval[]
  departmentInfo: DepartmentInfo
}

const getStatConfig = (name: string) => {
  const configs = {
    'Department Requests': { icon: Package, color: 'bg-blue-500' },
    'Pending Approvals': { icon: Clock, color: 'bg-yellow-500' },
    'Team Members': { icon: Users, color: 'bg-green-500' },
    'Monthly Spending': { icon: TrendingUp, color: 'bg-purple-500' },
  }
  return configs[name as keyof typeof configs] || { icon: Package, color: 'bg-gray-500' }
}

export default function ManagerDashboardPage() {
  const { data: session, status } = useSession()
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Access control check
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      redirect('/auth/signin')
      return
    }

    if (!canAccessDashboard(session.user.role, 'MANAGER')) {
      redirect('/dashboard')
      return
    }

    fetchDashboardData()
  }, [session, status])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const data = await safeFetch('/api/dashboard/manager') as DashboardData
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string, approved: boolean, comments?: string) => {
    if (!session?.user?.id) {
      toast.error('Please log in again')
      return
    }

    try {
      console.log('🔐 Checking session status...')
      const sessionResponse = await fetch('/api/auth/session')
      console.log(`📡 Session check status: ${sessionResponse.status}`)
      
      if (!sessionResponse.ok || sessionResponse.status === 401) {
        console.log('❌ Session invalid, redirecting to login')
        window.location.href = '/auth/signin'
        return
      }

      const sessionData = await safeJsonParse(sessionResponse) as { user?: { id?: string } }
      console.log('✅ Session data:', sessionData)

      if (!sessionData.user?.id) {
        console.log('❌ No user in session, redirecting to login')
        window.location.href = '/auth/signin'
        return
      }

      console.log(`📤 ${approved ? 'Approving' : 'Rejecting'} request ${requestId}...`)

      const data = await safeFetch(`/api/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved,
          comments: comments || '',
          managerId: session.user.id
        }),
      })

      console.log('✅ Request approval response:', data)
      const result = data as { message?: string }
      toast.success(result.message || `Request ${approved ? 'approved' : 'rejected'} successfully`)
      
      // Refresh dashboard data
      fetchDashboardData()
    } catch (error) {
      console.error('❌ Error approving request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process request')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading department dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Failed to load dashboard data</div>
        </div>
      </DashboardLayout>
    )
  }

  const { stats, recentRequests, pendingApprovals, departmentInfo } = dashboardData

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

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
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
              Manager Dashboard
            </h1>
            <p className="text-gray-600">
              Department oversight and approval management
            </p>
            <p className="text-sm text-gray-500">
              {departmentInfo.name} • {departmentInfo.managerName}
            </p>
          </div>
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
          {/* Pending Approvals */}
          <div className="bg-white shadow rounded-lg">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                    <CardTitle>Pending Approvals</CardTitle>
                  </div>
                  <Link href="/requests?status=pending">
                    <Button variant="ghost" size="sm">View all</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApprovals.length > 0 ? (
                    pendingApprovals.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{request.title}</p>
                            <p className="text-xs text-gray-500">
                              by {request.requester} • {request.date}
                            </p>
                          </div>
                          <div className="text-xs">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {request.amount} • {request.itemCount} items
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproveRequest(request.id, true)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Please provide a reason for rejection:') || ''
                                if (reason.trim()) {
                                  handleApproveRequest(request.id, false, reason)
                                } else {
                                  toast.error('A reason is required for rejection.')
                                }
                              }}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-green-600 text-lg">
                      All caught up!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Department Requests */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Department Requests
                </h3>
                <Link
                  href="/requests"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                {recentRequests.length > 0 ? (
                  recentRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{request.title}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{request.requester}</span>
                          <span className="mx-2">•</span>
                          <span>{request.amount}</span>
                          <span className="mx-2">•</span>
                          <span>{request.date}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent requests</h3>
                    <p className="mt-1 text-sm text-gray-500">Department requests will appear here.</p>
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
              Manager Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Link
                href="/requests?status=pending"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Review Requests</p>
                  <p className="text-sm text-gray-500">Approve or reject</p>
                </div>
              </Link>
              <Link
                href="/dashboard/department"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Department View</p>
                  <p className="text-sm text-gray-500">Detailed analytics</p>
                </div>
              </Link>
              <Link
                href="/users"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Team Management</p>
                  <p className="text-sm text-gray-500">Manage team members</p>
                </div>
              </Link>
              <Link
                href="/reports"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Generate Reports</p>
                  <p className="text-sm text-gray-500">Department analytics</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
