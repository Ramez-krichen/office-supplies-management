import { describe, it, expect } from '@jest/globals'
import { 
  getAccessConfig, 
  hasFeatureAccess, 
  hasDashboardAccess, 
  isDepartmentRestricted,
  UserRole 
} from '../lib/access-control-config'
import { 
  canAccessFeature, 
  canAccessDashboard, 
  canAccessDashboardType,
  requiresDepartmentFiltering,
  getUserAccessConfig
} from '../lib/access-control'

describe('Access Control Configuration', () => {
  describe('Admin Role Access', () => {
    const adminRole: UserRole = 'ADMIN'

    it('should have full dashboard access', () => {
      expect(hasDashboardAccess(adminRole, 'adminDashboard')).toBe(true)
      expect(hasDashboardAccess(adminRole, 'systemDashboard')).toBe(true)
      expect(hasDashboardAccess(adminRole, 'departmentDashboard')).toBe(true)
      expect(hasDashboardAccess(adminRole, 'personalDashboard')).toBe(false)
    })

    it('should have full feature access except request creation', () => {
      expect(hasFeatureAccess(adminRole, 'requests', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'requests', 'canCreate')).toBe(false) // Admins cannot create requests
      expect(hasFeatureAccess(adminRole, 'requests', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'requests', 'canDelete')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'requests', 'canApprove')).toBe(true)
    })

    it('should have full inventory access', () => {
      expect(hasFeatureAccess(adminRole, 'inventory', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'inventory', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'inventory', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'inventory', 'canDelete')).toBe(true)
    })

    it('should have full suppliers access', () => {
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canDelete')).toBe(true)
    })

    it('should have full purchase orders access', () => {
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canDelete')).toBe(true)
    })

    it('should not have department restrictions', () => {
      expect(isDepartmentRestricted(adminRole, 'requests')).toBe(false)
      expect(isDepartmentRestricted(adminRole, 'inventory')).toBe(false)
      expect(isDepartmentRestricted(adminRole, 'reports')).toBe(false)
    })
  })

  describe('Manager Role Access', () => {
    const managerRole: UserRole = 'MANAGER'

    it('should have limited dashboard access', () => {
      expect(hasDashboardAccess(managerRole, 'adminDashboard')).toBe(false)
      expect(hasDashboardAccess(managerRole, 'systemDashboard')).toBe(false)
      expect(hasDashboardAccess(managerRole, 'departmentDashboard')).toBe(true)
      expect(hasDashboardAccess(managerRole, 'personalDashboard')).toBe(true)
    })

    it('should have department-restricted request access', () => {
      expect(hasFeatureAccess(managerRole, 'requests', 'canView')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'requests', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'requests', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'requests', 'canDelete')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'requests', 'canApprove')).toBe(true)
      expect(isDepartmentRestricted(managerRole, 'requests')).toBe(true)
    })

    it('should have department-restricted inventory access', () => {
      expect(hasFeatureAccess(managerRole, 'inventory', 'canView')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'inventory', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'inventory', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'inventory', 'canDelete')).toBe(false)
      expect(isDepartmentRestricted(managerRole, 'inventory')).toBe(true)
    })

    it('should not have suppliers access', () => {
      expect(hasFeatureAccess(managerRole, 'suppliers', 'canView')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'suppliers', 'canCreate')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'suppliers', 'canEdit')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'suppliers', 'canDelete')).toBe(false)
    })

    it('should not have purchase orders access by default', () => {
      expect(hasFeatureAccess(managerRole, 'purchaseOrders', 'canView')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'purchaseOrders', 'canCreate')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'purchaseOrders', 'canEdit')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'purchaseOrders', 'canDelete')).toBe(false)
    })

    it('should not have users or settings access', () => {
      expect(hasFeatureAccess(managerRole, 'users', 'canView')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'settings', 'canView')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'auditLogs', 'canView')).toBe(false)
    })
  })

  describe('Employee Role Access', () => {
    const employeeRole: UserRole = 'EMPLOYEE'

    it('should have minimal dashboard access', () => {
      expect(hasDashboardAccess(employeeRole, 'adminDashboard')).toBe(false)
      expect(hasDashboardAccess(employeeRole, 'systemDashboard')).toBe(false)
      expect(hasDashboardAccess(employeeRole, 'departmentDashboard')).toBe(false)
      expect(hasDashboardAccess(employeeRole, 'personalDashboard')).toBe(true)
    })

    it('should have limited request access (own requests only)', () => {
      expect(hasFeatureAccess(employeeRole, 'requests', 'canView')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canDelete')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canApprove')).toBe(false)
      expect(isDepartmentRestricted(employeeRole, 'requests')).toBe(true)
    })

    it('should have view-only inventory access', () => {
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canView')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canCreate')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canEdit')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canDelete')).toBe(false)
    })

    it('should not have suppliers or purchase orders access', () => {
      expect(hasFeatureAccess(employeeRole, 'suppliers', 'canView')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'purchaseOrders', 'canView')).toBe(false)
    })

    it('should have limited reports access (personal only)', () => {
      expect(hasFeatureAccess(employeeRole, 'reports', 'canView')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'reports', 'canCreate')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'reports', 'canEdit')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'reports', 'canDelete')).toBe(false)
      expect(isDepartmentRestricted(employeeRole, 'reports')).toBe(true)
    })

    it('should not have administrative access', () => {
      expect(hasFeatureAccess(employeeRole, 'users', 'canView')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'departments', 'canView')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'auditLogs', 'canView')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'settings', 'canView')).toBe(false)
    })
  })

  describe('Client-side Access Control Functions', () => {
    it('should correctly check feature access', () => {
      expect(canAccessFeature('ADMIN', 'inventory', 'view')).toBe(true)
      expect(canAccessFeature('ADMIN', 'inventory', 'create')).toBe(true)
      expect(canAccessFeature('EMPLOYEE', 'inventory', 'create')).toBe(false)
      expect(canAccessFeature('MANAGER', 'suppliers', 'view')).toBe(false)
    })

    it('should correctly check dashboard access', () => {
      expect(canAccessDashboardType('ADMIN', 'admin')).toBe(true)
      expect(canAccessDashboardType('ADMIN', 'system')).toBe(true)
      expect(canAccessDashboardType('MANAGER', 'admin')).toBe(false)
      expect(canAccessDashboardType('EMPLOYEE', 'department')).toBe(false)
    })

    it('should correctly identify department filtering requirements', () => {
      expect(requiresDepartmentFiltering('MANAGER', 'requests')).toBe(true)
      expect(requiresDepartmentFiltering('ADMIN', 'requests')).toBe(false)
      expect(requiresDepartmentFiltering('EMPLOYEE', 'inventory')).toBe(false)
    })

    it('should return null for invalid roles', () => {
      expect(getUserAccessConfig('INVALID_ROLE')).toBe(null)
      expect(canAccessFeature('INVALID_ROLE', 'requests', 'view')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle undefined roles gracefully', () => {
      expect(canAccessFeature(undefined, 'requests', 'view')).toBe(false)
      expect(canAccessDashboardType(undefined, 'admin')).toBe(false)
      expect(requiresDepartmentFiltering(undefined, 'requests')).toBe(false)
    })

    it('should handle invalid feature names gracefully', () => {
      expect(canAccessFeature('ADMIN', 'invalid_feature', 'view')).toBe(false)
    })
  })
})
