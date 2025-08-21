import { db as prisma } from '@/lib/db'
import { notificationService } from '@/lib/notification-service'

export interface ManagerAssignmentResult {
  success: boolean
  action: 'ASSIGNED' | 'NOTIFICATION_SENT' | 'NO_ACTION'
  assignedManagerId?: string
  assignedManagerName?: string
  notificationId?: string
  message: string
  availableManagers?: Array<{
    id: string
    name: string
    email: string
    currentDepartment?: string
  }>
}

export interface ManagerChangeEvent {
  type: 'MANAGER_ADDED' | 'MANAGER_ACTIVATED' | 'MANAGER_DEACTIVATED' | 'MANAGER_TRANSFERRED'
  departmentId: string
  managerId: string
  previousDepartmentId?: string
}

/**
 * Automatically assigns a manager to a department based on business rules:
 * - If exactly one manager belongs to the department: auto-assign
 * - If multiple managers belong to the department: notify admin to choose
 * - If no managers belong to the department: notify admin to create/reassign
 */
export async function autoAssignManagerToDepartment(
  departmentId: string
): Promise<ManagerAssignmentResult> {
  try {
    // Get department details
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        manager: true,
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            email: true,
            departmentId: true
          }
        }
      }
    })

    if (!department) {
      return {
        success: false,
        action: 'NO_ACTION',
        message: 'Department not found'
      }
    }

    // If department already has a manager, no action needed
    if (department.managerId) {
      return {
        success: true,
        action: 'NO_ACTION',
        message: 'Department already has an assigned manager'
      }
    }

    // Get managers who belong to this department
    const departmentManagers = department.users

    if (departmentManagers.length === 0) {
      // No managers in this department - notify admin
      const notificationId = await createManagerAssignmentNotification(
        department,
        'NO_MANAGERS',
        'No managers available in department',
        []
      )

      return {
        success: true,
        action: 'NOTIFICATION_SENT',
        notificationId,
        message: 'No managers found in department. Admin notification sent.',
        availableManagers: []
      }
    } else if (departmentManagers.length === 1) {
      // Exactly one manager - auto-assign
      const manager = departmentManagers[0]
      
      await prisma.department.update({
        where: { id: departmentId },
        data: { managerId: manager.id }
      })

      // Create audit log
      await createAuditLog(
        'MANAGER_AUTO_ASSIGNED',
        'Department',
        departmentId,
        'SYSTEM',
        `Manager ${manager.name} automatically assigned to department ${department.name}`
      )

      return {
        success: true,
        action: 'ASSIGNED',
        assignedManagerId: manager.id,
        assignedManagerName: manager.name || 'Unknown',
        message: `Manager ${manager.name || 'Unknown'} automatically assigned to department ${department.name}`
      }
    } else {
      // Multiple managers - notify admin to choose
      const notificationId = await createManagerAssignmentNotification(
        department,
        'MULTIPLE_MANAGERS',
        'Multiple managers available for assignment',
        departmentManagers
      )

      return {
        success: true,
        action: 'NOTIFICATION_SENT',
        notificationId,
        message: 'Multiple managers found. Admin notification sent for manual selection.',
        availableManagers: departmentManagers.map(m => ({
          id: m.id,
          name: m.name || 'Unknown',
          email: m.email,
          currentDepartment: m.departmentId || undefined
        }))
      }
    }

  } catch (error) {
    console.error('Error in autoAssignManagerToDepartment:', error)
    return {
      success: false,
      action: 'NO_ACTION',
      message: 'Failed to process manager assignment'
    }
  }
}

/**
 * Gets all available managers for a department (including those from other departments)
 */
