import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  UserRole,
  getAccessConfig,
  hasFeatureAccess,
  isDepartmentRestricted,
  hasFeatureAccessWithPermissions,
  getAdditionalRestrictions
} from '@/lib/access-control-config'
import { db } from '@/lib/db'

export interface AccessControlOptions {
  allowedRoles?: UserRole[]
  requireRole?: UserRole
  requireDepartment?: boolean
  feature?: string
  action?: 'view' | 'create' | 'edit' | 'delete' | 'approve'
}

/**
 * Check if a user has access based on their role and department (SERVER-SIDE ONLY)
 */
export async function checkAccess(options: AccessControlOptions = {}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return {
      hasAccess: false,
      error: 'Unauthorized - No session',
      status: 401
    }
  }

  // Guard against malformed session objects to avoid runtime exceptions
  if (!session.user || typeof (session.user as any).role !== 'string') {
    return {
      hasAccess: false,
      error: 'Unauthorized - Invalid session data',
      status: 401
    }
  }

  const userRole = session.user.role as UserRole
  const userDepartment = session.user.department

  // Fetch user permissions from database
  let userPermissions = ''
  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { permissions: true }
    })
    userPermissions = user?.permissions || ''
  } catch (error) {
    console.error('Error fetching user permissions:', error)
  }

  // Check specific role requirement
  if (options.requireRole && userRole !== options.requireRole) {
    return {
      hasAccess: false,
      error: `Forbidden - Requires ${options.requireRole} role`,
      status: 403
    }
  }

  // Check allowed roles
  if (options.allowedRoles && !options.allowedRoles.includes(userRole)) {
    return {
      hasAccess: false,
      error: `Forbidden - Requires one of: ${options.allowedRoles.join(', ')}`,
      status: 403
    }
  }

  // Check department requirement
  if (options.requireDepartment && !userDepartment) {
    return {
      hasAccess: false,
      error: 'Forbidden - User must be assigned to a department',
      status: 403
    }
  }

  // Enhanced feature-based access control with permissions
  if (options.feature && options.action) {
    try {
      const featureKey = options.feature as keyof Omit<ReturnType<typeof getAccessConfig>, 'dashboards' | 'lowStockAlerts' | 'pendingApprovals'>
      const actionKey = `can${options.action.charAt(0).toUpperCase() + options.action.slice(1)}` as keyof ReturnType<typeof getAccessConfig>['requests']

      if (!hasFeatureAccessWithPermissions(userRole, featureKey, actionKey, userPermissions)) {
        return {
          hasAccess: false,
          error: `Forbidden - ${userRole} role cannot ${options.action} ${options.feature}`,
          status: 403
        }
      }
    } catch (error) {
      return {
        hasAccess: false,
        error: 'Forbidden - Invalid feature access configuration',
        status: 403
      }
    }
  }

  // Get additional restrictions for the user role and feature
  const additionalRestrictions = options.feature ? getAdditionalRestrictions(userRole, options.feature as any) : []

  // Special handling for General Manager role - strict segregation of duties
  if (userRole === 'GENERAL_MANAGER') {
    // General Managers can only approve/reject requests
    if (options.feature === 'requests' && options.action === 'approve') {
      // Allow General Managers to approve requests
      return {
        hasAccess: true,
        user: session.user,
        userRole,
        userDepartment,
        userPermissions,
        requiresDepartmentFiltering: false,
        additionalRestrictions: []
      }
    } else if (options.feature === 'auditLogs' && options.action === 'view') {
      // Allow General Managers to view audit logs
      return {
        hasAccess: true,
        user: session.user,
        userRole,
        userDepartment,
        userPermissions,
        requiresDepartmentFiltering: false,
        additionalRestrictions: []
      }
    } else {
      // All other actions are forbidden for General Managers
      return {
        hasAccess: false,
        error: 'Forbidden - General Managers can only approve requests and view audit logs',
        status: 403
      }
    }
  }

  return {
    hasAccess: true,
    user: session.user,
    userRole,
    userDepartment,
    userPermissions,
    requiresDepartmentFiltering: options.feature ? isDepartmentRestricted(userRole, options.feature as any) : false,
    additionalRestrictions
  }
}

