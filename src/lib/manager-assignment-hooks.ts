import { db as prisma } from '@/lib/db'
import { 
  processManagerAssignmentForDepartment,
  handleManagerStatusChange,
  handleManagerTransfer
} from '@/lib/manager-assignment'

/**
 * Hook to be called after a user is created
 */
export async function afterUserCreated(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        departmentId: true
      }
    })

    if (!user || user.role !== 'MANAGER' || user.status !== 'ACTIVE' || !user.departmentId) {
      return
    }

    // Process manager assignment for the department
    await processManagerAssignmentForDepartment(user.departmentId)
    
    console.log(`Manager assignment processed for department ${user.departmentId} after user ${userId} creation`)
  } catch (error) {
    console.error('Error in afterUserCreated hook:', error)
  }
}

/**
 * Hook to be called after a user is updated
 */
export async function afterUserUpdated(
  userId: string,
  previousData: { role?: string; status?: string; departmentId?: string | null },
  newData: { role?: string; status?: string; departmentId?: string | null }
) {
  try {
    console.log(`🔄 Manager Assignment Hook: Processing user update for ${userId}`)
    console.log(`   Previous: role=${previousData.role}, status=${previousData.status}, deptId=${previousData.departmentId}`)
    console.log(`   New: role=${newData.role}, status=${newData.status}, deptId=${newData.departmentId}`)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        departmentId: true
      }
    })

    if (!user) {
      console.log(`❌ User ${userId} not found in afterUserUpdated hook`)
      return
    }

    // Check if role changed to/from MANAGER
    const wasManager = previousData.role === 'MANAGER'
    const isManager = newData.role === 'MANAGER'

    // Check if status changed
    const wasActive = previousData.status === 'ACTIVE'
    const isActive = newData.status === 'ACTIVE'

    // Check if department changed
    const previousDepartmentId = previousData.departmentId
    const currentDepartmentId = newData.departmentId

    console.log(`   Analysis: wasManager=${wasManager}, isManager=${isManager}, wasActive=${wasActive}, isActive=${isActive}`)
    console.log(`   Department change: ${previousDepartmentId} -> ${currentDepartmentId}`)

    // Handle role changes
    if (!wasManager && isManager && isActive && currentDepartmentId) {
      // User became a manager - process their department
      console.log(`📋 Processing: User became manager, processing department ${currentDepartmentId}`)
      await processManagerAssignmentForDepartment(currentDepartmentId)
      console.log(`✅ Manager assignment processed for department ${currentDepartmentId} after user ${userId} became manager`)
    }

    // Handle status changes for managers
    if (isManager && wasActive !== isActive) {
      console.log(`📋 Processing: Manager status change from ${wasActive ? 'ACTIVE' : 'INACTIVE'} to ${isActive ? 'ACTIVE' : 'INACTIVE'}`)
      await handleManagerStatusChange(
        userId,
        isActive ? 'ACTIVE' : 'INACTIVE',
        currentDepartmentId || undefined
      )
      console.log(`✅ Manager status change processed for user ${userId}: ${isActive ? 'ACTIVE' : 'INACTIVE'}`)
    }

    // Handle department transfers for active managers
    if (isManager && isActive && previousDepartmentId !== currentDepartmentId) {
      console.log(`📋 Processing: Manager department change detected`)
      if (previousDepartmentId && currentDepartmentId) {
        // Manager transferred between departments
        console.log(`📋 Processing: Manager transfer between departments`)
        await handleManagerTransfer(userId, previousDepartmentId, currentDepartmentId)
        console.log(`✅ Manager transfer processed for user ${user.name} (${userId}): ${previousDepartmentId} -> ${currentDepartmentId}`)
      } else if (previousDepartmentId && !currentDepartmentId) {
        // Manager removed from department
        console.log(`📋 Processing: Manager removed from department ${previousDepartmentId}`)
        await processManagerAssignmentForDepartment(previousDepartmentId)
        console.log(`✅ Manager assignment processed for department ${previousDepartmentId} after manager ${user.name} (${userId}) removal`)
      } else if (!previousDepartmentId && currentDepartmentId) {
        // Manager added to department
        console.log(`📋 Processing: Manager added to department ${currentDepartmentId}`)
        await processManagerAssignmentForDepartment(currentDepartmentId)
        console.log(`✅ Manager assignment processed for department ${currentDepartmentId} after manager ${user.name} (${userId}) addition`)
      }
    } else if (isManager && isActive) {
      console.log(`📋 No department change detected for active manager ${user.name}`)
    }

    console.log(`✅ Manager Assignment Hook: Completed processing for user ${user.name} (${userId})`)

  } catch (error) {
    console.error('❌ Error in afterUserUpdated hook:', error)
    console.error('Stack trace:', error.stack)
  }
}

/**
 * Hook to be called after a user is deleted
 */
export async function afterUserDeleted(
  userId: string,
  userData: { role?: string; status?: string; departmentId?: string | null }
) {
  try {
    if (userData.role !== 'MANAGER' || !userData.departmentId) {
      return
    }

    // Process manager assignment for the department they were in
    await processManagerAssignmentForDepartment(userData.departmentId)
    
    console.log(`Manager assignment processed for department ${userData.departmentId} after manager ${userId} deletion`)
  } catch (error) {
    console.error('Error in afterUserDeleted hook:', error)
  }
}

/**
 * Hook to be called after a department is created
 */
export async function afterDepartmentCreated(departmentId: string) {
  try {
    // Process manager assignment for the new department
    await processManagerAssignmentForDepartment(departmentId)
    
    console.log(`Manager assignment processed for new department ${departmentId}`)
  } catch (error) {
    console.error('Error in afterDepartmentCreated hook:', error)
  }
}

/**
 * Hook to be called after a department is updated
 */
export async function afterDepartmentUpdated(
  departmentId: string,
  previousData: { status?: string; managerId?: string | null },
  newData: { status?: string; managerId?: string | null }
) {
  try {
    // Check if department status changed
    const wasActive = previousData.status === 'ACTIVE'
    const isActive = newData.status === 'ACTIVE'

    // Check if manager was manually assigned/unassigned
    const previousManagerId = previousData.managerId
    const currentManagerId = newData.managerId

    if (!wasActive && isActive) {
      // Department was activated - process manager assignment
      await processManagerAssignmentForDepartment(departmentId)
      console.log(`Manager assignment processed for activated department ${departmentId}`)
    }

    if (previousManagerId !== currentManagerId) {
      // Manager assignment changed manually - this is fine, no automatic processing needed
      // But we should log it for audit purposes
      console.log(`Department ${departmentId} manager manually changed: ${previousManagerId} -> ${currentManagerId}`)
    }

  } catch (error) {
    console.error('Error in afterDepartmentUpdated hook:', error)
  }
}

/**
 * Utility function to integrate hooks into user operations
 * This should be called from user API endpoints
 */
export const userHooks = {
  afterCreate: afterUserCreated,
  afterUpdate: afterUserUpdated,
  afterDelete: afterUserDeleted
}

/**
 * Utility function to integrate hooks into department operations
 * This should be called from department API endpoints
 */
export const departmentHooks = {
  afterCreate: afterDepartmentCreated,
  afterUpdate: afterDepartmentUpdated
}