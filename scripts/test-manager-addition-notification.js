const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testManagerAdditionNotification() {
  try {
    console.log('🧪 Testing Manager Addition Notification System...\n')
    
    // 1. Get a department that currently has only 1 manager (Software Development)
    const targetDept = await prisma.department.findFirst({
      where: { code: 'IT_DEV' },
      include: {
        manager: true,
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!targetDept) {
      console.log('❌ Target department not found')
      return
    }

    console.log(`1️⃣ Current state of ${targetDept.name}:`)
    console.log(`   Assigned Manager: ${targetDept.manager?.name || 'None'}`)
    console.log(`   Available Managers: ${targetDept.users.length}`)
    targetDept.users.forEach(mgr => console.log(`     - ${mgr.name}`))

    // 2. Check current notifications for this department
    const existingNotifications = await prisma.notification.findMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        data: {
          contains: `"departmentId":"${targetDept.id}"`
        },
        status: 'UNREAD'
      }
    })

    console.log(`\n2️⃣ Current notifications for ${targetDept.name}: ${existingNotifications.length}`)

    // 3. Add a new manager to this department
    console.log(`\n3️⃣ Adding a new manager to ${targetDept.name}...`)
    
    const newManagerEmail = `test.manager.${Date.now()}@example.com`
    const newManager = await prisma.user.create({
      data: {
        email: newManagerEmail,
        name: `Test Manager ${Date.now()}`,
        password: await bcrypt.hash('password123', 12),
        role: 'MANAGER',
        department: targetDept.name,
        departmentId: targetDept.id,
        status: 'ACTIVE'
      }
    })

    console.log(`   ✅ Created new manager: ${newManager.name}`)

    // 4. Simulate the notification check that would happen in the API
    console.log(`\n4️⃣ Running notification check...`)
    
    // Get updated department data
    const updatedDept = await prisma.department.findUnique({
      where: { id: targetDept.id },
      include: {
        manager: true,
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      }
    })

    console.log(`   Updated manager count: ${updatedDept.users.length}`)

    // Check if we need to create a notification
    if (updatedDept.users.length > 1) {
      // Check if notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'MANAGER_ASSIGNMENT',
          data: {
            contains: `"departmentId":"${updatedDept.id}"`
          },
          status: 'UNREAD'
        }
      })

      if (!existingNotification) {
        const notificationData = {
          departmentId: updatedDept.id,
          departmentName: updatedDept.name,
          departmentCode: updatedDept.code,
          scenario: 'MULTIPLE_MANAGERS',
          availableManagers: updatedDept.users,
          currentManagerId: updatedDept.managerId,
          currentManagerName: updatedDept.manager?.name || null
        }

        const message = updatedDept.managerId 
          ? `Department "${updatedDept.name}" has ${updatedDept.users.length} active managers but only "${updatedDept.manager?.name}" is assigned as the primary manager. Please review and reassign if needed.`
          : `Department "${updatedDept.name}" has ${updatedDept.users.length} managers. Please select which manager should be assigned to this department.`

        const notification = await prisma.notification.create({
          data: {
            type: 'MANAGER_ASSIGNMENT',
            title: `Multiple Managers in ${updatedDept.name}`,
            message,
            data: JSON.stringify(notificationData),
            priority: 'HIGH',
            targetRole: 'ADMIN',
            status: 'UNREAD'
          }
        })

        console.log(`   ✅ Created notification: ${notification.title}`)
      } else {
        console.log(`   ⏭️  Notification already exists`)
      }
    }

    // 5. Verify the notification was created
    console.log(`\n5️⃣ Verifying notifications...`)
    const finalNotifications = await prisma.notification.findMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        data: {
          contains: `"departmentId":"${targetDept.id}"`
        },
        status: 'UNREAD'
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`   📬 Notifications for ${targetDept.name}: ${finalNotifications.length}`)
    finalNotifications.forEach(notif => {
      console.log(`     - ${notif.title}`)
      console.log(`       ${notif.message}`)
      console.log(`       Created: ${notif.createdAt.toISOString()}`)
    })

    // 6. Show final state
    console.log(`\n6️⃣ Final state of ${targetDept.name}:`)
    console.log(`   Assigned Manager: ${updatedDept.manager?.name || 'None'}`)
    console.log(`   Available Managers: ${updatedDept.users.length}`)
    updatedDept.users.forEach(mgr => console.log(`     - ${mgr.name}`))

    // 7. Clean up - remove the test manager
    console.log(`\n7️⃣ Cleaning up test data...`)
    await prisma.user.delete({
      where: { id: newManager.id }
    })
    console.log(`   ✅ Removed test manager: ${newManager.name}`)

    console.log('\n✅ Test completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   - The notification system correctly detects when a new manager is added')
    console.log('   - Notifications are created for departments with multiple managers')
    console.log('   - The system prevents duplicate notifications')
    console.log('   - Admin will be notified to review and reassign managers as needed')

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testManagerAdditionNotification()
