'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock, Shield, AlertTriangle, CheckCircle, XCircle, Eye, Monitor, Smartphone } from 'lucide-react'

interface ProfileActivityItem {
  id: string
  action: string
  timestamp: string
  description: string
  details: {
    ipAddress: string
    userAgent: string
    updatedFields: string[]
    passwordChanged: boolean
    emailChanged: boolean
    warnings: string[]
    errors: string[]
  }
}

interface ProfileActivityProps {
  className?: string
}

export function ProfileActivity({ className = '' }: ProfileActivityProps) {
  const [activities, setActivities] = useState<ProfileActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/profile/activity')
      if (!response.ok) {
        throw new Error('Failed to fetch activity')
      }
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error fetching profile activity:', error)
      setError('Failed to load activity history')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (action: string) => {
    if (action.includes('SUCCESS')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (action.includes('FAILED')) {
      return <XCircle className="h-4 w-4 text-red-600" />
    } else if (action.includes('VIEW')) {
      return <Eye className="h-4 w-4 text-blue-600" />
    } else {
      return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityColor = (action: string) => {
    if (action.includes('SUCCESS')) {
      return 'border-l-green-500 bg-green-50'
    } else if (action.includes('FAILED')) {
      return 'border-l-red-500 bg-red-50'
    } else if (action.includes('VIEW')) {
      return 'border-l-blue-500 bg-blue-50'
    } else {
      return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-3 w-3 text-gray-400" />
    } else {
      return <Monitor className="h-3 w-3 text-gray-400" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <Activity className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="flex items-center mb-4">
          <Activity className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Activity className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <span className="text-sm text-gray-500">{activities.length} events</span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`border-l-4 pl-4 py-3 rounded-r-md ${getActivityColor(activity.action)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  {getActivityIcon(activity.action)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getDeviceIcon(activity.details.userAgent)}
                        <span className="text-xs text-gray-500">
                          {activity.details.ipAddress}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show warnings if any */}
                    {activity.details.warnings.length > 0 && (
                      <div className="mt-2">
                        {activity.details.warnings.map((warning, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-700">{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show errors if any */}
                    {activity.details.errors.length > 0 && (
                      <div className="mt-2">
                        {activity.details.errors.map((error, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-700">{error}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Show security indicators */}
                    {(activity.details.passwordChanged || activity.details.emailChanged) && (
                      <div className="mt-2 flex items-center space-x-2">
                        <Shield className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-blue-700">
                          Security-sensitive change
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Security Information</p>
            <p>
              This activity log shows recent changes to your profile for security monitoring. 
              If you notice any suspicious activity, please contact your administrator immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
