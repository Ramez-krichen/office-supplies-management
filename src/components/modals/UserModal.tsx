'use client'

import { useState, useEffect } from 'react'
import { Modal } from '../ui/modal'
import { FormField, Input, Select, FormActions } from '../ui/form'
import { User, Eye, EyeOff, Key } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'ACTIVE' | 'INACTIVE'
  lastSignIn?: string
  createdAt?: string
  updatedAt?: string
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: Omit<User, 'id' | 'lastLogin'>, password?: string) => void
  user?: User | null
  mode: 'add' | 'edit' | 'view'
  readOnly?: boolean
}

export function UserModal({ isOpen, onClose, onSave, user, mode, readOnly = false }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    password: '',
    newPassword: ''
  })
  const [errors, setErrors] = useState<Record<string, { message: string; type: string } | undefined>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [availableDepartments, setAvailableDepartments] = useState<Array<{id: string, name: string, code: string}>>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  useEffect(() => {
    if (user && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        password: '', // Password is not fetched for existing users
        newPassword: ''
      })
    } else {
      setFormData({
        name: '',
        email: '',
        role: '',
        department: '',
        status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
        password: '',
        newPassword: ''
      })
    }
    setErrors({})
    setPassword('');
  }, [user, mode, isOpen])

  // Fetch departments when modal opens
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true)
        const response = await fetch('/api/departments/overview')
        if (response.ok) {
          const data = await response.json()
          setAvailableDepartments(data.departments || [])
        } else {
          console.error('Failed to fetch departments:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
      } finally {
        setLoadingDepartments(false)
      }
    }

    if (isOpen) {
      fetchDepartments()
    }
  }, [isOpen])

  const validateForm = async () => {
    const newErrors: Record<string, { message: string; type: string }> = {}

    if (!formData.name.trim()) {
      newErrors.name = { message: 'Name is required', type: 'required' }
    }

    if (!formData.email.trim()) {
      newErrors.email = { message: 'Email is required', type: 'required' }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = { message: 'Please enter a valid email address', type: 'pattern' }
    } else {
      // Prevent changing main admin email
      if (mode === 'edit' && user && user.email === 'admin@example.com' && formData.email !== 'admin@example.com') {
        newErrors.email = { message: 'Cannot change email of the main admin account', type: 'validate' }
      } else {
        // Check email uniqueness only if it's a new user or email has changed
        if (mode === 'add' || (mode === 'edit' && user && formData.email !== user.email)) {
          setIsCheckingEmail(true)
          try {
            const response = await fetch(`/api/admin/users/check-email?email=${encodeURIComponent(formData.email)}`)
            const data = await response.json()

            if (!response.ok && data.error === 'Email already in use') {
              newErrors.email = { message: 'This email is already in use', type: 'validate' }
            }
          } catch (error) {
            console.error('Error checking email uniqueness:', error)
          } finally {
            setIsCheckingEmail(false)
          }
        }
      }
    }

    if (!formData.role.trim()) {
      newErrors.role = { message: 'Role is required', type: 'required' }
    } else if (mode === 'edit' && user && user.email === 'admin@example.com' && formData.role !== 'ADMIN') {
      // Prevent changing main admin's role
      newErrors.role = { message: 'Cannot change role of the main admin account', type: 'validate' }
    } else if (formData.role === 'ADMIN') {
      // Check if trying to create an admin user
      if (mode === 'add' || (mode === 'edit' && user && user.role !== 'ADMIN')) {
        setIsCheckingEmail(true) // Re-using this state for admin check
        try {
          const response = await fetch('/api/admin/users/check-admin-limit')
          const data = await response.json()

          if (!response.ok && data.error === 'Admin limit reached') {
            newErrors.role = { message: 'Only one admin account is allowed. Please choose another role.', type: 'validate' }
          }
        } catch (error) {
          console.error('Error checking admin limit:', error)
        } finally {
          setIsCheckingEmail(false)
        }
      }
    }

    if (!formData.department.trim()) {
      newErrors.department = { message: 'Department is required', type: 'required' }
    }

    if (mode === 'add' && !formData.password.trim()) {
      newErrors.password = { message: 'Password is required for new users', type: 'required' }
    }

    // Validate new password for edit mode
    if (mode === 'edit' && formData.newPassword.trim()) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = { message: 'Password must be at least 6 characters long', type: 'minLength' }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (readOnly) return; // Prevent submission in read-only mode

    setIsSubmitting(true)
    try {
      const isValid = await validateForm()
      if (!isValid) {
        setIsSubmitting(false)
        return
      }

      // For edit mode, use newPassword if provided, otherwise don't send password
      const passwordToSend = mode === 'edit' ? formData.newPassword : formData.password
      await onSave(formData, passwordToSend)
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
      // Check if the error is related to email uniqueness or admin limit
      if (error instanceof Error) {
        if (error.message.includes('Email already in use')) {
          setErrors(prev => ({ ...prev, email: { message: 'This email is already in use', type: 'validate' } }))
        } else if (error.message.includes('admin account')) {
          setErrors(prev => ({ ...prev, role: { message: 'Only one admin account is allowed. Please choose another role.', type: 'validate' } }))
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const roleOptions = [
    { value: '', label: 'Select Role' },
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EMPLOYEE', label: 'Employee' }
  ]

  const departmentOptions = [
    { value: '', label: 'Select Department' },
    ...availableDepartments.map(dept => ({
      value: dept.name,
      label: `${dept.name} (${dept.code})`
    }))
  ]

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' }
  ]

  const modalTitle = readOnly ? 'View User' : (mode === 'edit' ? 'Edit User' : 'Add New User')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {readOnly && (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-3 mb-4" role="alert">
            You are in view-only mode. No changes can be made.
          </div>
        )}
        <FormField label="Name" error={errors.name}>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            readOnly={readOnly}
          />
        </FormField>

        <FormField label="Email" error={errors.email}>
          <Input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            readOnly={readOnly || isCheckingEmail}
            disabled={isCheckingEmail}
          />
          {isCheckingEmail && <p className="text-sm text-gray-500">Checking email...</p>}
        </FormField>

        <FormField label="Role" error={errors.role}>
          <Select
            id="role"
            name="role"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            options={roleOptions}
            required
            disabled={readOnly}
          />
        </FormField>

        <FormField label="Department" error={errors.department}>
          <Select
            id="department"
            name="department"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            options={departmentOptions}
            required
            disabled={readOnly}
          />
        </FormField>

        <FormField label="Status" error={errors.status}>
          <Select
            id="status"
            name="status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            options={statusOptions}
            required
            disabled={readOnly}
          />
        </FormField>

        {mode === 'add' && (
          <FormField label="Password" error={errors.password}>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={readOnly ? password : formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required={mode === 'add'}
                readOnly={readOnly}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </FormField>
        )}

        {mode === 'edit' && !readOnly && (
          <FormField label="New Password (Optional)" error={errors.newPassword}>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Leave blank to keep current password"
                readOnly={readOnly}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              <Key className="h-4 w-4 inline mr-1" />
              Enter a new password only if you want to change it
            </p>
          </FormField>
        )}

        {!readOnly && (
          <FormActions
            onCancel={onClose}
            isSubmitting={isSubmitting}
            submitText={mode === 'edit' ? 'Save Changes' : 'Add User'}
          />
        )}
      </form>
    </Modal>
  )
}

// View User Modal
interface ViewUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function ViewUserModal({ isOpen, onClose, user }: ViewUserModalProps) {
  if (!user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Details"
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md capitalize">{user.role}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{user.department}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              user.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>

          {user.lastSignIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
              <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                {new Date(user.lastSignIn).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}