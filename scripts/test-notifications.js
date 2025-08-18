const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testNotificationSystem() {
  try {
    console.log('🔔 Testing notification system...')
    
    // 1. Create test notifications
    console.log('\n1️⃣ Creating test notifications...')
    
    const testNotifications = [
      {
        type: 'MANAGER_ASSIGNMENT',
        title: 'Manager Assignment Required',
        message: 'Department "Test Department" needs a manager assignment',
        priority: 'HIGH',
        targetRole: 'ADMIN',
        status: 'UNREAD'
      },
      {
        type: 'SYSTEM_ALERT',
        title: 'Low Stock Alert',
        message: 'Several items are running low on stock',
        priority: 'MEDIUM',
        targetRole: 'MANAGER',
        status: 'UNREAD'
      },
      {
        type: 'APPROVAL_REQUEST',
        title: 'Purchase Order Approval',
        message: 'Purchase order #12345 requires approval',
        priority: 'HIGH',
        targetRole: 'ADMIN',
        status: 'UNREAD'
      }
    ]
    
    const createdNotifications = []
    for (const notif of testNotifications) {
      const created = await prisma.notification.create({ data: notif })
      createdNotifications.push(created)
      console.log(`   ✅ Created: ${notif.title}`)
    }
    
    // 2. Test notification retrieval
    console.log('\n2️⃣ Testing notification retrieval...')
    
    // Get all notifications
    const allNotifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    console.log(`   📊 Total notifications in database: ${allNotifications.length}`)
    
    // Get unread notifications
    const unreadNotifications = await prisma.notification.findMany({
      where: { status: 'UNREAD' },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`   📬 Unread notifications: ${unreadNotifications.length}`)
    
    // Get admin notifications
    const adminNotifications = await prisma.notification.findMany({
      where: { targetRole: 'ADMIN' },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`   👑 Admin notifications: ${adminNotifications.length}`)
    
    // Get manager notifications
    const managerNotifications = await prisma.notification.findMany({
      where: { targetRole: 'MANAGER' },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`   👔 Manager notifications: ${managerNotifications.length}`)
    
    // 3. Test notification status updates
    console.log('\n3️⃣ Testing notification status updates...')
    
    if (createdNotifications.length > 0) {
      const firstNotif = createdNotifications[0]
      
      // Mark as read
      await prisma.notification.update({
        where: { id: firstNotif.id },
        data: { 
          status: 'READ',
          readAt: new Date()
        }
      })
      console.log(`   ✅ Marked notification as read: ${firstNotif.title}`)
      
      // Mark another as dismissed
      if (createdNotifications.length > 1) {
        const secondNotif = createdNotifications[1]
        await prisma.notification.update({
          where: { id: secondNotif.id },
          data: { 
            status: 'DISMISSED',
            dismissedAt: new Date()
          }
        })
        console.log(`   ✅ Marked notification as dismissed: ${secondNotif.title}`)
      }
    }
    
    // 4. Test notification filtering
    console.log('\n4️⃣ Testing notification filtering...')
    
    const highPriorityNotifs = await prisma.notification.findMany({
      where: { priority: 'HIGH' },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`   🚨 High priority notifications: ${highPriorityNotifs.length}`)
    
    const managerAssignmentNotifs = await prisma.notification.findMany({
      where: { type: 'MANAGER_ASSIGNMENT' },
      orderBy: { createdAt: 'desc' }
    })
    console.log(`   👥 Manager assignment notifications: ${managerAssignmentNotifs.length}`)
    
    // 5. Test notification counts by status
    console.log('\n5️⃣ Testing notification counts...')
    
    const statusCounts = await prisma.notification.groupBy({
      by: ['status'],
      _count: { id: true }
    })
    
    console.log('   📈 Notification counts by status:')
    statusCounts.forEach(count => {
      console.log(`      ${count.status}: ${count._count.id}`)
    })
    
    // 6. Clean up test notifications
    console.log('\n6️⃣ Cleaning up test notifications...')
    
    const deletedCount = await prisma.notification.deleteMany({
      where: {
        id: {
          in: createdNotifications.map(n => n.id)
        }
      }
    })
    console.log(`   ✅ Deleted ${deletedCount.count} test notifications`)
    
    console.log('\n🎉 Notification system test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNotificationSystem()
