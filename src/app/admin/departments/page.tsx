'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import DepartmentModal from '@/components/modals/DepartmentModal'

interface Department {
  id: string
  code: string
  name: string
  description?: string
  budget?: number
  status: string
  parentId?: string
  managerId?: string
  manager?: {
    id: string
    name: string
    email: string
  }
  parent?: {
    id: string
    name: string
    code: string
  }
  children?: {
    id: string
    name: string
    code: string
  }[]
  users: {
    id: string
    name: string
    role: string
    status: string
  }[]
  _count: {
    users: number
    children: number
  }
  metrics: {
    requestCount: number
    monthlySpending: number
    budgetUtilization: number
    activeUsers: number
  }
}

export default function DepartmentsPage() {
  const { data: session, status } = useSession()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Redirect if not admin
  if (status === 'loading') return <div>Loading...</div>
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = () => {
    setSelectedDepartment(null)
    setIsModalOpen(true)
  }

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setIsModalOpen(true)
  }

  const handleDeleteDepartment = async (department: Department) => {
    if (!confirm(`Are you sure you want to delete ${department.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/departments/${department.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchDepartments()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete department')
      }
    } catch (error) {
      console.error('Error deleting department:', error)
      alert('Failed to delete department')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedDepartment(null)
    fetchDepartments()
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBudgetStatus = (utilization: number) => {
    if (utilization > 90) return { color: 'text-red-600', icon: AlertTriangle }
    if (utilization > 75) return { color: 'text-yellow-600', icon: AlertTriangle }
    return { color: 'text-green-600', icon: CheckCircle }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-blue-600" />
            Department Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage departments, hierarchies, budgets, and assignments
          </p>
        </div>
        <button
          onClick={handleCreateDepartment}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => {
          const budgetStatus = getBudgetStatus(department.metrics.budgetUtilization)
          const StatusIcon = budgetStatus.icon

          return (
            <div key={department.id} className="bg-white rounded-lg shadow-md p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {department.name}
                  </h3>
                  <p className="text-sm text-gray-500">{department.code}</p>
                  {department.parent && (
                    <p className="text-xs text-blue-600">
                      Under: {department.parent.name}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditDepartment(department)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(department)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {department.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {department.description}
                </p>
              )}

              {/* Manager */}
              {department.manager && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">Manager:</p>
                  <p className="text-sm text-gray-600">{department.manager.name}</p>
                </div>
              )}

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Users</span>
                  </div>
                  <span className="text-sm font-medium">
                    {department.metrics.activeUsers}/{department._count.users}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Monthly Spending</span>
                  </div>
                  <span className="text-sm font-medium">
                    ${department.metrics.monthlySpending.toFixed(2)}
                  </span>
                </div>

                {department.budget && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <StatusIcon className={`h-4 w-4 mr-2 ${budgetStatus.color}`} />
                      <span className="text-sm text-gray-600">Budget Usage</span>
                    </div>
                    <span className={`text-sm font-medium ${budgetStatus.color}`}>
                      {department.metrics.budgetUtilization}%
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Requests</span>
                  </div>
                  <span className="text-sm font-medium">
                    {department.metrics.requestCount}
                  </span>
                </div>
              </div>

              {/* Sub-departments */}
              {department._count.children > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {department._count.children} sub-department(s)
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  department.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {department.status === 'ACTIVE' ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircle className="h-3 w-3 mr-1" />
                  )}
                  {department.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first department.'}
          </p>
        </div>
      )}

      {/* Department Modal */}
      {isModalOpen && (
        <DepartmentModal
          department={selectedDepartment}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
}
