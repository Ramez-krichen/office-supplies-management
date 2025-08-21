const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function manualTriggerManagerAssignments() {
  try {
    console.log('🔄 Manually Triggering Manager Assignment Processing...\n')

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

    console.log(`📊 Found ${departments.length} active departments\n`)

    let notificationsCreated = 0
    let autoAssigned = 0

    for (const dept of departments) {
      console.log(`🏢 Processing ${dept.name} (${dept.code})`)
      console.log(`   Current Manager: ${dept.manager ? dept.manager.name : 'None'}`)
      console.log(`   Available Managers: ${dept.users.length}`)

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
            performedBy: 'SYSTEM',
            details: `Manager ${manager.name} automatically assigned to department ${dept.name}`
          }
        })

        console.log(`✅ Auto-assigned ${manager.name} to ${dept.name}`)
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

          console.log(`📢 Created notification for ${dept.name} (${dept.users.length} managers available)`)
          notificationsCreated++
        } else {
          console.log(`📢 Notification already exists for ${dept.name}`)
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

          console.log(`📢 Created notification for ${dept.name} (no managers available)`)
          notificationsCreated++
        } else {
          console.log(`📢 Notification already exists for ${dept.name}`)
        }
      }

      console.log('')
    }

    console.log('🎯 Manual Processing Results:')
    console.log(`   Managers Auto-assigned: ${autoAssigned}`)
    console.log(`   Notifications Created: ${notificationsCreated}`)

    // Show summary of departments with multiple managers
    const multipleManagerDepts = departments.filter(d => d.users.length > 1)
    if (multipleManagerDepts.length > 0) {
      console.log(`\n⚠️  Departments with Multiple Managers (${multipleManagerDepts.length}):`)
      multipleManagerDepts.forEach(dept => {
        console.log(`   - ${dept.name}: ${dept.users.length} managers (assigned: ${dept.manager?.name || 'None'})`)
      })
    }

    if (notificationsCreated > 0) {
      console.log(`\n💡 Check the admin notification center for ${notificationsCreated} pending manager assignment decisions.`)
    }

    console.log('\n✅ Manual trigger completed!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

manualTriggerManagerAssignments()