import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { 
  getAccessConfig, 
  hasFeatureAccess, 
  hasDashboardAccess, 
  isDepartmentRestricted,
  getAdditionalRestrictions,
  UserRole 
} from '../lib/access-control-config'
import { checkAccess, createFeatureAccessCheck } from '../lib/server-access-control'

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

// Mock auth options
jest.mock('../lib/auth', () => ({
  authOptions: {}
}))

const mockGetServerSession = require('next-auth').getServerSession as jest.MockedFunction<any>

describe('Comprehensive Access Control Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Admin Role - Full System Access', () => {
    const adminRole: UserRole = 'ADMIN'

    it('should have access to all dashboards', () => {
      expect(hasDashboardAccess(adminRole, 'adminDashboard')).toBe(true)
      expect(hasDashboardAccess(adminRole, 'systemDashboard')).toBe(true)
      expect(hasDashboardAccess(adminRole, 'departmentDashboard')).toBe(true)
      expect(hasDashboardAccess(adminRole, 'personalDashboard')).toBe(false)
    })

    it('should have full access to all features except request creation', () => {
      // Requests - Cannot create but can approve/manage all
      expect(hasFeatureAccess(adminRole, 'requests', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'requests', 'canCreate')).toBe(false)
      expect(hasFeatureAccess(adminRole, 'requests', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'requests', 'canDelete')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'requests', 'canApprove')).toBe(true)

      // Inventory - Full access
      expect(hasFeatureAccess(adminRole, 'inventory', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'inventory', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'inventory', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'inventory', 'canDelete')).toBe(true)

      // Users - Full access
      expect(hasFeatureAccess(adminRole, 'users', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'users', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'users', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'users', 'canDelete')).toBe(true)

      // Suppliers - Full access
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'suppliers', 'canDelete')).toBe(true)

      // Purchase Orders - Full access
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'purchaseOrders', 'canDelete')).toBe(true)

      // Reports - Full access
      expect(hasFeatureAccess(adminRole, 'reports', 'canView')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'reports', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(adminRole, 'reports', 'canEdit')).toBe(true)

      // Quick Reports - Full access
      expect(hasFeatureAccess(adminRole, 'quickReports', 'canView')).toBe(true)
    })

    it('should not have department restrictions', () => {
      expect(isDepartmentRestricted(adminRole, 'requests')).toBe(false)
      expect(isDepartmentRestricted(adminRole, 'inventory')).toBe(false)
      expect(isDepartmentRestricted(adminRole, 'users')).toBe(false)
      expect(isDepartmentRestricted(adminRole, 'reports')).toBe(false)
    })

    it('should not have additional restrictions', () => {
      expect(getAdditionalRestrictions(adminRole, 'requests')).toEqual([])
      expect(getAdditionalRestrictions(adminRole, 'reports')).toEqual([])
      expect(getAdditionalRestrictions(adminRole, 'inventory')).toEqual([])
    })
  })

  describe('Manager Role - Department-Level Access', () => {
    const managerRole: UserRole = 'MANAGER'

    it('should have access to manager and personal dashboards only', () => {
      expect(hasDashboardAccess(managerRole, 'adminDashboard')).toBe(false)
      expect(hasDashboardAccess(managerRole, 'systemDashboard')).toBe(false)
      expect(hasDashboardAccess(managerRole, 'departmentDashboard')).toBe(true)
      expect(hasDashboardAccess(managerRole, 'personalDashboard')).toBe(true)
    })

    it('should have department-restricted access to most features', () => {
      // Requests - Can view, create, edit, approve (department-level)
      expect(hasFeatureAccess(managerRole, 'requests', 'canView')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'requests', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'requests', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'requests', 'canDelete')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'requests', 'canApprove')).toBe(true)

      // Inventory - Can view and edit
      expect(hasFeatureAccess(managerRole, 'inventory', 'canView')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'inventory', 'canCreate')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'inventory', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'inventory', 'canDelete')).toBe(false)

      // Users - No access
      expect(hasFeatureAccess(managerRole, 'users', 'canView')).toBe(false)
      expect(hasFeatureAccess(managerRole, 'users', 'canCreate')).toBe(false)

      // Suppliers - No access
      expect(hasFeatureAccess(managerRole, 'suppliers', 'canView')).toBe(false)

      // Purchase Orders - Optional access (requires explicit grant)
      expect(hasFeatureAccess(managerRole, 'purchaseOrders', 'canView')).toBe(false)

      // Reports - Department-level access
      expect(hasFeatureAccess(managerRole, 'reports', 'canView')).toBe(true)
      expect(hasFeatureAccess(managerRole, 'reports', 'canCreate')).toBe(false)

      // Quick Reports - Full access
      expect(hasFeatureAccess(managerRole, 'quickReports', 'canView')).toBe(true)
    })

    it('should have department restrictions for relevant features', () => {
      expect(isDepartmentRestricted(managerRole, 'requests')).toBe(true)
      expect(isDepartmentRestricted(managerRole, 'inventory')).toBe(false) // Global inventory
      expect(isDepartmentRestricted(managerRole, 'reports')).toBe(true)
    })

    it('should have requires_explicit_grant for purchase orders', () => {
      expect(getAdditionalRestrictions(managerRole, 'purchaseOrders')).toContain('requires_explicit_grant')
    })
  })

  describe('Employee Role - Personal Data Only', () => {
    const employeeRole: UserRole = 'EMPLOYEE'

    it('should have access to personal dashboard only', () => {
      expect(hasDashboardAccess(employeeRole, 'adminDashboard')).toBe(false)
      expect(hasDashboardAccess(employeeRole, 'systemDashboard')).toBe(false)
      expect(hasDashboardAccess(employeeRole, 'departmentDashboard')).toBe(false)
      expect(hasDashboardAccess(employeeRole, 'personalDashboard')).toBe(true)
    })

    it('should have minimal access to basic features only', () => {
      // Requests - Can view, create, edit own requests only
      expect(hasFeatureAccess(employeeRole, 'requests', 'canView')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canCreate')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canEdit')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canDelete')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'requests', 'canApprove')).toBe(false)

      // Inventory - Read-only access
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canView')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canCreate')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canEdit')).toBe(false)
      expect(hasFeatureAccess(employeeRole, 'inventory', 'canDelete')).toBe(false)

      // Users - No access
      expect(hasFeatureAccess(employeeRole, 'users', 'canView')).toBe(false)

      // Suppliers - No access
      expect(hasFeatureAccess(employeeRole, 'suppliers', 'canView')).toBe(false)

      // Purchase Orders - No access
      expect(hasFeatureAccess(employeeRole, 'purchaseOrders', 'canView')).toBe(false)

      // Reports - Personal history only
      expect(hasFeatureAccess(employeeRole, 'reports', 'canView')).toBe(true)
      expect(hasFeatureAccess(employeeRole, 'reports', 'canCreate')).toBe(false)

      // Quick Reports - No access
      expect(hasFeatureAccess(employeeRole, 'quickReports', 'canView')).toBe(false)
    })

    it('should have department restrictions and personal_only for relevant features', () => {
      expect(isDepartmentRestricted(employeeRole, 'requests')).toBe(true)
      expect(isDepartmentRestricted(employeeRole, 'reports')).toBe(true)
    })

    it('should have personal_only restrictions for reports and requests', () => {
      expect(getAdditionalRestrictions(employeeRole, 'requests')).toContain('personal_only')
      expect(getAdditionalRestrictions(employeeRole, 'reports')).toContain('personal_only')
    })
  })

  describe('API Access Control Integration', () => {
    it('should grant access to admin for all features', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin1',
          role: 'ADMIN',
          department: 'IT'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())
      expect(result.hasAccess).toBe(true)
      expect(result.userRole).toBe('ADMIN')
      expect(result.requiresDepartmentFiltering).toBe(false)
      expect(result.additionalRestrictions).toEqual([])
    })

    it('should grant department-filtered access to manager', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'manager1',
          role: 'MANAGER',
          department: 'HR'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())
      expect(result.hasAccess).toBe(true)
      expect(result.userRole).toBe('MANAGER')
      expect(result.userDepartment).toBe('HR')
      expect(result.requiresDepartmentFiltering).toBe(true)
    })

    it('should grant personal-only access to employee for reports', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'employee1',
          role: 'EMPLOYEE',
          department: 'Finance'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('REPORTS', 'view')())
      expect(result.hasAccess).toBe(true)
      expect(result.userRole).toBe('EMPLOYEE')
      expect(result.additionalRestrictions).toContain('personal_only')
    })

    it('should deny access to employee for admin-only features', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'employee1',
          role: 'EMPLOYEE',
          department: 'Finance'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('USERS', 'view')())
      expect(result.hasAccess).toBe(false)
      expect(result.status).toBe(403)
    })

    it('should deny access to manager for admin-only features', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'manager1',
          role: 'MANAGER',
          department: 'HR'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('USERS', 'view')())
      expect(result.hasAccess).toBe(false)
      expect(result.status).toBe(403)
    })
  })
})
