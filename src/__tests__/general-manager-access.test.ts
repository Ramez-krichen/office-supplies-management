import { 
  ROLE_ACCESS_CONFIG, 
  hasFeatureAccess, 
  hasDashboardAccess 
} from '@/lib/access-control-config'
import { 
  checkAccess, 
  FEATURE_ACCESS 
} from '@/lib/server-access-control'
import { 
  isGeneralManager, 
  validateGeneralManagerAction 
} from '@/lib/general-manager-access-control'

describe('General Manager Access Control', () => {
  it('should have correct permissions for General Manager role', () => {
    const gmConfig = ROLE_ACCESS_CONFIG.GENERAL_MANAGER
    
    // General Manager should have no dashboard access
    expect(gmConfig.dashboards.adminDashboard).toBe(false)
    expect(gmConfig.dashboards.systemDashboard).toBe(false)
    expect(gmConfig.dashboards.departmentDashboard).toBe(false)
    expect(gmConfig.dashboards.personalDashboard).toBe(false)
    
    // General Manager should only be able to view and approve requests
    expect(gmConfig.requests.canView).toBe(true)
    expect(gmConfig.requests.canCreate).toBe(false)
    expect(gmConfig.requests.canEdit).toBe(false)
    expect(gmConfig.requests.canDelete).toBe(false)
    expect(gmConfig.requests.canApprove).toBe(true)
    
    // General Manager should have no access to other features
    expect(gmConfig.inventory.canView).toBe(false)
    expect(gmConfig.suppliers.canView).toBe(false)
    expect(gmConfig.purchaseOrders.canView).toBe(false)
    expect(gmConfig.reports.canView).toBe(false)
    expect(gmConfig.quickReports.canView).toBe(false)
    expect(gmConfig.users.canView).toBe(false)
    expect(gmConfig.departments.canView).toBe(false)
    
    // General Manager should be able to view audit logs
    expect(gmConfig.auditLogs.canView).toBe(true)
    
    // General Manager should have access to pending approvals
    expect(gmConfig.pendingApprovals).toBe(true)
  })

  it('should validate General Manager actions correctly', () => {
    // Valid actions
    expect(validateGeneralManagerAction('approve').valid).toBe(true)
    expect(validateGeneralManagerAction('reject').valid).toBe(true)
    
    // Invalid actions
    expect(validateGeneralManagerAction('create').valid).toBe(false)
    expect(validateGeneralManagerAction('edit').valid).toBe(false)
    expect(validateGeneralManagerAction('delete').valid).toBe(false)
    expect(validateGeneralManagerAction('view').valid).toBe(false)
  })

  it('should correctly identify General Manager role', () => {
    expect(isGeneralManager('GENERAL_MANAGER')).toBe(true)
    expect(isGeneralManager('ADMIN')).toBe(false)
    expect(isGeneralManager('MANAGER')).toBe(false)
    expect(isGeneralManager('EMPLOYEE')).toBe(false)
    expect(isGeneralManager(undefined)).toBe(false)
  })
})