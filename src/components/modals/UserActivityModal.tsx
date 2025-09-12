'use client'

import { useState, useEffect } from 'react'
import { X, User, Clock, Activity, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UserActivity {
  id: string
  action: string
  entity: string
  entityId: string
  timestamp: string
  details?: string
}

interface UserActivityModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
  userEmail: string
  lastSignIn: string | null
}

export function UserActivityModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  lastSignIn
}: UserActivityModalProps) {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserActivities()
    }
  }, [isOpen, userId])
  
  // Add a refresh button to manually refresh activities
  const refreshActivities = () => {
    if (userId) {
      fetchUserActivities()
      toast.success('Activities refreshed')
    }
  }

  const fetchUserActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/activities?days=7`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      } else {
        toast.error('Failed to fetch user activities')
      }
    } catch (error) {
      console.error('Error fetching user activities:', error)
      toast.error('An error occurred while fetching activities')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getActivityIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return '➕'
      case 'update':
        return '✏️'
      case 'delete':
        return '🗑️'
      case 'approve':
        return '✅'
      case 'reject':
        return '❌'
      case 'login':
        return '🔐'
      default:
        return '📝'
    }
  }

  const getActivityColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'text-green-600'
      case 'update':
        return 'text-blue-600'
      case 'delete':
        return 'text-red-600'
      case 'approve':
        return 'text-green-600'
      case 'reject':
        return 'text-red-600'
      case 'login':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{userName}</h3>
                <p className="text-sm text-gray-500">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Last Sign In */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Last Sign In:</span>
              <span className="ml-2 text-sm text-gray-900">
                {lastSignIn ? formatTimestamp(lastSignIn) : 'Never'}
              </span>
            </div>
          </div>

          {/* Activities */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-gray-400 mr-2" />
                <h4 className="text-md font-medium text-gray-900">Recent Activities (Last 7 Days)</h4>
              </div>
              <button
                onClick={refreshActivities}
                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading activities...</div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activities</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This user hasn&apos;t performed any tracked activities in the last 7 days.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0 mr-3">
                        <span className="text-lg">{getActivityIcon(activity.action)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${getActivityColor(activity.action)}`}>
                            {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.entity}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        {activity.details && (
                          <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Entity ID: {activity.entityId}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
