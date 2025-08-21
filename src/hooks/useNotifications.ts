'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: any
  status: 'UNREAD' | 'READ' | 'DISMISSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: string
  actionUrl?: string
  actionLabel?: string
  createdAt: string
  readAt?: string
  dismissedAt?: string
}

export interface NotificationPreferences {
  emailEnabled: boolean
  inAppEnabled: boolean
  requestStatusChanges: boolean
  managerAssignments: boolean
  systemAlerts: boolean
  weeklyDigest: boolean
}

export function useNotifications() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async (options?: {
    status?: string
    category?: string
    limit?: number
    offset?: number
  }) => {
    if (!session) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (options?.status) params.append('status', options.status)
      if (options?.category) params.append('category', options.category)
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const response = await fetch(`/api/notifications?${params}`)
      if (!response.ok) throw new Error('Failed to fetch notifications')

      const data = await response.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [session])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read' }),
      })

      if (!response.ok) throw new Error('Failed to mark notification as read')

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: 'READ' as const, readAt: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [session])

  // Mark notification as dismissed
  const markAsDismissed = useCallback(async (notificationId: string) => {
    if (!session) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' }),
      })

      if (!response.ok) throw new Error('Failed to dismiss notification')

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, status: 'DISMISSED' as const, dismissedAt: new Date().toISOString() }
            : notification
        )
      )
      if (notifications.find(n => n.id === notificationId)?.status === 'UNREAD') {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error dismissing notification:', err)
    }
  }, [session, notifications])

  // Bulk mark as read
  const bulkMarkAsRead = useCallback(async (notificationIds: string[]) => {
    if (!session) return

    try {
      const response = await fetch('/api/notifications/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', notificationIds }),
      })

      if (!response.ok) throw new Error('Failed to mark notifications as read')

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, status: 'READ' as const, readAt: new Date().toISOString() }
            : notification
        )
      )

      // Update unread count
      const unreadToRead = notifications.filter(
        n => notificationIds.includes(n.id) && n.status === 'UNREAD'
      ).length
      setUnreadCount(prev => Math.max(0, prev - unreadToRead))
    } catch (err) {
      console.error('Error bulk marking notifications as read:', err)
    }
  }, [session, notifications])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => n.status === 'UNREAD').map(n => n.id)
    if (unreadIds.length > 0) {
      await bulkMarkAsRead(unreadIds)
    }
  }, [notifications, bulkMarkAsRead])

  // Set up real-time notifications
  useEffect(() => {
    if (!session) return

    const es = new EventSource('/api/notifications/stream')
    setEventSource(es)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'connected':
            console.log('Real-time notifications connected')
            break
            
          case 'notification':
            // Add new notification to the list
            setNotifications(prev => [data.notification, ...prev])
            if (data.notification.status === 'UNREAD') {
              setUnreadCount(prev => prev + 1)
            }
            break
            
          case 'unread_count':
            setUnreadCount(data.count)
            break
            
          case 'heartbeat':
            // Keep connection alive
            break
            
          default:
            console.log('Unknown notification event:', data)
        }
      } catch (err) {
        console.error('Error parsing notification event:', err)
      }
    }

    es.onerror = (error) => {
      console.error('EventSource error:', error)
      setError('Real-time connection lost')
    }

    return () => {
      es.close()
      setEventSource(null)
    }
  }, [session])

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchNotifications()
    }
  }, [session, fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected: eventSource?.readyState === EventSource.OPEN,
    fetchNotifications,
    markAsRead,
    markAsDismissed,
    bulkMarkAsRead,
    markAllAsRead,
    refresh: () => fetchNotifications(),
  }
}

export function useNotificationPreferences() {
  const { data: session } = useSession()
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    if (!session) return

    try {
      setLoading(true)
      const response = await fetch('/api/notifications/preferences')
      if (!response.ok) throw new Error('Failed to fetch preferences')

      const data = await response.json()
      setPreferences(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences')
    } finally {
      setLoading(false)
    }
  }, [session])

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!session) return

    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      const data = await response.json()
      setPreferences(data.preferences)
      setError(null)
      return data.preferences
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      throw err
    }
  }, [session])

  // Initial fetch
  useEffect(() => {
    if (session) {
      fetchPreferences()
    }
  }, [session, fetchPreferences])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refresh: fetchPreferences,
  }
}