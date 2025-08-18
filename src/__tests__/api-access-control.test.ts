import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
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

describe('API Access Control', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkAccess function', () => {
    it('should deny access when no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const result = await checkAccess({ allowedRoles: ['ADMIN'] })

      expect(result.hasAccess).toBe(false)
      expect(result.error).toBe('Unauthorized - No session')
      expect(result.status).toBe(401)
    })

    it('should deny access when user role is not allowed', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user1',
          role: 'EMPLOYEE',
          department: 'IT'
        }
      })

      const result = await checkAccess({ allowedRoles: ['ADMIN'] })

      expect(result.hasAccess).toBe(false)
      expect(result.error).toBe('Forbidden - Requires one of: ADMIN')
      expect(result.status).toBe(403)
    })

    it('should allow access when user role is allowed', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user1',
          role: 'ADMIN',
          department: 'IT'
        }
      })

      const result = await checkAccess({ allowedRoles: ['ADMIN'] })

      expect(result.hasAccess).toBe(true)
      expect(result.user).toBeDefined()
      expect(result.userRole).toBe('ADMIN')
    })

    it('should deny access when department is required but missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user1',
          role: 'MANAGER',
          department: null
        }
      })

      const result = await checkAccess({ 
        allowedRoles: ['MANAGER'], 
        requireDepartment: true 
      })

      expect(result.hasAccess).toBe(false)
      expect(result.error).toBe('Forbidden - User must be assigned to a department')
      expect(result.status).toBe(403)
    })

    it('should allow access when department is required and present', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user1',
          role: 'MANAGER',
          department: 'IT'
        }
      })

      const result = await checkAccess({ 
        allowedRoles: ['MANAGER'], 
        requireDepartment: true 
      })

      expect(result.hasAccess).toBe(true)
      expect(result.userDepartment).toBe('IT')
    })
  })

  describe('Feature-based access control', () => {
    it('should allow admin to view requests', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin1',
          role: 'ADMIN',
          department: 'IT'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())

      expect(result.hasAccess).toBe(true)
    })

    it('should deny employee access to suppliers', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'emp1',
          role: 'EMPLOYEE',
          department: 'IT'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('SUPPLIERS', 'view')())

      expect(result.hasAccess).toBe(false)
      expect(result.error).toContain('EMPLOYEE role cannot view suppliers')
    })

    it('should deny admin request creation', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin1',
          role: 'ADMIN',
          department: 'IT'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('REQUESTS', 'create')())

      expect(result.hasAccess).toBe(false)
      expect(result.error).toContain('ADMIN role cannot create requests')
    })

    it('should allow manager to view inventory with department filtering', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'mgr1',
          role: 'MANAGER',
          department: 'IT'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('INVENTORY', 'view')())

      expect(result.hasAccess).toBe(true)
      expect(result.requiresDepartmentFiltering).toBe(true)
    })
  })

  describe('Role-specific API access scenarios', () => {
    describe('Admin access', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: 'admin1',
            role: 'ADMIN',
            department: 'IT'
          }
        })
      })

      it('should allow access to all features except request creation', async () => {
        const features = [
          { feature: 'REQUESTS', action: 'view', expected: true },
          { feature: 'REQUESTS', action: 'create', expected: false },
          { feature: 'REQUESTS', action: 'edit', expected: true },
          { feature: 'REQUESTS', action: 'delete', expected: true },
          { feature: 'INVENTORY', action: 'view', expected: true },
          { feature: 'INVENTORY', action: 'create', expected: true },
          { feature: 'SUPPLIERS', action: 'view', expected: true },
          { feature: 'PURCHASE_ORDERS', action: 'view', expected: true },
          { feature: 'USERS', action: 'view', expected: true },
          { feature: 'AUDIT_LOGS', action: 'view', expected: true }
        ]

        for (const { feature, action, expected } of features) {
          const result = await checkAccess(createFeatureAccessCheck(feature as any, action)())
          expect(result.hasAccess).toBe(expected)
        }
      })
    })

    describe('Manager access', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: 'mgr1',
            role: 'MANAGER',
            department: 'IT'
          }
        })
      })

      it('should allow department-restricted access to allowed features', async () => {
        const features = [
          { feature: 'REQUESTS', action: 'view', expected: true },
          { feature: 'REQUESTS', action: 'create', expected: true },
          { feature: 'INVENTORY', action: 'view', expected: true },
          { feature: 'REPORTS', action: 'view', expected: true },
          { feature: 'SUPPLIERS', action: 'view', expected: false },
          { feature: 'PURCHASE_ORDERS', action: 'view', expected: false },
          { feature: 'USERS', action: 'view', expected: false },
          { feature: 'AUDIT_LOGS', action: 'view', expected: false }
        ]

        for (const { feature, action, expected } of features) {
          const result = await checkAccess(createFeatureAccessCheck(feature as any, action)())
          expect(result.hasAccess).toBe(expected)
        }
      })
    })

    describe('Employee access', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: {
            id: 'emp1',
            role: 'EMPLOYEE',
            department: 'IT'
          }
        })
      })

      it('should allow minimal access to basic features', async () => {
        const features = [
          { feature: 'REQUESTS', action: 'view', expected: true },
          { feature: 'REQUESTS', action: 'create', expected: true },
          { feature: 'REQUESTS', action: 'edit', expected: true },
          { feature: 'REQUESTS', action: 'delete', expected: false },
          { feature: 'INVENTORY', action: 'view', expected: true },
          { feature: 'INVENTORY', action: 'create', expected: false },
          { feature: 'REPORTS', action: 'view', expected: true },
          { feature: 'SUPPLIERS', action: 'view', expected: false },
          { feature: 'PURCHASE_ORDERS', action: 'view', expected: false },
          { feature: 'USERS', action: 'view', expected: false }
        ]

        for (const { feature, action, expected } of features) {
          const result = await checkAccess(createFeatureAccessCheck(feature as any, action)())
          expect(result.hasAccess).toBe(expected)
        }
      })
    })
  })

  describe('Department filtering', () => {
    it('should indicate department filtering for managers', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'mgr1',
          role: 'MANAGER',
          department: 'IT'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())

      expect(result.hasAccess).toBe(true)
      expect(result.requiresDepartmentFiltering).toBe(true)
    })

    it('should not indicate department filtering for admins', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin1',
          role: 'ADMIN',
          department: 'IT'
        }
      })

      const result = await checkAccess(createFeatureAccessCheck('REQUESTS', 'view')())

      expect(result.hasAccess).toBe(true)
      expect(result.requiresDepartmentFiltering).toBe(false)
    })
  })
})
