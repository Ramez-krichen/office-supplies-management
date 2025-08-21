'use client'

import { useState } from 'react'
import { Switch } from '@headlessui/react'
import { 
  BellIcon,
  EnvelopeIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { useNotificationPreferences } from '@/hooks/useNotifications'

export function NotificationPreferences() {
  const { preferences, loading, error, updatePreferences } = useNotificationPreferences()
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleToggle = async (key: keyof NonNullable<typeof preferences>, value: boolean) => {
    if (!preferences) return

    try {
      setSaving(true)
      await updatePreferences({ [key]: value })
      setSaveMessage('Preferences saved successfully')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      setSaveMessage('Failed to save preferences')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !preferences) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span>{error || 'Failed to load preferences'}</span>
        </div>
      </div>
    )
  }

  const preferenceItems = [
    {
      key: 'emailEnabled' as const,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: EnvelopeIcon,
      value: preferences.emailEnabled,
    },
    {
      key: 'inAppEnabled' as const,
      title: 'In-App Notifications',
      description: 'Show notifications in the application',
      icon: ComputerDesktopIcon,
      value: preferences.inAppEnabled,
    },
    {
      key: 'requestStatusChanges' as const,
      title: 'Request Status Updates',
      description: 'Get notified when your request status changes',
      icon: DocumentTextIcon,
      value: preferences.requestStatusChanges,
    },
    {
      key: 'managerAssignments' as const,
      title: 'Employee Assignments',
      description: 'Get notified when employees are assigned to your department',
      icon: UserGroupIcon,
      value: preferences.managerAssignments,
    },
    {
      key: 'systemAlerts' as const,
      title: 'System Alerts',
      description: 'Receive important system notifications and alerts',
      icon: ExclamationTriangleIcon,
      value: preferences.systemAlerts,
    },
    {
      key: 'weeklyDigest' as const,
      title: 'Weekly Digest',
      description: 'Receive a weekly summary of your notifications',
      icon: CalendarIcon,
      value: preferences.weeklyDigest,
    },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <BellIcon className="h-6 w-6 text-gray-400 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Notification Preferences
            </h3>
            <p className="text-sm text-gray-500">
              Manage how you receive notifications
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {saveMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            saveMessage.includes('success') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {saveMessage}
          </div>
        )}

        <div className="space-y-6">
          {preferenceItems.map((item) => (
            <div key={item.key} className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <item.icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>
              
              <div className="flex-shrink-0 ml-4">
                <Switch
                  checked={item.value}
                  onChange={(value) => handleToggle(item.key, value)}
                  disabled={saving}
                  className={`${
                    item.value ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="sr-only">Toggle {item.title}</span>
                  <span
                    aria-hidden="true"
                    className={`${
                      item.value ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </Switch>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <BellIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  About Notifications
                </h4>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email notifications are sent to your registered email address</li>
                    <li>In-app notifications appear in real-time when you're logged in</li>
                    <li>You can always view your notification history in the notifications page</li>
                    <li>System alerts are important and recommended to keep enabled</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}