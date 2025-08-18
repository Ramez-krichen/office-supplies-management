const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMultipleManagerNotifications() {
  try {
    console.log('🧪 Testing Multiple Manager Notifications System...\n')
    
    // 1. Check current department status
    console.log('1️⃣ Checking current department manager status...')
    const departments = await prisma.department.findMany({
      where: { status: 'ACTIVE' },
      include: {
        manager: {
          select: { id: true, name: true, email: true }
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

    console.log(`📊 Found ${departments.length} active departments:`)
    let multipleManagerDepts = 0
    let noManagerDepts = 0
    let singleManagerDepts = 0

    departments.forEach(dept => {
      const managerCount = dept.users.length
      const hasAssignedManager = dept.manager ? '✅' : '❌'
      
      console.log(`  ${hasAssignedManager} ${dept.name} (${dept.code})`)
      console.log(`     Assigned Manager: ${dept.manager ? dept.manager.name : 'None'}`)
      console.log(`     Available Managers: ${managerCount}`)
      
      if (managerCount > 1) {
        multipleManagerDepts++
        console.log(`     ⚠️  MULTIPLE MANAGERS DETECTED`)
        dept.users.forEach(mgr => console.log(`       - ${mgr.name}`))
      } else if (managerCount === 0) {
        noManagerDepts++
        console.log(`     ❌ NO MANAGERS AVAILABLE`)
      } else {
        singleManagerDepts++
      }
      console.log('')
    })

    console.log(`📈 Summary:`)
    console.log(`   - Departments with multiple managers: ${multipleManagerDepts}`)
    console.log(`   - Departments with no managers: ${noManagerDepts}`)
    console.log(`   - Departments with single manager: ${singleManagerDepts}`)

    // 2. Check existing notifications
    console.log('\n2️⃣ Checking existing notifications...')
    const existingNotifications = await prisma.notification.findMany({
      where: { type: 'MANAGER_ASSIGNMENT' },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📬 Found ${existingNotifications.length} existing manager assignment notifications`)
    existingNotifications.forEach(notif => {
      console.log(`   - ${notif.title} (${notif.status}) - ${notif.createdAt.toISOString()}`)
    })

    // 3. Create notifications for departments with multiple managers
    console.log('\n3️⃣ Creating notifications for departments with multiple managers...')
    let notificationsCreated = 0

    for (const dept of departments) {
      if (dept.users.length > 1) {
        // Check if notification already exists
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
              targetRole: 'ADMIN',
              status: 'UNREAD'
            }
          })

          console.log(`   ✅ Created notification for ${dept.name} (${dept.users.length} managers)`)
          notificationsCreated++
        } else {
          console.log(`   ⏭️  Notification already exists for ${dept.name}`)
        }
      }
    }

    console.log(`\n📢 Created ${notificationsCreated} new notifications`)

    // 4. Verify notifications were created
    console.log('\n4️⃣ Verifying notifications...')
    const newNotifications = await prisma.notification.findMany({
      where: { 
        type: 'MANAGER_ASSIGNMENT',
        status: 'UNREAD'
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📬 Total unread manager assignment notifications: ${newNotifications.length}`)
    newNotifications.forEach(notif => {
      console.log(`   - ${notif.title}`)
      console.log(`     ${notif.message}`)
      console.log(`     Created: ${notif.createdAt.toISOString()}`)
      console.log('')
    })

    console.log('✅ Test completed successfully!')

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMultipleManagerNotifications()
