'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  FileText,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
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

const getStatConfig = (name: string) => {
  const configs = {
    'Department Requests': { icon: FileText, color: 'bg-blue-500' },
    'Pending Approvals': { icon: Clock, color: 'bg-yellow-500' },
    'Team Members': { icon: Users, color: 'bg-green-500' },
    'Monthly Spending': { icon: TrendingUp, color: 'bg-purple-500' },
  }
  return configs[name as keyof typeof configs] || { icon: FileText, color: 'bg-gray-500' }
}

export default function ManagerDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Access control check
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canAccessDashboard(session.user.role, 'MANAGER')) {
      router.push('/dashboard')
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/manager')
      if (!response.ok) {
        throw new Error('Failed to fetch manager dashboard data')
      }
      const data = await response.json()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (requestId: string, action: 'approve' | 'reject') => {
    console.log(`🔧 Manager Button clicked: ${action} for request ${requestId}`)

    try {
      // First check if we have a valid session
      console.log('🔐 Checking session status...')
      const sessionResponse = await fetch('/api/auth/session')
      console.log(`📡 Session check status: ${sessionResponse.status}`)

      if (!sessionResponse.ok) {
        console.error('❌ No valid session found')
        toast.error('Please log in again to continue')
        window.location.href = '/auth/signin'
        return
      }

      const sessionData = await sessionResponse.json()
      console.log('✅ Session data:', sessionData)

      if (!sessionData?.user) {
        console.error('❌ No user in session')
        toast.error('Please log in again to continue')
        window.location.href = '/auth/signin'
        return
      }

      const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
      let comments = ''

      // For rejections, prompt for a reason
      if (action === 'reject') {
        comments = prompt('Please provide a reason for rejection:') || ''
        if (!comments.trim()) {
          toast.error('A reason is required for rejection.')
          return
        }
      }

      console.log(`📡 Making API call to /api/requests/${requestId}/approve`)
      console.log(`📦 Payload:`, { status, comments })

      const response = await fetch(`/api/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin', // Ensure cookies are sent
        body: JSON.stringify({ status, comments })
      })

      console.log(`📡 API Response status: ${response.status}`)
      console.log(`📡 API Response headers:`, Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        try {
          const responseText = await response.text()
          console.log(`📄 Raw response text:`, responseText)

          if (!responseText || responseText.trim() === '') {
            console.error(`❌ Empty response received`)
            toast.error(`Server returned empty response`)
            return
          }

          let data
          try {
            data = JSON.parse(responseText)
          } catch (parseError) {
            console.error(`❌ Failed to parse response as JSON:`, parseError)
            console.error(`❌ Response text was:`, responseText)
            toast.error(`Invalid response format from server`)
            return
          }

          console.log(`✅ Success response:`, data)

          if (data && typeof data === 'object') {
            toast.success(data.message || `Request ${action}d successfully`)
            // Refresh dashboard data
            fetchDashboardData()
          } else {
            console.error(`❌ Unexpected response format:`, data)
            toast.error(`Unexpected response format`)
          }
        } catch (responseError) {
          console.error(`❌ Error reading response:`, responseError)
          toast.error(`Error reading server response`)
        }
      } else {
        try {
          const errorText = await response.text()
          console.log(`📄 Error response text:`, errorText)

          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch (parseError) {
            console.error(`❌ Failed to parse error response:`, parseError)
            errorData = { error: `Server error (${response.status})` }
          }

          console.error(`❌ Error response:`, errorData)

          // Handle specific error cases
          if (response.status === 401) {
            toast.error('Session expired. Please log in again.')
            window.location.href = '/auth/signin'
          } else if (response.status === 403) {
            toast.error('You do not have permission to perform this action.')
          } else {
            toast.error(errorData.error || `Failed to ${action} request`)
          }
        } catch (errorResponseError) {
          console.error(`❌ Error reading error response:`, errorResponseError)
          toast.error(`Failed to ${action} request`)
        }
      }
    } catch (error) {
      console.error('❌ Error processing approval:', error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(`An error occurred while processing the ${action}`)
      }
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

  if (error || !dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error || 'Failed to load data'}</div>
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
        return 'text-red-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      case 'LOW':
        return 'text-green-600'
      default:
        return 'text-gray-600'
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
          <div className="flex space-x-3">
            <Link
              href="/dashboard/department"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Department View
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Link>
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
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Pending Approvals
                </h3>
                <Link
                  href="/requests?status=pending"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all
                </Link>
              </div>
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
                        <span className={`text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {request.amount} • {request.itemCount} items
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproval(request.id, 'approve')}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproval(request.id, 'reject')}
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
                  <div className="text-center py-6">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                    <p className="mt-1 text-sm text-gray-500">No pending approvals at the moment.</p>
                  </div>
                )}
              </div>
            </div>
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
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
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
