'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  FileText,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  Award,
  Target
} from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  status: string
  amount: string
  date: string
  priority: string
  itemCount: number
}

interface DepartmentUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  lastSignIn: string | null
}

interface TopRequester {
  name: string
  email: string
  requestCount: number
  totalSpending: number
}

interface DepartmentInfo {
  name: string
  totalSpending: number
  monthlySpending: number
  quarterlySpending: number
}

interface DepartmentDashboardData {
  stats: Stat[]
  recentRequests: RecentRequest[]
  departmentUsers: DepartmentUser[]
  topRequesters: TopRequester[]
  departmentInfo: DepartmentInfo
}

const getStatConfig = (name: string) => {
  const configs = {
    'Total Requests': { icon: FileText, color: 'bg-blue-500' },
    'Team Members': { icon: Users, color: 'bg-green-500' },
    'Approval Rate': { icon: CheckCircle, color: 'bg-purple-500' },
    'Monthly Spending': { icon: TrendingUp, color: 'bg-indigo-500' },
    'Avg Approval Time': { icon: Clock, color: 'bg-yellow-500' },
  }
  return configs[name as keyof typeof configs] || { icon: FileText, color: 'bg-gray-500' }
}

function DepartmentDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [dashboardData, setDashboardData] = useState<DepartmentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [availableDepartments, setAvailableDepartments] = useState<Array<{id: string, name: string, code: string}>>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)

  // Fetch available departments
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true)
      const response = await fetch('/api/departments/overview')
      if (response.ok) {
        const data = await response.json()
        setAvailableDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoadingDepartments(false)
    }
  }

  // Access control check
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!canAccessDashboard(session.user.role, 'DEPARTMENT')) {
      router.push('/dashboard')
      return
    }

    // Check for department parameter in URL first, then fall back to user's department
    const departmentParam = searchParams.get('department')
    if (departmentParam) {
      setSelectedDepartment(decodeURIComponent(departmentParam))
    } else if (session?.user?.department) {
      setSelectedDepartment(session.user.department)
    }
  }, [session, status, router, searchParams])

  useEffect(() => {
    if (selectedDepartment) {
      fetchDashboardData()
    }
  }, [selectedDepartment])

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const url = selectedDepartment 
        ? `/api/dashboard/department?department=${encodeURIComponent(selectedDepartment)}`
        : '/api/dashboard/department'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch department dashboard data')
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

  const { stats, recentRequests, departmentUsers, topRequesters, departmentInfo } = dashboardData

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-yellow-100 text-yellow-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'EMPLOYEE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Department Dashboard
            </h1>
            <p className="text-gray-600">
              Detailed department operations and performance analytics
            </p>
            <p className="text-sm text-gray-500">
              {departmentInfo.name} Department
            </p>
          </div>
          <div className="flex space-x-3">
            {session?.user?.role === 'ADMIN' && (
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={loadingDepartments}
              >
                <option value="">Select Department</option>
                {availableDepartments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            )}
            {(() => {
              const deptForReport = selectedDepartment || departmentInfo?.name || ''
              const reportsHref = deptForReport
                ? `/reports?department=${encodeURIComponent(deptForReport)}`
                : '/reports'
              return (
                <Link
                  href={reportsHref}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Link>
              )
            })()}
          </div>
        </div>

        {/* Department Summary */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Spending</h3>
              <p className="text-3xl font-bold">${departmentInfo.totalSpending.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Monthly Spending</h3>
              <p className="text-3xl font-bold">${departmentInfo.monthlySpending.toFixed(2)}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Quarterly Spending</h3>
              <p className="text-3xl font-bold">${departmentInfo.quarterlySpending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
                          <span>{request.requester}</span>
                          <span className="mx-2">•</span>
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recent requests</h3>
                    <p className="mt-1 text-sm text-gray-500">Department requests will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Requesters */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-500" />
                Top Requesters (Quarterly)
              </h3>
              <div className="space-y-3">
                {topRequesters.length > 0 ? (
                  topRequesters.map((requester, index) => (
                    <div key={requester.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{requester.name}</p>
                          <p className="text-xs text-gray-500">{requester.requestCount} requests</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${requester.totalSpending.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No requester data available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Department Team */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Department Team
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentUsers.length > 0 ? (
                departmentUsers.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{user.email}</p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.lastSignIn ? new Date(user.lastSignIn).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-6">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                  <p className="mt-1 text-sm text-gray-500">Department team members will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DepartmentDashboardPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading department dashboard...</div>
        </div>
      </DashboardLayout>
    }>
      <DepartmentDashboardContent />
    </Suspense>
  )
}
