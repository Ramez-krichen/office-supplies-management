'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'
import NotificationCenter from './NotificationCenter'

export default function NotificationBadge() {
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Don't render anything while session is loading
  if (status === 'loading') {
    return null
  }

  // Only show notifications for admins and managers
  if (!session || !session.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return null
  }

  useEffect(() => {
    // Only fetch if user is authenticated and has the right role
    if (session && session.user && ['ADMIN', 'MANAGER'].includes(session.user.role)) {
      fetchUnreadCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchUnreadCount = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading) return

    try {
      // Don't fetch if no session or wrong role
      if (!session || !session.user || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        setUnreadCount(0)
        return
      }

      setIsLoading(true)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch('/api/admin/notifications?status=UNREAD', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setUnreadCount(data.notifications?.length || 0)
        } else {
          console.warn('API returned non-JSON response:', contentType)
          const text = await response.text()
          console.warn('Response body:', text.substring(0, 200) + '...')
          setUnreadCount(0)
        }
      } else if (response.status === 401) {
        // Handle authentication errors silently
        console.warn('Authentication error - user may need to sign in again')
        setUnreadCount(0)
      } else {
        console.warn('Error fetching notifications:', response.status, response.statusText)
        const text = await response.text()
        console.warn('Error response body:', text.substring(0, 200) + '...')
        // Don't reset count on server errors to avoid flickering
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Notification fetch request timed out')
      } else {
        // Only log network errors as warnings instead of errors to reduce console noise
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.warn('Network connectivity issue - this is usually temporary')
        } else {
          console.error('Error fetching unread count:', error)
        }
      }
      // Reset count on network errors to avoid stale data
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationClick = () => {
    setShowNotifications(true)
  }

  const handleNotificationClose = () => {
    setShowNotifications(false)
    // Refresh unread count when closing (with a small delay to allow for any updates)
    setTimeout(() => {
      fetchUnreadCount()
    }, 100)
  }

  return (
    <>
      <button
        onClick={handleNotificationClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={handleNotificationClose} 
      />
    </>
  )
}
