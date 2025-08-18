'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, X, AlertTriangle, Info, CheckCircle, Users, Building } from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: string
  status: 'UNREAD' | 'READ' | 'DISMISSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  readAt?: string
  dismissedAt?: string
}

interface NotificationData {
  departmentId?: string
  departmentName?: string
  departmentCode?: string
  scenario?: 'NO_MANAGERS' | 'MULTIPLE_MANAGERS'
  availableManagers?: Array<{
    id: string
    name: string
    email: string
  }>
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'manager_assignment'>('all')

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, filter])

  const fetchNotifications = async () => {
    // Don't fetch if no session or wrong role
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter === 'unread') params.append('status', 'UNREAD')
      if (filter === 'manager_assignment') params.append('type', 'MANAGER_ASSIGNMENT')

      const response = await fetch(`/api/admin/notifications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else if (response.status === 401) {
        // Handle authentication errors silently
        setNotifications([])
      } else {
        console.error('Error fetching notifications:', response.status, response.statusText)
      }
    } catch (error) {
      // Only log network errors as warnings to reduce console noise
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network connectivity issue while fetching notifications - this is usually temporary')
      } else {
        console.error('Error fetching notifications:', error)
      }
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READ' })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, status: 'READ' as const } : n)
        )
      } else if (response.status !== 401) {
        console.error('Error marking notification as read:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISMISSED' })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      } else if (response.status === 401) {
        console.warn('Authentication error - user may need to sign in again')
      } else {
        console.error('Error dismissing notification:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error dismissing notification:', error)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('Network error - server may be down or unreachable')
      }
    }
  }

  const handleManagerAssignment = async (notificationId: string, departmentId: string, managerId?: string) => {
    try {
      const action = managerId ? 'manual' : 'auto'
      const body = managerId ? { action, managerId } : { action }

      const response = await fetch(`/api/admin/departments/${departmentId}/assign-manager`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Dismiss the notification
          await dismissNotification(notificationId)
          // Show success message
          alert(result.message)
        } else {
          alert(result.message || 'Failed to assign manager')
        }
      }
    } catch (error) {
      console.error('Error assigning manager:', error)
      alert('Failed to assign manager')
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'HIGH':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'MEDIUM':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const renderManagerAssignmentNotification = (notification: Notification) => {
    let data: NotificationData = {}
    try {
      data = notification.data ? JSON.parse(notification.data) : {}
    } catch (e) {
      console.error('Error parsing notification data:', e)
    }

    return (
      <div className="mt-3 space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building className="h-4 w-4" />
          <span>Department: {data.departmentName} ({data.departmentCode})</span>
        </div>

        {data.scenario === 'MULTIPLE_MANAGERS' && data.availableManagers && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Available Managers:</p>
            <div className="space-y-1">
              {data.availableManagers.map((manager) => (
                <div key={manager.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{manager.name}</p>
                    <p className="text-xs text-gray-500">{manager.email}</p>
                  </div>
                  <button
                    onClick={() => handleManagerAssignment(notification.id, data.departmentId!, manager.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.scenario === 'NO_MANAGERS' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              No managers available in this department. Please create a new manager or reassign an existing one.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => window.open('/admin/users', '_blank')}
                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
              >
                Manage Users
              </button>
              <button
                onClick={() => window.open('/admin/departments', '_blank')}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                View Department
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Notification Center</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'manager_assignment', label: 'Manager Assignments' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-1 text-sm rounded ${
                  filter === filterOption.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications found</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 ${notification.status === 'UNREAD' ? 'bg-blue-50' : 'bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(notification.priority)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <div className="flex items-center gap-2">
                          {notification.status === 'UNREAD' && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>

                      {notification.type === 'MANAGER_ASSIGNMENT' && renderManagerAssignmentNotification(notification)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
