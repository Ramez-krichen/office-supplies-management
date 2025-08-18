import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testNotificationFix() {
  console.log('🔧 Testing notification system and user creation...')

  try {
    // 1. Verify the specific users were created
    console.log('\n1️⃣ Verifying specific users...')
    
    const managerUser = await prisma.user.findUnique({
      where: { email: 'manager@example.com' }
    })
    
    const employeeUser = await prisma.user.findUnique({
      where: { email: 'employee@example.com' }
    })
    
    if (managerUser) {
      console.log('✅ Manager user found:', {
        email: managerUser.email,
        name: managerUser.name,
        role: managerUser.role,
        department: managerUser.department,
        status: managerUser.status
      })
    } else {
      console.log('❌ Manager user not found')
    }
    
    if (employeeUser) {
      console.log('✅ Employee user found:', {
        email: employeeUser.email,
        name: employeeUser.name,
        role: employeeUser.role,
        department: employeeUser.department,
        status: employeeUser.status
      })
    } else {
      console.log('❌ Employee user not found')
    }

    // 2. Test notification table structure
    console.log('\n2️⃣ Testing notification table...')
    
    // Create a test notification
    const testNotification = await prisma.notification.create({
      data: {
        type: 'SYSTEM_TEST',
        title: 'Test Notification',
        message: 'Testing notification system functionality',
        priority: 'MEDIUM',
        targetRole: 'ADMIN',
        status: 'UNREAD'
      }
    })
    
    console.log('✅ Test notification created:', testNotification.id)
    
    // Query notifications like the API does
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        status: 'UNREAD',
        OR: [
          { targetRole: 'ADMIN' },
          { targetRole: 'MANAGER' }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    })
    
    console.log(`✅ Found ${unreadNotifications.length} unread notifications`)
    
    // Clean up test notification
    await prisma.notification.delete({ where: { id: testNotification.id } })
    console.log('✅ Test notification cleaned up')

    // 3. Check database connection
    console.log('\n3️⃣ Testing database connection...')
    
    const userCount = await prisma.user.count()
    const notificationCount = await prisma.notification.count()
    
    console.log(`✅ Database connection working - ${userCount} users, ${notificationCount} notifications`)

    // 4. Summary
    console.log('\n📋 Summary:')
    console.log(`  Manager user (manager@example.com): ${managerUser ? '✅ EXISTS' : '❌ MISSING'}`)
    console.log(`  Employee user (employee@example.com): ${employeeUser ? '✅ EXISTS' : '❌ MISSING'}`)
    console.log(`  Notification system: ✅ WORKING`)
    console.log(`  Database connection: ✅ WORKING`)
    
    console.log('\n🎯 Next steps:')
    console.log('  1. Start the development server: npm run dev')
    console.log('  2. Login with admin@example.com / admin123')
    console.log('  3. Or login with manager@example.com / manager123')
    console.log('  4. Or login with employee@example.com / employee123')
    console.log('  5. Check if the notification badge loads without errors')

  } catch (error) {
    console.error('❌ Error during testing:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testNotificationFix()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
