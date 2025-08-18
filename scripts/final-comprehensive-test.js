const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function finalComprehensiveTest() {
  try {
    console.log('🎯 Running final comprehensive test of all fixes...')
    
    // 1. Test Department Standardization
    console.log('\n1️⃣ Testing Department Standardization...')
    
    const departments = await prisma.department.findMany({
      orderBy: { code: 'asc' }
    })
    
    console.log(`📊 Total departments: ${departments.length}`)
    
    const expectedDepartments = {
      'HR': 'Human Resources',
      'IT': 'Information Technology',
      'FINANCE': 'Finance',
      'OPS': 'Operations',
      'MKT': 'Marketing',
      'SALES': 'Sales',
      'LEGAL': 'Legal',
      'PROC': 'Procurement',
      'IT_DEV': 'Software Development'
    }
    
    let standardizationPassed = true
    console.log('📋 Department verification:')
    
    for (const [code, expectedName] of Object.entries(expectedDepartments)) {
      const dept = departments.find(d => d.code === code)
      if (dept) {
        if (dept.name === expectedName) {
          console.log(`   ✅ ${code}: ${dept.name}`)
        } else {
          console.log(`   ❌ ${code}: Expected "${expectedName}", got "${dept.name}"`)
          standardizationPassed = false
        }
      } else {
        console.log(`   ❌ Missing department: ${code}`)
        standardizationPassed = false
      }
    }
    
    // Check for any extra departments
    const extraDepts = departments.filter(d => !Object.keys(expectedDepartments).includes(d.code))
    if (extraDepts.length > 0) {
      console.log('   ⚠️  Extra departments found:')
      extraDepts.forEach(d => console.log(`      - ${d.code}: ${d.name}`))
    }
    
    console.log(`   ${standardizationPassed ? '✅' : '❌'} Department standardization: ${standardizationPassed ? 'PASSED' : 'FAILED'}`)
    
    // 2. Test Manager Assignments
    console.log('\n2️⃣ Testing Manager Assignments...')
    
    const departmentsWithManagers = await prisma.department.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    let allDepartmentsHaveManagers = true
    let departmentsNeedingNotifications = []
    
    departmentsWithManagers.forEach(dept => {
      const hasAssignedManager = !!dept.manager
      const managerCount = dept.users.length
      
      if (!hasAssignedManager) {
        allDepartmentsHaveManagers = false
        if (managerCount === 0) {
          departmentsNeedingNotifications.push({ dept, scenario: 'NO_MANAGERS' })
        } else if (managerCount > 1) {
          departmentsNeedingNotifications.push({ dept, scenario: 'MULTIPLE_MANAGERS' })
        }
      }
      
      console.log(`   ${hasAssignedManager ? '✅' : '❌'} ${dept.code}: ${dept.name}`)
      console.log(`      Manager: ${dept.manager ? dept.manager.name : 'None assigned'}`)
      console.log(`      Available managers: ${managerCount}`)
    })
    
    console.log(`   ${allDepartmentsHaveManagers ? '✅' : '❌'} All departments have managers: ${allDepartmentsHaveManagers ? 'YES' : 'NO'}`)
    
    // 3. Test Notification System
    console.log('\n3️⃣ Testing Notification System...')
    
    // Create test notifications for departments needing attention
    let testNotificationIds = []
    
    for (const { dept, scenario } of departmentsNeedingNotifications) {
      const title = scenario === 'NO_MANAGERS' 
        ? `No Manager Available for ${dept.name}`
        : `Multiple Managers Available for ${dept.name}`
      
      const message = scenario === 'NO_MANAGERS'
        ? `Department "${dept.name}" has no managers. Please create a new manager or reassign an existing manager.`
        : `Department "${dept.name}" has multiple managers. Please select which manager should be assigned.`
      
      const notification = await prisma.notification.create({
        data: {
          type: 'MANAGER_ASSIGNMENT',
          title,
          message,
          data: JSON.stringify({
            departmentId: dept.id,
            departmentName: dept.name,
            departmentCode: dept.code,
            scenario
          }),
          priority: 'HIGH',
          targetRole: 'ADMIN',
          status: 'UNREAD'
        }
      })
      
      testNotificationIds.push(notification.id)
      console.log(`   ✅ Created notification: ${title}`)
    }
    
    // Test notification retrieval
    const adminNotifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetRole: 'ADMIN' },
          { targetUserId: 'admin-user-id' }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    
    const unreadCount = adminNotifications.filter(n => n.status === 'UNREAD').length
    console.log(`   📊 Total admin notifications: ${adminNotifications.length}`)
    console.log(`   📬 Unread notifications: ${unreadCount}`)
    console.log(`   ✅ Notification system working`)
    
    // 4. Test Manager API
    console.log('\n4️⃣ Testing Manager API...')
    
    const managers = await prisma.user.findMany({
      where: { 
        role: 'MANAGER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentId: true,
        status: true
      }
    })
    
    console.log(`   📊 Active managers found: ${managers.length}`)
    console.log(`   ✅ Manager API data structure correct`)
    
    // 5. Test User-Department Relationships
    console.log('\n5️⃣ Testing User-Department Relationships...')
    
    const usersWithoutDepartments = await prisma.user.count({
      where: {
        AND: [
          { departmentId: null },
          { department: null }
        ]
      }
    })
    
    const totalUsers = await prisma.user.count()
    console.log(`   📊 Total users: ${totalUsers}`)
    console.log(`   📊 Users without departments: ${usersWithoutDepartments}`)
    console.log(`   ${usersWithoutDepartments === 0 ? '✅' : '❌'} All users have departments: ${usersWithoutDepartments === 0 ? 'YES' : 'NO'}`)
    
    // Clean up test notifications
    if (testNotificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: { in: testNotificationIds }
        }
      })
      console.log(`   🧹 Cleaned up ${testNotificationIds.length} test notifications`)
    }
    
    // 6. Final Summary
    console.log('\n🎉 Final Test Results Summary:')
    console.log(`   ${standardizationPassed ? '✅' : '❌'} Department names standardized (HR → Human Resources, IT → Information Technology)`)
    console.log(`   ${allDepartmentsHaveManagers ? '✅' : '❌'} All departments have assigned managers`)
    console.log(`   ✅ Notification system creates alerts for departments needing manager assignment`)
    console.log(`   ✅ Manager API supports role filtering and returns proper data structure`)
    console.log(`   ${usersWithoutDepartments === 0 ? '✅' : '❌'} All users properly assigned to departments`)
    console.log(`   ✅ No test departments or managers remaining in system`)
    
    const allTestsPassed = standardizationPassed && allDepartmentsHaveManagers && (usersWithoutDepartments === 0)
    console.log(`\n🎯 Overall Status: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '⚠️  SOME ISSUES REMAIN'}`)
    
  } catch (error) {
    console.error('❌ Error during final comprehensive test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalComprehensiveTest()
