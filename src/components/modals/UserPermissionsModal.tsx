'use client'

import { useState, useEffect } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { toast } from 'react-hot-toast'
import { Shield, Check, X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  permissions: string[]
}

interface Permission {
  key: string
  name: string
  description: string
  applicableRoles: string[]
}

interface UserPermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSave: () => void
}

export function UserPermissionsModal({ isOpen, onClose, user, onSave }: UserPermissionsModalProps) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPermissions()
    }
  }, [isOpen, user])

  const fetchUserPermissions = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/permissions`)
      if (response.ok) {
        const data = await response.json()
        setPermissions(data.user.permissions || [])
        setAvailablePermissions(data.availablePermissions || [])
      } else {
        toast.error('Failed to fetch user permissions')
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      toast.error('Failed to fetch user permissions')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionToggle = (permissionKey: string) => {
    setPermissions(prev => 
      prev.includes(permissionKey)
        ? prev.filter(p => p !== permissionKey)
        : [...prev, permissionKey]
    )
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      })

      if (response.ok) {
        toast.success('User permissions updated successfully')
        onSave()
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update user permissions')
      }
    } catch (error) {
      console.error('Error updating user permissions:', error)
      toast.error('Failed to update user permissions')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setPermissions([])
    setAvailablePermissions([])
    onClose()
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Manage User Permissions">
      <div className="space-y-6">
        {/* User Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">{user.role} • {user.department}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Available Permissions</h4>
            
            {availablePermissions.length === 0 ? (
              <p className="text-sm text-gray-500">No additional permissions available for this user role.</p>
            ) : (
              <div className="space-y-3">
                {availablePermissions.map((permission) => {
                  const isApplicable = permission.applicableRoles.includes(user.role)
                  const isGranted = permissions.includes(permission.key)
                  
                  return (
                    <div
                      key={permission.key}
                      className={`border rounded-lg p-4 ${
                        isApplicable ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className={`font-medium ${
                              isApplicable ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {permission.name}
                            </h5>
                            {isGranted && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${
                            isApplicable ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            {permission.description}
                          </p>
                          {!isApplicable && (
                            <p className="text-xs text-gray-400 mt-1">
                              Only available for: {permission.applicableRoles.join(', ')}
                            </p>
                          )}
                        </div>
                        
                        {isApplicable && (
                          <button
                            onClick={() => handlePermissionToggle(permission.key)}
                            className={`ml-4 px-3 py-1 rounded text-sm font-medium transition-colors ${
                              isGranted
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {isGranted ? 'Granted' : 'Grant'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
