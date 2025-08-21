export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'GENERAL_MANAGER'

/**
 * Comprehensive Access Control Configuration
 * Based on the provided role-based access control specification
 */

export interface FeatureAccess {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canApprove?: boolean
  departmentRestricted?: boolean
  additionalRestrictions?: string[]
}

export interface DashboardAccess {
  adminDashboard: boolean
  systemDashboard: boolean
  departmentDashboard: boolean
  personalDashboard: boolean
  requestsDashboard: boolean
}

export interface AccessControlConfig {
  dashboards: DashboardAccess
  requests: FeatureAccess
  inventory: FeatureAccess
  suppliers: FeatureAccess
  purchaseOrders: FeatureAccess
  reports: FeatureAccess
  quickReports: FeatureAccess
  users: FeatureAccess
  departments: FeatureAccess
  auditLogs: FeatureAccess
  settings: FeatureAccess
  lowStockAlerts: boolean
  pendingApprovals: boolean
}

/**
 * Role-based access control configuration
 * Updated to match exact specifications:
 *
 * ADMIN ACCESS:
 * - Admin Dashboard: Full access
 * - System Dashboard: Full access to global metrics, reports, inventory, and requests
 * - Department Dashboard: Can view all departments
 * - Requests: Can approve and reject any request, but cannot create requests
 * - Inventory: Full access to all stock across departments
 * - Suppliers: Full access
 * - Purchase Orders: Full access to create and manage all
 * - Reports: Full access to reports and filters
 * - Quick Reports: Full access
 * - Users: Manage all users and roles
 * - Departments: View and edit all
 * - Audit Logs: Full visibility into all system activities
 * - Settings: Full configuration rights
 * - Low Stock Alerts: Displayed globally on the dashboard
 * - Pending Approvals: Displayed for all pending requests system-wide
 */
