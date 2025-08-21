const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDepartmentChangeNotification() {
  try {
    console.log('🧪 Testing Department Change Notification System...\n')

    // Find a test department with managers
    const testDept = await prisma.department.findFirst({
      where: { 
        name: { contains: 'Customer Service' }
      },
      include: {
        users: {
          where: { role: 'MANAGER' },
          select: { id: true, name: true, email: true }
        }
      }
    })

    if (!testDept) {
      console.log('❌ Customer Service department not found')
      return
    }

    console.log(`📋 Testing with ${testDept.name} department`)
    console.log(`   Current managers: ${testDept.users.length}\n`)

    // Create a new manager user for testing
    const newManager = await prisma.user.create({
      data: {
        email: `test.manager.${Date.now()}@company.com`,
        name: 'Test Manager',
        password: '$2a$12$example_hashed_password', // This is just a placeholder
        role: 'MANAGER',
        status: 'ACTIVE',
        department: testDept.name,
        departmentId: testDept.id
      }
    })

    console.log(`✅ Created test manager: ${newManager.name} (${newManager.email})`)
    console.log(`   Assigned to department: ${testDept.name}\n`)

    // Simulate the department change scenario
    console.log('🔄 Simulating department change scenario...')
    
    // This would normally happen when you change a manager's department in the UI
    // Let's trigger the manager assignment processing manually to see if notifications are created
    
    // Get updated department info with all managers
    const updatedDept = await prisma.department.findUnique({
      where: { id: testDept.id },
      include: {
        manager: {
          select: { id: true, name: true }
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
      }
    })

    console.log(`📊 After adding manager, ${updatedDept.name} has ${updatedDept.users.length} active managers`)

    // Check if we should create a notification for multiple managers
    if (updatedDept.users.length > 1) {
      console.log('📢 Checking if notification should be created...')

      // Check if notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'MANAGER_ASSIGNMENT',
          data: {
            contains: `"departmentId":"${testDept.id}"`
          },
          status: 'UNREAD'
        }
      })

      if (!existingNotification) {
        const notificationData = {
          departmentId: testDept.id,
          departmentName: testDept.name,
          departmentCode: testDept.code,
          scenario: 'MULTIPLE_MANAGERS',
          availableManagers: updatedDept.users,
          currentManagerId: updatedDept.managerId,
          currentManagerName: updatedDept.manager?.name || null
        }

        const message = updatedDept.managerId
          ? `Department "${testDept.name}" has ${updatedDept.users.length} active managers but only "${updatedDept.manager?.name}" is assigned as the primary manager. Please review and reassign if needed.`
          : `Department "${testDept.name}" has ${updatedDept.users.length} managers. Please select which manager should be assigned to this department.`

        await prisma.notification.create({
          data: {
            type: 'MANAGER_ASSIGNMENT',
            title: `Multiple Managers in ${testDept.name}`,
            message,
            data: JSON.stringify(notificationData),
            priority: 'HIGH',
            targetRole: 'ADMIN'
          }
        })

        console.log('✅ Created notification for multiple managers in department')
      } else {
        console.log('📢 Notification already exists for this department')
      }
    }

    // Clean up - delete the test manager
    await prisma.user.delete({
      where: { id: newManager.id }
    })
    console.log(`🧹 Cleaned up test manager: ${newManager.name}\n`)

    // Show recent notifications
    console.log('📋 Recent Manager Assignment Notifications:')
    const recentNotifications = await prisma.notification.findMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    console.log(`Found ${recentNotifications.length} recent notifications:`)
    recentNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - ${notif.status}`)
      console.log(`   Message: ${notif.message.substring(0, 100)}...`)
      console.log(`   Created: ${notif.createdAt}`)
      console.log('')
    })

    console.log('✅ Department change notification test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDepartmentChangeNotification()