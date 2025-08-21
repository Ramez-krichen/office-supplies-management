const { PrismaClient } = require('@prisma/client')

async function runPeriodicCheck() {
  try {
    console.log('🕒 Running Periodic Manager Assignment Check...\n')
    
    const prisma = new PrismaClient()
    const startTime = new Date()
    
    // Get all active departments with their managers
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
    let autoAssigned = 0
    const results = []

    for (const dept of departments) {
      console.log(`🏢 Processing ${dept.name} (${dept.code})`)
      console.log(`   Current Manager: ${dept.manager ? dept.manager.name : 'None'}`)
      console.log(`   Available Managers: ${dept.users.length}`)

      const result = {
        departmentId: dept.id,
        departmentName: dept.name,
        currentManager: dept.manager?.name || null,
        availableManagers: dept.users.length,
        action: 'NO_ACTION',
        message: 'No action needed'
      }

      if (dept.users.length === 1 && !dept.managerId) {
        // Auto-assign single manager
        const manager = dept.users[0]
        
        await prisma.department.update({
          where: { id: dept.id },
          data: { managerId: manager.id }
        })

        await prisma.auditLog.create({
          data: {
            action: 'MANAGER_AUTO_ASSIGNED',
            entity: 'Department',
            entityId: dept.id,
            performedBy: 'SYSTEM_PERIODIC_CHECK',
            details: `Manager ${manager.name} automatically assigned to department ${dept.name} via periodic check`
          }
        })

        result.action = 'AUTO_ASSIGNED'
        result.message = `Auto-assigned ${manager.name}`
        autoAssigned++

      } else if (dept.users.length > 1) {
        // Check if notification already exists
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
          const notificationData = {
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            scenario: 'MULTIPLE_MANAGERS',
            availableManagers: dept.users,
            currentManagerId: dept.managerId,
            currentManagerName: dept.manager?.name || null
          }

          const message = dept.managerId
            ? `Department "${dept.name}" has ${dept.users.length} active managers but only "${dept.manager?.name}" is assigned as the primary manager. Please review and reassign if needed.`
            : `Department "${dept.name}" has ${dept.users.length} managers. Please select which manager should be assigned to this department.`

          await prisma.notification.create({
            data: {
              type: 'MANAGER_ASSIGNMENT',
              title: `Multiple Managers in ${dept.name}`,
              message,
              data: JSON.stringify(notificationData),
              priority: 'HIGH',
              targetRole: 'ADMIN'
            }
          })

          result.action = 'NOTIFICATION_CREATED'
          result.message = `Created notification for ${dept.users.length} managers`
          notificationsCreated++
        } else {
          result.action = 'NOTIFICATION_EXISTS'
          result.message = 'Notification already exists'
        }

      } else if (dept.users.length === 0) {
        // Check if notification already exists for no managers
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
          const notificationData = {
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            scenario: 'NO_MANAGERS',
            availableManagers: []
          }

          await prisma.notification.create({
            data: {
              type: 'MANAGER_ASSIGNMENT',
              title: `No Manager Available for ${dept.name}`,
              message: `Department "${dept.name}" has no managers. Please create a new manager or reassign an existing manager from another department.`,
              data: JSON.stringify(notificationData),
              priority: 'HIGH',
              targetRole: 'ADMIN'
            }
          })

          result.action = 'NOTIFICATION_CREATED'
          result.message = 'Created notification for no managers'
          notificationsCreated++
        } else {
          result.action = 'NOTIFICATION_EXISTS'
          result.message = 'Notification already exists'
        }
      }

      results.push(result)
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    
    console.log('\n📊 Processing Results:')
    console.log(`   Total Departments: ${departments.length}`)
    console.log(`   Auto-Assigned: ${autoAssigned}`)
    console.log(`   Notifications Created: ${notificationsCreated}`)
    console.log(`   Duration: ${duration}ms\n`)
    
    // Show summary of departments with notifications
    const departmentsWithNotifications = results.filter(r => r.action === 'NOTIFICATION_CREATED')
    if (departmentsWithNotifications.length > 0) {
      console.log('📢 Departments with new notifications:')
      departmentsWithNotifications.forEach(r => {
        console.log(`   - ${r.departmentName}: ${r.message}`)
      })
      console.log('')
    }
    
    // Show summary of auto-assigned departments
    const autoAssignedDepts = results.filter(r => r.action === 'AUTO_ASSIGNED')
    if (autoAssignedDepts.length > 0) {
      console.log('✅ Auto-assigned departments:')
      autoAssignedDepts.forEach(r => {
        console.log(`   - ${r.departmentName}: ${r.message}`)
      })
      console.log('')
    }
    
    console.log('✅ Periodic Manager Assignment Check Completed!')

  } catch (error) {
    console.error('❌ Error in periodic manager assignment check:', error)
  }
}

runPeriodicCheck()