/**
 * Middleware wrapper for API routes that require specific access
 */
export function withAccessControl(options: AccessControlOptions) {
  return async function accessControlMiddleware() {
    const accessCheck = await checkAccess(options)
    
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.status }
      )
    }

    return accessCheck
  }
}

/**
 * Dashboard access control rules
 */
export const DASHBOARD_ACCESS = {
  EMPLOYEE: {
    allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[]
  },
  MANAGER: {
    allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[]
  },
  ADMIN: {
    requireRole: 'ADMIN' as UserRole
  },
  DEPARTMENT: {
    allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[]
  },
  SYSTEM: {
    requireRole: 'ADMIN' as UserRole
  }
} as const

/**
 * Feature-based access control configurations
 */
export const FEATURE_ACCESS = {
  REQUESTS: {
    feature: 'requests',
    view: { allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[] },
    create: { allowedRoles: ['EMPLOYEE', 'MANAGER'] as UserRole[] },
    edit: { allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[] },
    delete: { requireRole: 'ADMIN' as UserRole },
    approve: { allowedRoles: ['MANAGER', 'ADMIN', 'GENERAL_MANAGER'] as UserRole[] }
  },
  INVENTORY: {
    feature: 'inventory',
    view: { allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[] },
    create: { allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[] },
    edit: { allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[] },
    delete: { requireRole: 'ADMIN' as UserRole }
  },
  SUPPLIERS: {
    feature: 'suppliers',
    view: { requireRole: 'ADMIN' as UserRole },
    create: { requireRole: 'ADMIN' as UserRole },
    edit: { requireRole: 'ADMIN' as UserRole },
    delete: { requireRole: 'ADMIN' as UserRole }
  },
  PURCHASE_ORDERS: {
    feature: 'purchaseOrders',
    view: { requireRole: 'ADMIN' as UserRole },
    create: { requireRole: 'ADMIN' as UserRole },
    edit: { requireRole: 'ADMIN' as UserRole },
    delete: { requireRole: 'ADMIN' as UserRole }
  },
  REPORTS: {
    feature: 'reports',
    view: { allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[] },
    create: { allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[] },
    edit: { allowedRoles: ['ADMIN'] as UserRole[] },
    delete: { requireRole: 'ADMIN' as UserRole }
  },
  USERS: {
    feature: 'users',
    view: { allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[] },
    create: { requireRole: 'ADMIN' as UserRole },
    edit: { requireRole: 'ADMIN' as UserRole },
    delete: { requireRole: 'ADMIN' as UserRole }
  },
  AUDIT_LOGS: {
    feature: 'auditLogs',
    view: { requireRole: 'ADMIN' as UserRole }
  },
  SETTINGS: {
    feature: 'settings',
    view: { requireRole: 'ADMIN' as UserRole },
    create: { requireRole: 'ADMIN' as UserRole },
    edit: { requireRole: 'ADMIN' as UserRole },
    delete: { requireRole: 'ADMIN' as UserRole }
  },
  DEPARTMENTS: {
    feature: 'departments',
    view: { allowedRoles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] as UserRole[] },
    create: { requireRole: 'ADMIN' as UserRole },
    edit: { requireRole: 'ADMIN' as UserRole },
    delete: { requireRole: 'ADMIN' as UserRole }
  },
  QUICK_REPORTS: {
    feature: 'quickReports',
    view: { allowedRoles: ['MANAGER', 'ADMIN'] as UserRole[] }
  }
} as const

/**
 * Quick access control check for common features
 */
export function createFeatureAccessCheck(feature: keyof typeof FEATURE_ACCESS, action: string) {
  return (options: Omit<AccessControlOptions, 'feature' | 'action'> = {}) => ({
    ...options,
    feature: FEATURE_ACCESS[feature].feature,
    action: action as AccessControlOptions['action']
  })
}

/**
 * Helper function to check if a manager has purchase order access
 */
export async function checkPurchaseOrderAccess(action: string = 'view') {
  return checkAccess(createFeatureAccessCheck('PURCHASE_ORDERS', action)())
}
