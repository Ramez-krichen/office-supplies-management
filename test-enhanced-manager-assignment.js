const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testEnhancedManagerAssignment() {
  try {
    console.log('🧪 Testing Enhanced Manager Assignment System...\n')

    // Test 1: Single manager auto-assignment
    console.log('📋 Test 1: Single Manager Auto-Assignment')
    console.log('Creating a department with exactly one manager...')
    
    // Create test department
    const testDept = await prisma.department.create({
      data: {
        code: 'TEST001',
        name: 'Test Department 1',
        description: 'Test department for single manager assignment',
        status: 'ACTIVE'
      }
    })

    // Create a single manager for this department
    const singleManager = await prisma.user.create({
      data: {
        email: 'single.manager@test.com',
        name: 'Single Manager',
        password: 'hashedpassword',
        role: 'MANAGER',
        status: 'ACTIVE',
        departmentId: testDept.id,
        department: testDept.name
      }
    })

    // Test the auto-assignment
    const response = await fetch('http://localhost:3000/api/admin/departments/process-manager-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process-single-department',
        departmentId: testDept.id
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Single manager auto-assignment result:', result.result)
    } else {
      console.log('❌ Single manager auto-assignment failed')
    }

    // Test 2: Multiple managers notification
    console.log('\n📋 Test 2: Multiple Managers Notification')
    console.log('Creating a department with multiple managers...')

    // Create another test department
    const testDept2 = await prisma.department.create({
      data: {
        code: 'TEST002',
        name: 'Test Department 2',
        description: 'Test department for multiple managers',
        status: 'ACTIVE'
      }
    })

    // Create multiple managers for this department
    const manager1 = await prisma.user.create({
      data: {
        email: 'manager1@test.com',
        name: 'Manager One',
        password: 'hashedpassword',
        role: 'MANAGER',
        status: 'ACTIVE',
        departmentId: testDept2.id,
        department: testDept2.name
      }
    })

    const manager2 = await prisma.user.create({
      data: {
        email: 'manager2@test.com',
        name: 'Manager Two',
        password: 'hashedpassword',
        role: 'MANAGER',
        status: 'ACTIVE',
        departmentId: testDept2.id,
        department: testDept2.name
      }
    })

    // Test the multiple managers notification
    const response2 = await fetch('http://localhost:3000/api/admin/departments/process-manager-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process-single-department',
        departmentId: testDept2.id
      })
    })

    if (response2.ok) {
      const result2 = await response2.json()
      console.log('✅ Multiple managers notification result:', result2.result)
    } else {
      console.log('❌ Multiple managers notification failed')
    }

    // Test 3: No managers notification
    console.log('\n📋 Test 3: No Managers Notification')
    console.log('Creating a department with no managers...')

    // Create another test department
    const testDept3 = await prisma.department.create({
      data: {
        code: 'TEST003',
        name: 'Test Department 3',
        description: 'Test department with no managers',
        status: 'ACTIVE'
      }
    })

    // Test the no managers notification
    const response3 = await fetch('http://localhost:3000/api/admin/departments/process-manager-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process-single-department',
        departmentId: testDept3.id
      })
    })

    if (response3.ok) {
      const result3 = await response3.json()
      console.log('✅ No managers notification result:', result3.result)
    } else {
      console.log('❌ No managers notification failed')
    }

    // Test 4: Process all departments
    console.log('\n📋 Test 4: Process All Departments')
    const response4 = await fetch('http://localhost:3000/api/admin/departments/process-manager-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process-all-departments'
      })
    })

    if (response4.ok) {
      const result4 = await response4.json()
      console.log('✅ Process all departments result:', result4.result)
    } else {
      console.log('❌ Process all departments failed')
    }

    // Check notifications created
    console.log('\n📋 Checking Admin Notifications...')
    const notifications = await prisma.notification.findMany({
      where: {
        type: 'MANAGER_ASSIGNMENT',
        targetRole: 'ADMIN'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    console.log(`Found ${notifications.length} manager assignment notifications:`)
    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.title} - ${notif.status}`)
      console.log(`   Message: ${notif.message}`)
      console.log(`   Created: ${notif.createdAt}`)
      console.log('')
    })

    // Cleanup test data
    console.log('🧹 Cleaning up test data...')
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['single.manager@test.com', 'manager1@test.com', 'manager2@test.com']
        }
      }
    })

    await prisma.department.deleteMany({
      where: {
        code: {
          in: ['TEST001', 'TEST002', 'TEST003']
        }
      }
    })

    console.log('✅ Test cleanup completed')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testEnhancedManagerAssignment()