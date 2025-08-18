const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAndAssignManagers() {
  try {
    console.log('🔍 Checking and assigning managers with updated logic...')
    
    // Get all departments with their managers and available manager users
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

    console.log(`\n📊 Found ${departments.length} active departments`)
    
    let autoAssigned = 0
    let notificationsCreated = 0

    for (const dept of departments) {
      console.log(`\n🏢 Processing ${dept.name} (${dept.code})`)
      console.log(`   Current Manager: ${dept.manager ? dept.manager.name : 'None'}`)
      console.log(`   Available Managers: ${dept.users.length}`)
      
      if (dept.users.length === 1 && !dept.managerId) {
        // Exactly one manager and no one assigned - auto-assign
        const manager = dept.users[0]
        try {
          await prisma.department.update({
            where: { id: dept.id },
            data: { managerId: manager.id }
          })

          console.log(`✅ Auto-assigned ${manager.name} to ${dept.name}`)
          autoAssigned++
        } catch (error) {
          console.log(`❌ Failed to assign ${manager.name} to ${dept.name}: ${error.message}`)
        }
      } else if (dept.users.length > 1) {
        // Create notification for admin when department has multiple managers
        // This applies whether the department has an assigned manager or not
        try {
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
        } catch (error) {
          console.log(`❌ Failed to create notification for ${dept.name}: ${error.message}`)
        }
      } else if (dept.users.length === 0) {
        // Create notification for no managers (regardless of assignment status)
        try {
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
        } catch (error) {
          console.log(`❌ Failed to create notification for ${dept.name}: ${error.message}`)
        }
      }
    }

    console.log('\n🎯 Auto-assignment Results:')
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

  } catch (error) {
    console.error('Error checking and assigning managers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndAssignManagers()