export async function getAvailableManagersForDepartment(_departmentId: string) {
  try {
    const managers = await prisma.user.findMany({
      where: {
        role: 'MANAGER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        departmentId: true,
        departmentRef: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        managedDepartments: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    return managers.map(manager => ({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      currentDepartment: manager.departmentRef?.name,
      currentDepartmentId: manager.departmentId,
      isCurrentlyManaging: manager.managedDepartments.length > 0,
      managedDepartments: manager.managedDepartments
    }))

  } catch (error) {
    console.error('Error getting available managers:', error)
    return []
  }
}

/**
 * Manually assigns a manager to a department (used by admin)
 */
export async function manuallyAssignManager(
  departmentId: string,
  managerId: string,
  adminUserId: string
): Promise<ManagerAssignmentResult> {
  try {
    // Validate manager exists and is active
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    if (!manager || manager.role !== 'MANAGER' || manager.status !== 'ACTIVE') {
      return {
        success: false,
        action: 'NO_ACTION',
        message: 'Invalid manager selected'
      }
    }

    // Get department details
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true, code: true }
    })

    if (!department) {
      return {
        success: false,
        action: 'NO_ACTION',
        message: 'Department not found'
      }
    }

    // Assign manager to department
    await prisma.department.update({
      where: { id: departmentId },
      data: { managerId: managerId }
    })

    // Create audit log
    await createAuditLog(
      'MANAGER_MANUALLY_ASSIGNED',
      'Department',
      departmentId,
      adminUserId,
      `Manager ${manager.name} manually assigned to department ${department.name}`
    )

    return {
      success: true,
      action: 'ASSIGNED',
      assignedManagerId: manager.id,
      assignedManagerName: manager.name || 'Unknown',
      message: `Manager ${manager.name || 'Unknown'} successfully assigned to department ${department.name}`
    }

  } catch (error) {
    console.error('Error in manuallyAssignManager:', error)
    return {
      success: false,
      action: 'NO_ACTION',
      message: 'Failed to assign manager'
    }
  }
}

/**
 * Creates a notification for admin about manager assignment
 */
async function createManagerAssignmentNotification(
  department: { id: string; name: string; code: string; managerId?: string | null },
  scenario: 'NO_MANAGERS' | 'MULTIPLE_MANAGERS',
  message: string,
  availableManagers: Array<{ id: string; name: string | null; email: string }>
): Promise<string> {
  const notificationData = {
    departmentId: department.id,
    departmentName: department.name,
    departmentCode: department.code,
    scenario,
    availableManagers
  }

  const title = scenario === 'NO_MANAGERS' 
    ? `No Manager Available for ${department.name}`
    : `Multiple Managers Available for ${department.name}`

  const fullMessage = scenario === 'NO_MANAGERS'
    ? `Department "${department.name}" has no managers. Please create a new manager or reassign an existing manager from another department.`
    : department.managerId
      ? `Department "${department.name}" has ${availableManagers.length} active managers but only one is assigned as primary. Please review and reassign if needed.`
      : `Department "${department.name}" has ${availableManagers.length} managers. Please select which manager should be assigned to this department.`

  const notification = await prisma.notification.create({
    data: {
      type: 'MANAGER_ASSIGNMENT',
      title,
      message: fullMessage,
      data: JSON.stringify(notificationData),
      priority: 'HIGH',
      targetRole: 'ADMIN'
    }
  })

  return notification.id
}

/**
 * Check all departments for multiple managers and create notifications
 * This should be called whenever a manager is added or activated
 */
