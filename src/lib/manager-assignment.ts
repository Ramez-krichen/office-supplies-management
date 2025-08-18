import { db as prisma } from '@/lib/db'

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
        assignedManagerName: manager.name,
        message: `Manager ${manager.name} automatically assigned to department ${department.name}`
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
        availableManagers: departmentManagers
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
export async function getAvailableManagersForDepartment(departmentId: string) {
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
      assignedManagerName: manager.name,
      message: `Manager ${manager.name} successfully assigned to department ${department.name}`
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
  department: any,
  scenario: 'NO_MANAGERS' | 'MULTIPLE_MANAGERS',
  message: string,
  availableManagers: any[]
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
      message: `Error: ${error.message}`
    }
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
