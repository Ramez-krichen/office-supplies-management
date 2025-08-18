import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixManagerAssignments() {
  try {
    console.log('🔧 Fixing manager assignments...\n')

    // Get admin user for audit logs
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!adminUser) {
      console.log('❌ No admin user found. Creating one...')
      return
    }

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

    console.log(`Found ${departments.length} departments\n`)

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

          // Create audit log with proper user ID
          await prisma.auditLog.create({
            data: {
              action: 'MANAGER_AUTO_ASSIGNED',
              entity: 'Department',
              entityId: dept.id,
              performedBy: adminUser.id,
              details: `Manager ${manager.name} automatically assigned to department ${dept.name} by system`
            }
          })

          console.log(`✅ Auto-assigned ${manager.name} to ${dept.name}`)
          autoAssigned++
        } catch (error) {
          console.log(`❌ Failed to assign ${manager.name} to ${dept.name}: ${error.message}`)
        }
      } else if (!dept.managerId && dept.users.length > 1) {
        // Create notification for admin
        try {
          const notificationData = {
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            scenario: 'MULTIPLE_MANAGERS',
            availableManagers: dept.users
          }

          await prisma.notification.create({
            data: {
              type: 'MANAGER_ASSIGNMENT',
              title: `Multiple Managers Available for ${dept.name}`,
              message: `Department "${dept.name}" has ${dept.users.length} managers. Please select which manager should be assigned to this department.`,
              data: JSON.stringify(notificationData),
              priority: 'HIGH',
              targetRole: 'ADMIN'
            }
          })

          console.log(`📢 Created notification for ${dept.name} (${dept.users.length} managers available)`)
          notificationsCreated++
        } catch (error) {
          console.log(`❌ Failed to create notification for ${dept.name}: ${error.message}`)
        }
      } else if (!dept.managerId && dept.users.length === 0) {
        // Create notification for no managers
        try {
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
        } catch (error) {
          console.log(`❌ Failed to create notification for ${dept.name}: ${error.message}`)
        }
      } else if (dept.managerId) {
        console.log(`✅ ${dept.name} already has manager: ${dept.manager?.name}`)
      }
    }

    console.log('\n🎯 Results:')
    console.log(`   Managers Auto-assigned: ${autoAssigned}`)
    console.log(`   Notifications Created: ${notificationsCreated}`)

    // Show final status
    const finalDepartments = await prisma.department.findMany({
      include: {
        manager: {
          select: { name: true }
        }
      }
    })

    const finalWithManagers = finalDepartments.filter(d => d.managerId).length
    const finalWithoutManagers = finalDepartments.filter(d => !d.managerId).length

    console.log('\n📊 Final Status:')
    console.log(`   Departments with managers: ${finalWithManagers}`)
    console.log(`   Departments without managers: ${finalWithoutManagers}`)

    if (notificationsCreated > 0) {
      console.log(`\n💡 Check the admin notification center for ${notificationsCreated} pending manager assignment decisions.`)
      console.log('   Go to: http://localhost:3000/admin and click the notification bell icon')
    }

    if (autoAssigned > 0) {
      console.log(`\n🎉 Successfully auto-assigned ${autoAssigned} managers!`)
    }

  } catch (error) {
    console.error('Error fixing manager assignments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixManagerAssignments()
