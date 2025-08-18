'use client'

import { useState, useEffect } from 'react'
import { X, Building2, DollarSign, Users } from 'lucide-react'

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
}

interface Manager {
  id: string
  name: string
  email: string
  department?: string
  departmentId?: string
  status?: string
}

interface DepartmentModalProps {
  department?: Department | null
  onClose: () => void
}

export default function DepartmentModal({ department, onClose }: DepartmentModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    parentId: '',
    managerId: '',
    budget: '',
    status: 'ACTIVE'
  })
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<Manager[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!department

  useEffect(() => {
    fetchManagers()
    fetchDepartments()

    if (department) {
      setFormData({
        code: department.code,
        name: department.name,
        description: department.description || '',
        parentId: department.parentId || '',
        managerId: department.managerId || '',
        budget: department.budget?.toString() || '',
        status: department.status
      })
    }
  }, [department])

  const fetchManagers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=MANAGER&status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setManagers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Department code is required'
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and underscores'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required'
    }

    if (formData.budget && isNaN(parseFloat(formData.budget))) {
      newErrors.budget = 'Budget must be a valid number'
    }

    if (formData.parentId === department?.id) {
      newErrors.parentId = 'Department cannot be its own parent'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const url = isEditing
        ? `/api/admin/departments/${department.id}`
        : '/api/admin/departments'

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
          managerId: formData.managerId || null,
          description: formData.description?.trim() || null,
          budget: formData.budget === '' ? null : Number(formData.budget)
        })
      })

      if (response.ok) {
        onClose()
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || 'Failed to save department' })
      }
    } catch (error) {
      console.error('Error saving department:', error)
      setErrors({ submit: 'Failed to save department' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Filter out current department and its children from parent options
  const availableParents = departments.filter(dept =>
    dept.id !== department?.id &&
    dept.parentId !== department?.id
  )

  // Managers filtered to the same department when editing; otherwise show active ones
  const filteredManagers = department
    ? managers.filter(m => (
        (m.departmentId === department.id || m.department === department.name) &&
        (m.status ? m.status === 'ACTIVE' : true)
      ))
    : managers.filter(m => (m.status ? m.status === 'ACTIVE' : true))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Building2 className="h-6 w-6 mr-2 text-blue-600" />
            {isEditing ? 'Edit Department' : 'Create Department'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.code ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., IT, HR, FINANCE"
                disabled={loading}
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Information Technology"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the department's role and responsibilities"
              disabled={loading}
            />
          </div>

          {/* Hierarchy and Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Department
              </label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.parentId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">No Parent (Top Level)</option>
                {availableParents.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.parentId && (
                <p className="text-red-500 text-sm mt-1">{errors.parentId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Manager
              </label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select Manager</option>
                {filteredManagers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.budget ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
              </div>
              {errors.budget && (
                <p className="text-red-500 text-sm mt-1">{errors.budget}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Department' : 'Create Department')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