export async function checkAndNotifyMultipleManagers(): Promise<{
  success: boolean
  notificationsCreated: number
  departmentsChecked: number
  message: string
}> {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            email: true,
            departmentId: true
          }
        }
      }
    })

    let notificationsCreated = 0

    for (const dept of departments) {
      if (dept.users.length > 1) {
        // Check if notification already exists for this department to avoid duplicates
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'MANAGER_ASSIGNMENT',
            data: {
              contains: `"departmentId":"${dept.id}"`
            },
            status: 'UNREAD'
          }
        })

        if (!existingNotification) {
          await createManagerAssignmentNotification(
            dept,
            'MULTIPLE_MANAGERS',
            'Multiple managers detected in department',
            dept.users
          )
          notificationsCreated++
        }
      } else if (dept.users.length === 0) {
        // Also check for departments with no managers
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'MANAGER_ASSIGNMENT',
            data: {
              contains: `"departmentId":"${dept.id}"`
            },
            status: 'UNREAD'
          }
        })

        if (!existingNotification) {
          await createManagerAssignmentNotification(
            dept,
            'NO_MANAGERS',
            'No managers available in department',
            []
          )
          notificationsCreated++
        }
      }
    }

    return {
      success: true,
      notificationsCreated,
      departmentsChecked: departments.length,
      message: `Checked ${departments.length} departments, created ${notificationsCreated} notifications`
    }
  } catch (error) {
    console.error('Error checking for multiple managers:', error)
    return {
      success: false,
      notificationsCreated: 0,
      departmentsChecked: 0,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Enhanced automatic manager assignment that handles all scenarios
 * This is the main function that should be called whenever manager status changes
 */
export async function processManagerAssignmentForDepartment(
  departmentId: string,
  triggerEvent?: ManagerChangeEvent
): Promise<ManagerAssignmentResult> {
  try {
    // Get department details with current manager and all active managers
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            email: true,
            departmentId: true
          }
        }
      }
    })

    if (!department) {
      return {
        success: false,
        action: 'NO_ACTION',
        message: 'Department not found'
      }
    }

    const activeManagers = department.users
    const currentManagerId = department.managerId

    // Scenario 1: Exactly one active manager and no assigned manager
    if (activeManagers.length === 1 && !currentManagerId) {
      const manager = activeManagers[0]
      
      await prisma.department.update({
        where: { id: departmentId },
        data: { managerId: manager.id }
      })

      await createAuditLog(
        'MANAGER_AUTO_ASSIGNED',
        'Department',
        departmentId,
        'SYSTEM',
        `Manager ${manager.name || 'Unknown'} automatically assigned to department ${department.name}`
      )

      return {
        success: true,
        action: 'ASSIGNED',
        assignedManagerId: manager.id,
        assignedManagerName: manager.name || 'Unknown',
        message: `Manager ${manager.name || 'Unknown'} automatically assigned to department ${department.name}`
      }
    }

    // Scenario 2: No active managers in department
    if (activeManagers.length === 0) {
      // Clear any existing manager assignment if manager is no longer active
      if (currentManagerId) {
        await prisma.department.update({
          where: { id: departmentId },
          data: { managerId: null }
        })
      }

      const notificationId = await createManagerAssignmentNotification(
        department,
        'NO_MANAGERS',
        'No active managers available in department',
        []
      )

      return {
        success: true,
        action: 'NOTIFICATION_SENT',
        notificationId,
        message: 'No active managers found in department. Admin notification sent.',
        availableManagers: []
      }
    }

    // Scenario 3: Multiple managers (2 or more)
    if (activeManagers.length >= 2) {
      // Always notify admin when there are multiple managers
      // Check if notification already exists to avoid duplicates
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'MANAGER_ASSIGNMENT',
          data: {
            contains: `"departmentId":"${departmentId}"`
          },
          status: 'UNREAD'
        }
      })

      if (!existingNotification) {
        const notificationId = await createManagerAssignmentNotification(
          department,
          'MULTIPLE_MANAGERS',
          'Multiple managers available for assignment',
          activeManagers
        )

        return {
          success: true,
          action: 'NOTIFICATION_SENT',
          notificationId,
          message: `Multiple managers (${activeManagers.length}) found. Admin notification sent for manual selection.`,
          availableManagers: activeManagers.map(m => ({
            id: m.id,
            name: m.name || 'Unknown',
            email: m.email,
            currentDepartment: m.departmentId || undefined
          }))
        }
      } else {
        return {
          success: true,
          action: 'NO_ACTION',
          message: 'Multiple managers detected, but admin notification already exists.'
        }
      }
    }

    // Scenario 4: Department already has proper assignment
    return {
      success: true,
      action: 'NO_ACTION',
      message: 'Department manager assignment is already properly configured.'
    }

  } catch (error) {
    console.error('Error in processManagerAssignmentForDepartment:', error)
    return {
      success: false,
      action: 'NO_ACTION',
      message: 'Failed to process manager assignment'
    }
  }
}

/**
 * Process manager assignment for all departments
 * This should be called periodically or when bulk changes occur
 */
