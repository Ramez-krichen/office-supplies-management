'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Users, Plus, Search, Shield, User, Crown, Edit, Eye, Filter, Download, Trash } from 'lucide-react'
import { UserModal } from '@/components/modals/UserModal'
import { UserPermissionsModal } from '@/components/modals/UserPermissionsModal'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ExportButton } from '@/components/ui/export'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  department: string
  status: 'ACTIVE' | 'INACTIVE'
  lastSignIn?: string
  createdAt?: string
  updatedAt?: string
  phone?: string
  position?: string
  joinDate?: string
  permissions?: string[]
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN': return <Crown className="h-5 w-5 text-yellow-600" />
    case 'MANAGER': return <Shield className="h-5 w-5 text-blue-600" />
    case 'EMPLOYEE': return <User className="h-5 w-5 text-gray-600" />
    default: return <User className="h-5 w-5 text-gray-600" />
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
    case 'MANAGER': return 'bg-blue-100 text-blue-800 border border-blue-300'
    case 'EMPLOYEE': return 'bg-gray-100 text-gray-800 border border-gray-300'
    default: return 'bg-gray-100 text-gray-800 border border-gray-300'
  }
}

const getStatusColor = (status: string) => {
  return status === 'ACTIVE' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  useEffect(() => {
    if (status === 'loading' || !session || session.user.role !== 'ADMIN') return

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [session, status]);
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
  // Get unique departments for filter
  const departments = Array.from(new Set(users.map(user => user.department)))
  
  const handleAddUser = async (userData: Partial<User>, password?: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('You do not have permission to add users. Only administrators can create user accounts.');
        } else if (response.status === 403) {
          throw new Error(errorData.error || 'Access denied. You cannot perform this action.');
        } else if (response.status === 409) {
          throw new Error(errorData.error || 'Email already in use');
        } else {
          throw new Error(errorData.error || 'Failed to add user');
        }
      }
      const newUser = await response.json();
      setUsers([...users, newUser]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding user:', error);
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to add user');
    }
  };
  
  const handleEditUser = async (userData: Partial<User>) => {
    if (!editingUser) return;
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('You do not have permission to edit users. Only administrators can edit user accounts.');
        } else if (response.status === 403) {
          throw new Error(errorData.error || 'Access denied. You cannot perform this action.');
        } else {
          throw new Error(errorData.error || 'Failed to edit user');
        }
      }
      const updatedUser = await response.json();
      setUsers(users.map(user => (user.id === editingUser.id ? updatedUser : user)));
      setEditingUser(null);
    } catch (error) {
      console.error('Error editing user:', error);
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to edit user');
    }
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user)
    setIsViewModalOpen(true)
  }
  
  const handleDeactivateUser = async () => {
    if (!userToDeactivate) return;
    setIsDeactivating(true);
    try {
      const newStatus = userToDeactivate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await fetch(`/api/users/${userToDeactivate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('You do not have permission to change user status. Only administrators can modify user accounts.');
        } else if (response.status === 403) {
          throw new Error(errorData.error || 'Access denied. You cannot perform this action.');
        } else {
          throw new Error(errorData.error || `Failed to ${newStatus === 'INACTIVE' ? 'deactivate' : 'activate'} user`);
        }
      }
      const updatedUser = await response.json();
      setUsers(users.map(u => (u.id === userToDeactivate.id ? updatedUser : u)));
      setUserToDeactivate(null);
    } catch (error) {
      console.error('Error updating user status:', error);
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to update user status');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivateUser = (user: User) => {
    setUserToDeactivate(user);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('You do not have permission to delete users. Only administrators can delete user accounts.');
        } else if (response.status === 403) {
          throw new Error(errorData.error || 'Access denied. You cannot perform this action.');
        } else {
          throw new Error(errorData.error || 'Failed to delete user');
        }
      }
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
    const matchesDepartment = departmentFilter === 'ALL' || user.department === departmentFilter
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  }).sort((a, b) => {
    // Sort by role priority: ADMIN first, then MANAGER, then EMPLOYEE
    // Within each role, active users appear before inactive users
    const roleOrder = { 'ADMIN': 0, 'MANAGER': 1, 'EMPLOYEE': 2 }
    const aRoleOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3
    const bRoleOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3

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
    Position: user.position || '',
    Phone: user.phone || '',
    'Join Date': user.joinDate || '',
    'Last Login': user.lastSignIn || 'Never',
    'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
    'Updated At': user.updatedAt ? new Date(user.updatedAt).toLocaleString() : ''
  }))

  // Show loading state
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Show access denied for non-admin users
  if (!session || session.user.role !== 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access user management.
          </p>
          <p className="text-sm text-gray-500">
            Only administrators can view and manage user accounts.
          </p>
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
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={exportData}
              filename="users"
              variant="primary"
            />
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
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
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
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
                    Last Login
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
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="text-xs font-semibold">
                            {user.role === 'ADMIN' ? 'Administrator' : 
                             user.role === 'MANAGER' ? 'Manager' : 'Employee'}
                          </span>
                        </div>
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
                      {user.lastSignIn}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewUser(user)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingUser(user)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  {user.role === 'MANAGER' && (
                    <button
                      onClick={() => setPermissionsUser(user)}
                      className="text-purple-600 hover:text-purple-800"
                      title="Manage permissions"
                    >
                      <Shield className="h-5 w-5" />
                    </button>
                  )}
                  {user.email !== 'admin@example.com' && (
                    <button
                      onClick={() => setUserToDelete(user)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete user"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  )}
                  {user.email !== 'admin@example.com' && (
                    user.status === 'ACTIVE' ? (
                      <button
                        onClick={() => setUserToDeactivate(user)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <span className="text-sm">Deactivate</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setUserToDeactivate(user)}
                        className="text-green-600 hover:text-green-800 flex items-center gap-1"
                      >
                        <span className="text-sm">Activate</span>
                      </button>
                    )
                  )}
                  {user.email === 'admin@example.com' && (
                    <span className="text-xs text-gray-500 italic">Main Admin</span>
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
                  : 'Get started by adding a new user.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <UserModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
        }}
        onSave={handleAddUser}
        user={null}
        mode="add"
        readOnly={false}
      />

      {/* Edit User Modal */}
      <UserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleEditUser}
        user={editingUser}
        mode="edit"
        readOnly={false}
      />

      {/* View User Modal */}
      <UserModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setViewingUser(null)
        }}
        onSave={() => {}} // No-op for view mode
        user={viewingUser}
        mode="view"
        readOnly={true}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        type="delete"
        entityType="user"
        entityName={userToDelete?.name}
        isLoading={isDeleting}
      />

      {/* Deactivate/Activate Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateUser}
        type={userToDeactivate?.status === 'ACTIVE' ? 'deactivate' : 'warning'}
        entityType="user"
        entityName={userToDeactivate?.name}
        isLoading={isDeactivating}
        customTitle={userToDeactivate?.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
        customMessage={userToDeactivate?.status === 'ACTIVE'
          ? 'This user will lose access to the system.'
          : 'This user will regain access to the system.'}
        customConfirmText={userToDeactivate?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
      />

      {/* User Permissions Modal */}
      <UserPermissionsModal
        isOpen={!!permissionsUser}
        onClose={() => setPermissionsUser(null)}
        user={permissionsUser}
        onSave={() => {
          fetchUsers() // Refresh the users list
        }}
      />
    </DashboardLayout>
  )
}
