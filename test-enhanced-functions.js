const { PrismaClient } = require('@prisma/client')
const { 
  processManagerAssignmentForDepartment,
  processAllDepartmentManagerAssignments,
  handleManagerStatusChange,
  handleManagerTransfer
} = require('./src/lib/manager-assignment.ts')

const prisma = new PrismaClient()

async function testEnhancedFunctions() {
  try {
    console.log('🧪 Testing Enhanced Manager Assignment Functions...\n')

    // Get existing departments to test with
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      take: 3,
      include: {
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true }
        }
      }
    })

    if (departments.length === 0) {
      console.log('❌ No departments found for testing')
      return
    }

    // Test 1: Process single department
    console.log('📋 Test 1: Process Single Department')
    const testDept = departments[0]
    console.log(`Testing with department: ${testDept.name} (${testDept.users.length} managers)`)
    
    try {
      const result = await processManagerAssignmentForDepartment(testDept.id)
      console.log('✅ Result:', result)
    } catch (error) {
      console.log('❌ Error:', error.message)
    }

    // Test 2: Process all departments
    console.log('\n📋 Test 2: Process All Departments')
    try {
      const result = await processAllDepartmentManagerAssignments()
      console.log('✅ Result:', {
        totalDepartments: result.totalDepartments,
        autoAssigned: result.autoAssigned,
        notificationsSent: result.notificationsSent,
        errors: result.errors
      })
    } catch (error) {
      console.log('❌ Error:', error.message)
    }

    // Test 3: Handle manager status change (if we have managers)
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER', status: 'ACTIVE' },
      take: 1,
      select: { id: true, name: true, departmentId: true }
    })

    if (managers.length > 0) {
      console.log('\n📋 Test 3: Handle Manager Status Change')
      const testManager = managers[0]
      console.log(`Testing with manager: ${testManager.name}`)
      
      try {
        const result = await handleManagerStatusChange(
          testManager.id, 
          'ACTIVE', 
          testManager.departmentId
        )
        console.log('✅ Result:', result.length, 'departments processed')
      } catch (error) {
        console.log('❌ Error:', error.message)
      }
    }

    // Check recent notifications
    console.log('\n📋 Recent Manager Assignment Notifications:')
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    console.log(`Found ${notifications.length} recent notifications:`)
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - ${notif.status}`)
      console.log(`   Created: ${notif.createdAt}`)
    })

    console.log('\n✅ Enhanced functions test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testEnhancedFunctions()