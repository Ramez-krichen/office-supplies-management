'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Users, Search, Shield, User, Crown, Eye, Filter, Download, Lock, Edit, X, Save, Bell } from 'lucide-react'


interface User {
  id: string
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  department: string
  status: 'Active' | 'Inactive'
  lastSignIn: string | null
  createdAt: string
  updatedAt: string
}

// Fetch users from API (excluding admins)
const fetchUsers = async () => {
  try {
    const response = await fetch('/api/users')
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    const allUsers = await response.json()
    // Filter out admin users
    return allUsers.filter((user: User) => user.role !== 'ADMIN')
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN': return <Crown className="h-4 w-4 text-yellow-600" />
    case 'MANAGER': return <Shield className="h-4 w-4 text-blue-600" />
    case 'EMPLOYEE': return <User className="h-4 w-4 text-gray-600" />
    default: return <User className="h-4 w-4 text-gray-600" />
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

const getStatusColor = (status: string) => {
  return status === 'Active' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  
  // Check if user is admin and redirect if not
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Fetch users data
  useEffect(() => {
    if (status === 'loading' || !session || session.user.role !== 'ADMIN') return
    
    const loadUsers = async () => {
      try {
        const data = await fetchUsers()
        setUsers(data)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [session, status])
  
  // Get unique departments for filter
  const departments = Array.from(new Set(users.map(user => user.department)))
  
  const filteredUsers = users.filter(user => {
    // Exclude admin users from the list
    if (user.role === 'ADMIN') return false

    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
    const matchesDepartment = departmentFilter === 'ALL' || user.department === departmentFilter
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  }).sort((a, b) => {
    // Sort by role priority: MANAGER first, then EMPLOYEE (ADMIN already excluded)
    // Within each role, active users appear before inactive users
    const roleOrder = { 'MANAGER': 0, 'EMPLOYEE': 1 }
    const aRoleOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 2
    const bRoleOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 2

    // First, sort by role
    if (aRoleOrder !== bRoleOrder) {
      return aRoleOrder - bRoleOrder
    }

    // If roles are the same, sort by status (ACTIVE first, then INACTIVE)
    const statusOrder = { 'ACTIVE': 0, 'INACTIVE': 1 }
    const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 2
    const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 2

    if (aStatusOrder !== bStatusOrder) {
      return aStatusOrder - bStatusOrder
    }

    // If both role and status are the same, sort by name alphabetically
    return a.name.localeCompare(b.name)
  })
  
  const exportData = filteredUsers.map(user => ({
    Name: user.name,
    Email: user.email,
    Role: user.role,
    Department: user.department,
    Status: user.status,
    'Last Sign In': user.lastSignIn ? new Date(user.lastSignIn).toLocaleString() : 'Never',
    'Created At': new Date(user.createdAt).toLocaleString(),
    'Updated At': new Date(user.updatedAt).toLocaleString()
  }))

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  // Modal handlers
  const handleViewUser = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }
      const userDetails = await response.json()
      setSelectedUser(userDetails)
      setViewModalOpen(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
      setNotification('Failed to load user details. Please try again.')
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditFormData({ ...user })
    setEditModalOpen(true)
  }

  const handleSaveUser = async () => {
    if (!editFormData) return
    
    try {
      const response = await fetch(`/api/admin/users/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update user')
      }
      
      const updatedUser = await response.json()
      
      // Update local state
      setUsers(users.map(user => 
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      ))
      
      // Show notification
      setNotification(`User ${editFormData.name} has been updated successfully. They will be notified of the changes.`)
      setTimeout(() => setNotification(null), 5000)
      
      setEditModalOpen(false)
      setEditFormData(null)
    } catch (error) {
      console.error('Error updating user:', error)
      setNotification('Failed to update user. Please try again.')
      setTimeout(() => setNotification(null), 5000)
    }
  }

  const closeModals = () => {
    setViewModalOpen(false)
    setEditModalOpen(false)
    setSelectedUser(null)
    setEditFormData(null)
    setShowPassword(false)
  }

  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center py-24">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-lg">Loading user data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
  
  // Redirect if not admin
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
            <p className="text-gray-600">View all users with sensitive information</p>
          </div>
          <div className="flex gap-2">

          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sign In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.lastSignIn)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        {user.email === 'admin@example.com' && (
                          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
                            Main Admin
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No users available.'}
              </p>
              </div>
            )}
        </div>

        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
            <Bell className="h-4 w-4" />
            {notification}
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* View User Modal */}
        {viewModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.department}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm text-gray-900 font-mono">
                      {showPassword ? selectedUser.password : '••••••••••••••••'}
                    </p>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Sign In</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.lastSignIn)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editModalOpen && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'EMPLOYEE' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    onChange={(e) => {
                      if (e.target.value) {
                        setEditFormData({ ...editFormData, password: e.target.value })
                      }
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}