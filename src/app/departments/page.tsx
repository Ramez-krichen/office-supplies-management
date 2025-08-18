'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  Edit,
  BarChart3
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import Link from 'next/link'

interface DepartmentOverview {
  id: string
  code: string
  name: string
  description?: string
  budget?: number
  status: string
  metrics: {
    userCount: number
    activeUsers: number
    monthlySpending: number
    budgetUtilization: number
    requestCount: number
  }
}

export default function DepartmentsOverviewPage() {
  const { data: session, status } = useSession()
  const [departments, setDepartments] = useState<DepartmentOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchDepartments()
    }
  }, [session])

  // Redirect if not authenticated
  if (status === 'loading') return <div>Loading...</div>
  if (!session) {
    redirect('/auth/signin')
  }

  const fetchDepartments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/departments/overview')
      if (!response.ok) {
        throw new Error('Failed to fetch departments')
      }
      const data = await response.json()
      setDepartments(data.departments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getBudgetStatusColor = (utilization: number) => {
    if (utilization > 90) return 'text-red-600 bg-red-50'
    if (utilization > 75) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button 
            onClick={fetchDepartments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              Departments
            </h1>
            <p className="text-gray-600 mt-1">
              Overview of all departments, their performance, and key metrics
            </p>
          </div>
          <div className="flex space-x-3">
            {session?.user?.role === 'ADMIN' && (
              <Link
                href="/admin/departments"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Manage Departments
              </Link>
            )}
            <Link
              href="/reports"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Link>
          </div>
        </div>

        {/* Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => {
            const budgetStatusColor = getBudgetStatusColor(department.metrics.budgetUtilization)
            
            return (
              <div key={department.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {department.name}
                    </h3>
                    <p className="text-sm text-gray-500 uppercase">{department.code}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Link
                      href={`/dashboard/department?department=${encodeURIComponent(department.name)}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                    {session?.user?.role === 'ADMIN' && (
                      <Link
                        href={`/admin/departments`}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Description */}
                {department.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {department.description}
                  </p>
                )}

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Users</span>
                    </div>
                    <span className="text-sm font-medium">
                      {department.metrics.activeUsers || 0}/{department.metrics.userCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Monthly Spending</span>
                    </div>
                    <span className="text-sm font-medium">
                      ${(department.metrics.monthlySpending || 0).toFixed(2)}
                    </span>
                  </div>

                  {department.budget && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className={`h-4 w-4 mr-2 ${budgetStatusColor.split(' ')[0]}`} />
                        <span className="text-sm text-gray-600">Budget Usage</span>
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${budgetStatusColor}`}>
                        {(department.metrics.budgetUtilization || 0).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Requests</span>
                    </div>
                    <span className="text-sm font-medium">
                      {department.metrics.requestCount || 0}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    department.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {department.status}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
            <p className="text-gray-600">
              Contact your administrator to set up departments.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