export async function processAllDepartmentManagerAssignments(): Promise<{
  success: boolean
  totalDepartments: number
  autoAssigned: number
  notificationsSent: number
  errors: number
  results: ManagerAssignmentResult[]
}> {
  try {
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    })

    const results: ManagerAssignmentResult[] = []
    let autoAssigned = 0
    let notificationsSent = 0
    let errors = 0

    for (const dept of departments) {
      try {
        const result = await processManagerAssignmentForDepartment(dept.id)
        results.push(result)

        if (result.success) {
          if (result.action === 'ASSIGNED') {
            autoAssigned++
          } else if (result.action === 'NOTIFICATION_SENT') {
            notificationsSent++
          }
        } else {
          errors++
        }
      } catch (error) {
        console.error(`Error processing department ${dept.id}:`, error)
        results.push({
          success: false,
          action: 'NO_ACTION',
          message: 'Processing error'
        })
        errors++
      }
    }

    return {
      success: true,
      totalDepartments: departments.length,
      autoAssigned,
      notificationsSent,
      errors,
      results
    }
  } catch (error) {
    console.error('Error in processAllDepartmentManagerAssignments:', error)
    return {
      success: false,
      totalDepartments: 0,
      autoAssigned: 0,
      notificationsSent: 0,
      errors: 1,
      results: []
    }
  }
}

/**
 * Handle manager status change events
 * This should be called whenever a manager's status changes
 */
export async function handleManagerStatusChange(
  managerId: string,
  newStatus: 'ACTIVE' | 'INACTIVE',
  departmentId?: string
): Promise<ManagerAssignmentResult[]> {
  try {
    const results: ManagerAssignmentResult[] = []

    if (newStatus === 'ACTIVE' && departmentId) {
      // Manager activated - check their department
      const result = await processManagerAssignmentForDepartment(departmentId, {
        type: 'MANAGER_ACTIVATED',
        departmentId,
        managerId
      })
      results.push(result)
    } else if (newStatus === 'INACTIVE') {
      // Manager deactivated - check all departments they might affect
      const manager = await prisma.user.findUnique({
        where: { id: managerId },
        include: {
          managedDepartments: true,
          departmentRef: true
        }
      })

      if (manager) {
        // Check departments they were managing
        for (const dept of manager.managedDepartments) {
          const result = await processManagerAssignmentForDepartment(dept.id, {
            type: 'MANAGER_DEACTIVATED',
            departmentId: dept.id,
            managerId
          })
          results.push(result)
        }

        // Check their own department if different
        if (manager.departmentId && !manager.managedDepartments.some(d => d.id === manager.departmentId)) {
          const result = await processManagerAssignmentForDepartment(manager.departmentId, {
            type: 'MANAGER_DEACTIVATED',
            departmentId: manager.departmentId,
            managerId
          })
          results.push(result)
        }
      }
    }

    return results
  } catch (error) {
    console.error('Error handling manager status change:', error)
    return [{
      success: false,
      action: 'NO_ACTION',
      message: 'Failed to handle manager status change'
    }]
  }
}

/**
 * Handle manager department transfer
 */
export async function handleManagerTransfer(
  managerId: string,
  fromDepartmentId: string,
  toDepartmentId: string
): Promise<ManagerAssignmentResult[]> {
  try {
    const results: ManagerAssignmentResult[] = []

    // Process the department they left
    const fromResult = await processManagerAssignmentForDepartment(fromDepartmentId, {
      type: 'MANAGER_TRANSFERRED',
      departmentId: fromDepartmentId,
      managerId,
      previousDepartmentId: fromDepartmentId
    })
    results.push(fromResult)

    // Process the department they joined
    const toResult = await processManagerAssignmentForDepartment(toDepartmentId, {
      type: 'MANAGER_TRANSFERRED',
      departmentId: toDepartmentId,
      managerId,
      previousDepartmentId: fromDepartmentId
    })
    results.push(toResult)

    return results
  } catch (error) {
    console.error('Error handling manager transfer:', error)
    return [{
      success: false,
      action: 'NO_ACTION',
      message: 'Failed to handle manager transfer'
    }]
  }
}

/**
 * Creates an audit log entry
 */
async function createAuditLog(
  action: string,
  entity: string,
  entityId: string,
  performedBy: string,
  details: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        performedBy,
        details
      }
    })
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw error as this is not critical
  }
}
