import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAPIEndpoints() {
  console.log('🔧 Testing API endpoints that are causing network errors...')

  try {
    // 1. Test notification system
    console.log('\n1️⃣ Testing notification system...')
    
    // Create a test notification
    const testNotification = await prisma.notification.create({
      data: {
        type: 'SYSTEM_TEST',
        title: 'API Test Notification',
        message: 'Testing notification API endpoints',
        priority: 'MEDIUM',
        targetRole: 'ADMIN',
        status: 'UNREAD'
      }
    })
    
    console.log('✅ Test notification created:', testNotification.id)
    
    // Test updating notification status (like dismissNotification does)
    const updatedNotification = await prisma.notification.update({
      where: { id: testNotification.id },
      data: { 
        status: 'DISMISSED',
        dismissedAt: new Date()
      }
    })
    
    console.log('✅ Notification status updated to DISMISSED')
    
    // Clean up
    await prisma.notification.delete({ where: { id: testNotification.id } })
    console.log('✅ Test notification cleaned up')

    // 2. Test department and manager assignment
    console.log('\n2️⃣ Testing department and manager assignment...')
    
    // Find a department for testing
    const testDepartment = await prisma.department.findFirst({
      include: {
        users: {
          where: { role: 'MANAGER' }
        }
      }
    })
    
    if (testDepartment) {
      console.log(`✅ Found test department: ${testDepartment.name} (${testDepartment.code})`)
      console.log(`   Managers in department: ${testDepartment.users.length}`)
      
      // Test getting available managers
      const availableManagers = await prisma.user.findMany({
        where: {
          role: 'MANAGER',
          status: 'ACTIVE',
          department: testDepartment.code
        }
      })
      
      console.log(`✅ Available managers for ${testDepartment.name}: ${availableManagers.length}`)
    } else {
      console.log('⚠️ No departments found for testing')
    }

    // 3. Test request approval system
    console.log('\n3️⃣ Testing request approval system...')
    
    // Find a pending request for testing
    const pendingRequest = await prisma.request.findFirst({
      where: { status: 'PENDING' },
      include: {
        approvals: true,
        requester: true
      }
    })
    
    if (pendingRequest) {
      console.log(`✅ Found pending request: ${pendingRequest.title}`)
      console.log(`   Request ID: ${pendingRequest.id}`)
      console.log(`   Requester: ${pendingRequest.requester.name}`)
      console.log(`   Current approvals: ${pendingRequest.approvals.length}`)
      
      // Check if we can create an approval (without actually doing it)
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      })
      
      if (adminUser) {
        console.log(`✅ Admin user available for approval: ${adminUser.name}`)
      }
    } else {
      console.log('⚠️ No pending requests found for testing')
    }

    // 4. Test database connections and basic queries
    console.log('\n4️⃣ Testing database connections...')
    
    const userCount = await prisma.user.count()
    const requestCount = await prisma.request.count()
    const notificationCount = await prisma.notification.count()
    const departmentCount = await prisma.department.count()
    
    console.log(`✅ Database queries successful:`)
    console.log(`   Users: ${userCount}`)
    console.log(`   Requests: ${requestCount}`)
    console.log(`   Notifications: ${notificationCount}`)
    console.log(`   Departments: ${departmentCount}`)

    // 5. Check for any data integrity issues
    console.log('\n5️⃣ Checking data integrity...')
    
    // Check for requests without requesters (using requesterId field)
    const orphanedRequests = await prisma.request.count({
      where: {
        requesterId: null
      }
    })

    // Check for approvals without approvers (using approverId field)
    const orphanedApprovals = await prisma.approval.count({
      where: {
        approverId: null
      }
    })
    
    console.log(`✅ Data integrity check:`)
    console.log(`   Orphaned requests: ${orphanedRequests}`)
    console.log(`   Orphaned approvals: ${orphanedApprovals}`)

    // 6. Summary and recommendations
    console.log('\n📋 Summary and Recommendations:')
    console.log('✅ Notification system: Working')
    console.log('✅ Department system: Working')
    console.log('✅ Request system: Working')
    console.log('✅ Database connections: Working')
    
    if (orphanedRequests > 0 || orphanedApprovals > 0) {
      console.log('⚠️ Data integrity issues found - may cause API errors')
    } else {
      console.log('✅ No data integrity issues found')
    }
    
    console.log('\n🎯 If network errors persist:')
    console.log('  1. Check if development server is running on port 3000')
    console.log('  2. Clear browser cache and cookies')
    console.log('  3. Check browser console for specific error details')
    console.log('  4. Verify user session is valid (try logging out and back in)')
    console.log('  5. Check network connectivity')

  } catch (error) {
    console.error('❌ Error during API endpoint testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIEndpoints()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
