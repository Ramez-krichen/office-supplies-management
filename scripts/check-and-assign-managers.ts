import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAndAssignManagers() {
  try {
    console.log('🔍 Checking current department and manager status...\n')

    // Get all departments with their current manager assignments and available managers
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          where: {
            role: 'MANAGER',
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`Found ${departments.length} departments:\n`)

    let departmentsWithoutManagers = 0
    let departmentsWithManagers = 0
    let departmentsNeedingAttention = 0

    for (const dept of departments) {
      const hasManager = !!dept.managerId
      const availableManagers = dept.users.length
      
      console.log(`📁 ${dept.name} (${dept.code})`)
      console.log(`   Current Manager: ${hasManager ? dept.manager?.name : 'None'}`)
      console.log(`   Available Managers in Dept: ${availableManagers}`)
      
      if (hasManager) {
        departmentsWithManagers++
        console.log(`   ✅ Status: Has manager assigned`)
      } else {
        departmentsWithoutManagers++
        if (availableManagers === 0) {
          console.log(`   ⚠️  Status: No managers available`)
          departmentsNeedingAttention++
        } else if (availableManagers === 1) {
          console.log(`   🔄 Status: Can auto-assign (1 manager available)`)
        } else {
          console.log(`   🤔 Status: Multiple managers available (${availableManagers}) - needs admin decision`)
          departmentsNeedingAttention++
        }
      }
      console.log('')
    }

    console.log('📊 Summary:')
    console.log(`   Total Departments: ${departments.length}`)
    console.log(`   With Managers: ${departmentsWithManagers}`)
    console.log(`   Without Managers: ${departmentsWithoutManagers}`)
    console.log(`   Needing Attention: ${departmentsNeedingAttention}`)
    console.log('')

    // Now let's try to auto-assign managers where possible
    console.log('🤖 Attempting auto-assignment...\n')

    let autoAssigned = 0
    let notificationsCreated = 0

    for (const dept of departments) {
      if (!dept.managerId && dept.users.length === 1) {
        // Auto-assign the single manager
        const manager = dept.users[0]
        
        try {
          await prisma.department.update({
            where: { id: dept.id },
            data: { managerId: manager.id }
          })

          // Create audit log
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
        } catch (error: any) {
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
        } catch (error: any) {
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
        } catch (error: any) {
          console.log(`❌ Failed to create notification for ${dept.name}: ${error.message}`)
        }
      }
    }

    console.log('\n🎯 Auto-assignment Results:')
    console.log(`   Managers Auto-assigned: ${autoAssigned}`)
    console.log(`   Notifications Created: ${notificationsCreated}`)

    // Show final status
    console.log('\n🔍 Final Status Check...')
    const finalDepartments = await prisma.department.findMany({
      include: {
        manager: {
          select: { name: true }
        }
      }
    })

    const finalWithManagers = finalDepartments.filter(d => d.managerId).length
    const finalWithoutManagers = finalDepartments.filter(d => !d.managerId).length

    console.log(`   Departments with managers: ${finalWithManagers}`)
    console.log(`   Departments without managers: ${finalWithoutManagers}`)

    if (notificationsCreated > 0) {
      console.log(`\n💡 Check the admin notification center for ${notificationsCreated} pending manager assignment decisions.`)
    }

  } catch (error: any) {
    console.error('Error checking and assigning managers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndAssignManagers()