export const ROLE_ACCESS_CONFIG: Record<UserRole, AccessControlConfig> = {
  ADMIN: {
    dashboards: {
      adminDashboard: true,
      systemDashboard: true,
      departmentDashboard: true,
      personalDashboard: false, // Admins should not have personal dashboard access
      requestsDashboard: false // Only GENERAL_MANAGER can access requests dashboard
    },
    requests: {
      canView: true,
      canCreate: false, // Admins cannot create requests
      canEdit: true,
      canDelete: true,
      canApprove: true,
      departmentRestricted: false
    },
    inventory: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    suppliers: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    purchaseOrders: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    reports: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    quickReports: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    users: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    departments: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    auditLogs: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    settings: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      departmentRestricted: false
    },
    lowStockAlerts: true, // Displayed globally on the dashboard
    pendingApprovals: true // Displayed for all pending requests system-wide
  },
  /**
   * MANAGER ACCESS:
   * - Admin Dashboard: No access
   * - System Dashboard: No access
   * - Department Dashboard: Access only to their own department's data
   * - Requests: Can create requests (limited to their own department), Can approve/reject requests from their department
   * - Inventory: View and manage inventory for their department
   * - Suppliers: No access
   * - Purchase Orders: Optional (access only if explicitly granted)
   * - Reports: Access to department-level reporting
   * - Quick Reports: Access to filtered reports for their department
   * - Users: No access
   * - Departments: No access
   * - Audit Logs: No access
   * - Settings: No access
   * - Low Stock Alerts: Displayed only for their department
   * - Pending Approvals: Displayed for requests within their department
   */
  MANAGER: {
    dashboards: {
      adminDashboard: false,
      systemDashboard: false,
      departmentDashboard: true, // Access only to their own department's data
      personalDashboard: true,
      requestsDashboard: false // Only GENERAL_MANAGER can access requests dashboard
    },
    requests: {
      canView: true,
      canCreate: true, // Limited to their own department
      canEdit: true,
      canDelete: false,
      canApprove: true, // Can approve/reject requests from their department
      departmentRestricted: true
    },
    inventory: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      departmentRestricted: true // View and manage inventory for their department
    },
    suppliers: {
      canView: false, // No access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    purchaseOrders: {
      canView: false, // Optional access - can be granted explicitly
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true,
      additionalRestrictions: ['requires_explicit_grant']
    },
    reports: {
      canView: true,
      canCreate: true,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true // Access to department-level reporting
    },
    quickReports: {
      canView: true,
      canCreate: true,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true // Access to filtered reports for their department
    },
    users: {
      canView: false, // Removed Users section from sidebar
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true // Only users from their department
    },
    departments: {
      canView: false, // Removed Departments section from sidebar
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true // Limited view for request purposes
    },
    auditLogs: {
      canView: false, // No access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    settings: {
      canView: false, // No access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    lowStockAlerts: true, // Displayed only for their department
    pendingApprovals: true // Displayed for requests within their department
  },
  /**
   * EMPLOYEE ACCESS:
   * - Admin Dashboard: No access
   * - System Dashboard: No access
   * - Department Dashboard: No access
   * - Requests: Can create and track personal requests, Request creation is limited to their own department
   * - Inventory: View only
   * - Suppliers: No access
   * - Purchase Orders: No access
   * - Reports: View only personal request history/summaries
   * - Quick Reports: No access or optional
   * - Users: No access
   * - Departments: No access
   * - Audit Logs: No access
   * - Settings: No access
   * - Low Stock Alerts: No access
   * - Pending Approvals: No access
   */
  EMPLOYEE: {
    dashboards: {
      adminDashboard: false, // No access
      systemDashboard: false, // No access
      departmentDashboard: false, // No access
      personalDashboard: true,
      requestsDashboard: false // Employees cannot track other's requests
    },
    requests: {
      canView: true, // Can create and track personal requests
      canCreate: true, // Request creation is limited to their own department
      canEdit: true, // Only their own requests
      canDelete: false,
      canApprove: false,
      departmentRestricted: true,
      additionalRestrictions: ['own_requests_only']
    },
    inventory: {
      canView: true, // View only
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    suppliers: {
      canView: false, // No access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    purchaseOrders: {
      canView: false, // No access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    reports: {
      canView: true, // View only personal request history/summaries
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true,
      additionalRestrictions: ['personal_only']
    },
    quickReports: {
      canView: false, // No access or optional
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false,
      additionalRestrictions: ['optional_access']
    },
    users: {
      canView: false, // Removed Users section from sidebar
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true // Only users from their department
    },
    departments: {
      canView: false, // Removed Departments section from sidebar
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: true // Limited view for request purposes
    },
    auditLogs: {
      canView: false, // No access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    settings: {
      canView: false, // No access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    lowStockAlerts: false, // No access
    pendingApprovals: false // No access
  },
  /**
   * GENERAL MANAGER ACCESS:
   * - Dedicated role with explicit approval authority
   * - Can ONLY perform approve/reject actions on all incoming requests
   * - Strict segregation of duties - no other access
   * - Full visibility into all requests for approval purposes
   * - Full audit trail capabilities
   * - No access to create, edit, or delete any data
   * - No access to dashboards, inventory, suppliers, etc.
   * - Only access needed for approval workflow
   */
  GENERAL_MANAGER: {
    dashboards: {
      adminDashboard: false,
      systemDashboard: false,
      departmentDashboard: false,
      personalDashboard: false,
      requestsDashboard: true // General managers can track all requests for approval
    },
    requests: {
      canView: true, // Can view all requests for approval
      canCreate: false, // Cannot create requests
      canEdit: false, // Cannot edit requests
      canDelete: false, // Cannot delete requests
      canApprove: true, // Explicit approval authority
      departmentRestricted: false // Can approve requests from all departments
    },
    inventory: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    suppliers: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    purchaseOrders: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    reports: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    quickReports: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    users: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    departments: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    auditLogs: {
      canView: false, // Removed audit logs access
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    settings: {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      departmentRestricted: false
    },
    lowStockAlerts: false,
    pendingApprovals: true // Displayed for all pending requests system-wide
  }
}

/**
 * Get access configuration for a specific role
 */
export function getAccessConfig(role: UserRole): AccessControlConfig {
  return ROLE_ACCESS_CONFIG[role]
}

/**
 * Check if a user has access to a specific feature
 */
export function hasFeatureAccess(
  role: UserRole, 
  feature: keyof Omit<AccessControlConfig, 'dashboards' | 'lowStockAlerts' | 'pendingApprovals'>,
  action: keyof FeatureAccess
): boolean {
  const config = getAccessConfig(role)
  const featureConfig = config[feature] as FeatureAccess
  return featureConfig[action] === true
}

/**
 * Check if a user has dashboard access
 */
export function hasDashboardAccess(role: UserRole, dashboard: keyof DashboardAccess): boolean {
  const config = getAccessConfig(role)
  return config.dashboards[dashboard]
}

/**
 * Check if feature access is department-restricted for a role
 */
export function isDepartmentRestricted(role: UserRole, feature: keyof Omit<AccessControlConfig, 'dashboards' | 'lowStockAlerts' | 'pendingApprovals'>): boolean {
  const config = getAccessConfig(role)
  const featureConfig = config[feature] as FeatureAccess
  return featureConfig.departmentRestricted === true
}

/**
 * Check if a user has explicit permission for a feature
 */
export function hasExplicitPermission(userPermissions: string, feature: string): boolean {
  if (!userPermissions) return false
  const permissions = userPermissions.split(',').map(p => p.trim()).filter(p => p.length > 0)
  return permissions.includes(feature)
}

/**
 * Check if a user has access to a feature considering explicit permissions
 */
export function hasFeatureAccessWithPermissions(
  role: UserRole,
  feature: keyof Omit<AccessControlConfig, 'dashboards' | 'lowStockAlerts' | 'pendingApprovals'>,
  action: keyof FeatureAccess,
  userPermissions?: string
): boolean {
  const config = getAccessConfig(role)
  const featureConfig = config[feature] as FeatureAccess

  // Check if feature requires explicit grant
  if (featureConfig.additionalRestrictions?.includes('requires_explicit_grant')) {
    // For features requiring explicit grant, check user permissions
    const featurePermissionKey = feature.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase()
    return hasExplicitPermission(userPermissions || '', featurePermissionKey) && featureConfig[action] !== undefined
  }

  // Otherwise use normal access control
  return featureConfig[action] === true
}

/**
 * Get additional restrictions for a user role and feature
 */
export function getAdditionalRestrictions(role: UserRole, feature: keyof AccessControlConfig): string[] {
  const config = getAccessConfig(role)
  const featureConfig = config[feature] as FeatureAccess
  return featureConfig.additionalRestrictions || []
}
