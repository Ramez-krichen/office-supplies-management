'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  BellIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useNotifications, type Notification } from '@/hooks/useNotifications'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'

type FilterType = 'all' | 'unread' | 'read' | 'dismissed'
type CategoryType = 'all' | 'REQUEST_UPDATE' | 'EMPLOYEE_MANAGEMENT' | 'SYSTEM' | 'PURCHASE_ORDER'

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAsDismissed,
    bulkMarkAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications()

  const [filter, setFilter] = useState<FilterType>('all')
  const [category, setCategory] = useState<CategoryType>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showPreferences, setShowPreferences] = useState(false)

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    // Status filter
    if (filter === 'unread' && notification.status !== 'UNREAD') return false
    if (filter === 'read' && notification.status !== 'READ') return false
    if (filter === 'dismissed' && notification.status !== 'DISMISSED') return false

    // Category filter
    if (category !== 'all' && notification.category !== category) return false

    return true
  })

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id))
    }
  }

  const handleBulkMarkAsRead = async () => {
    if (selectedIds.length > 0) {
      await bulkMarkAsRead(selectedIds)
      setSelectedIds([])
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'MEDIUM': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'LOW': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REQUEST_STATUS_CHANGE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'EMPLOYEE_ASSIGNMENT':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      case 'SYSTEM_ALERT':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'PURCHASE_ORDER_UPDATE':
        return <CheckCircleIcon className="h-5 w-5 text-purple-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  if (showPreferences) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => setShowPreferences(false)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Notifications
            </button>
          </div>
          <NotificationPreferences />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-gray-400 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPreferences(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-2" />
              Preferences
            </button>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                </div>
                
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread ({unreadCount})</option>
                  <option value="read">Read</option>
                  <option value="dismissed">Dismissed</option>
                </select>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="REQUEST_UPDATE">Request Updates</option>
                  <option value="EMPLOYEE_MANAGEMENT">Employee Management</option>
                  <option value="SYSTEM">System Alerts</option>
                  <option value="PURCHASE_ORDER">Purchase Orders</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    Mark Selected as Read ({selectedIds.length})
                  </button>
                )}
                
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Mark All as Read
                  </button>
                )}

                <button
                  onClick={refresh}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Bulk actions */}
          {filteredNotifications.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredNotifications.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Select all ({filteredNotifications.length})
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refresh}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? "You don't have any unread notifications."
                  : "You don't have any notifications in this category."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    notification.status === 'UNREAD' ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, notification.id])
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== notification.id))
                        }
                      }}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-lg font-medium ${
                            notification.status === 'UNREAD' ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center mt-3 space-x-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            
                            <span className="text-sm text-gray-500">
                              {format(new Date(notification.createdAt), 'MMM d, yyyy')} • {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            
                            {notification.status === 'UNREAD' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              {notification.actionLabel || 'View'}
                            </a>
                          )}
                          
                          {notification.status === 'UNREAD' && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                              title="Mark as read"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => markAsDismissed(notification.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            title="Dismiss"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
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