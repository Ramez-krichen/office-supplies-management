import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UserPermissions {
  permissions: string[]
  loading: boolean
  error: string | null
}

export function useUserPermissions(): UserPermissions {
  const { data: session } = useSession()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user?.id) {
      setPermissions([])
      setLoading(false)
      setError(null)
      return
    }

    // Only fetch permissions for managers (who might have explicit permissions)
    if (session.user.role !== 'MANAGER') {
      setPermissions([])
      setLoading(false)
      setError(null)
      return
    }

    const fetchPermissions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/admin/users/${session.user.id}/permissions`)
        if (response.ok) {
          const data = await response.json()
          setPermissions(data.user.permissions || [])
        } else {
          setError('Failed to fetch permissions')
          setPermissions([])
        }
      } catch (err) {
        setError('Error fetching permissions')
        setPermissions([])
        console.error('Error fetching user permissions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [session?.user?.id, session?.user?.role])

  return { permissions, loading, error }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission)
}
