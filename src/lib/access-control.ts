import {
  type UserRole,
  getAccessConfig,
  hasFeatureAccess,
  hasDashboardAccess,
  isDepartmentRestricted,
  hasFeatureAccessWithPermissions,
  ROLE_ACCESS_CONFIG
} from './access-control-config'

export type { UserRole } from './access-control-config'

/**
 * Dashboard access control rules (CLIENT-SIDE SAFE)
 * Updated to use comprehensive access control configuration
 */
export const DASHBOARD_ACCESS = {
  EMPLOYEE: {
    allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[]
  },
  MANAGER: {
    allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[]
  },
  ADMIN: {
    allowedRoles: ['ADMIN'] as UserRole[]
  },
  DEPARTMENT: {
    allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[]
  },
  SYSTEM: {
    requireRole: 'ADMIN' as UserRole
  }
} as const

/**
 * Check dashboard access for client-side components
 */
export function canAccessDashboard(userRole: string | undefined, dashboardType: keyof typeof DASHBOARD_ACCESS): boolean {
  if (!userRole) return false

  const accessRule = DASHBOARD_ACCESS[dashboardType]

  if ('requireRole' in accessRule) {
    return userRole === accessRule.requireRole
  }

  if ('allowedRoles' in accessRule) {
    return accessRule.allowedRoles.includes(userRole as UserRole)
  }

  return false
}

/**
 * Enhanced access control functions using comprehensive configuration
 */

/**
 * Check if user can access a specific feature with a specific action
 */
export function canAccessFeature(
  userRole: string | undefined,
  feature: string,
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve'
): boolean {
  if (!userRole) return false

  try {
    const featureKey = feature as keyof Omit<typeof ROLE_ACCESS_CONFIG.ADMIN, 'dashboards' | 'lowStockAlerts' | 'pendingApprovals'>
    const actionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof ROLE_ACCESS_CONFIG.ADMIN.requests

    return hasFeatureAccess(userRole as UserRole, featureKey, actionKey)
  } catch {
    return false
  }
}

/**
 * Check if user can access a specific feature with explicit permissions support
 */
export function canAccessFeatureWithPermissions(
  userRole: string | undefined,
  feature: string,
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve',
  userPermissions?: string
): boolean {
  if (!userRole) return false

  try {
    const featureKey = feature as keyof Omit<typeof ROLE_ACCESS_CONFIG.ADMIN, 'dashboards' | 'lowStockAlerts' | 'pendingApprovals'>
    const actionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof typeof ROLE_ACCESS_CONFIG.ADMIN.requests

    return hasFeatureAccessWithPermissions(userRole as UserRole, featureKey, actionKey, userPermissions)
  } catch {
    return false
  }
}

/**
 * Check if user can access specific dashboard type using new configuration
 */
export function canAccessDashboardType(userRole: string | undefined, dashboardType: string): boolean {
  if (!userRole) return false

  try {
    switch (dashboardType) {
      case 'admin':
        return hasDashboardAccess(userRole as UserRole, 'adminDashboard')
      case 'system':
        return hasDashboardAccess(userRole as UserRole, 'systemDashboard')
      case 'department':
        return hasDashboardAccess(userRole as UserRole, 'departmentDashboard')
      case 'employee':
      case 'personal':
        return hasDashboardAccess(userRole as UserRole, 'personalDashboard')
      case 'requests':
        return hasDashboardAccess(userRole as UserRole, 'requestsDashboard')
      default:
        return false
    }
  } catch {
    return false
  }
}

/**
 * Check if feature requires department-level filtering
 */
export function requiresDepartmentFiltering(userRole: string | undefined, feature: string): boolean {
  if (!userRole) return false

  try {
    const featureKey = feature as keyof Omit<typeof ROLE_ACCESS_CONFIG.ADMIN, 'dashboards' | 'lowStockAlerts' | 'pendingApprovals'>
    return isDepartmentRestricted(userRole as UserRole, featureKey)
  } catch {
    return false
  }
}

/**
 * Get user's access configuration
 */
export function getUserAccessConfig(userRole: string | undefined) {
  if (!userRole || !(userRole in ROLE_ACCESS_CONFIG)) return null

  try {
    return getAccessConfig(userRole as UserRole)
  } catch {
    return null
  }
}

/**
 * Get appropriate dashboard redirect based on user role
 */
export function getDefaultDashboard(userRole: string | undefined): string {
  switch (userRole) {
    case 'ADMIN':
      return '/dashboard/admin'
    case 'MANAGER':
      return '/dashboard/manager'
    case 'EMPLOYEE':
      return '/dashboard/employee'
    default:
      return '/dashboard'
  }
}

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(navigationItems: any[], userRole: string | undefined) {
  if (!userRole) return []

  return navigationItems.filter(item => {
    // Skip items that require a specific role if user doesn't have it
    if (item.requiredRole && userRole !== item.requiredRole) {
      return false
    }

    // Skip items that have specific roles if user doesn't have one of them
    if (item.roles && !item.roles.includes(userRole)) {
      return false
    }

    // Additional dashboard-specific filtering
    if (item.href?.startsWith('/dashboard/')) {
      const dashboardType = item.href.split('/')[2]
      switch (dashboardType) {
        case 'employee':
          return canAccessDashboard(userRole, 'EMPLOYEE')
        case 'manager':
          return canAccessDashboard(userRole, 'MANAGER')
        case 'admin':
          return canAccessDashboard(userRole, 'ADMIN')
        case 'department':
          return canAccessDashboard(userRole, 'DEPARTMENT')
        default:
          return true
      }
    }

    return true
  })
}
