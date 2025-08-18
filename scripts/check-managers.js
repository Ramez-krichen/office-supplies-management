const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkManagerAssignments() {
  try {
    console.log('🔍 Checking manager assignments...')
    
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true }
        },
        users: {
          where: { role: 'MANAGER', status: 'ACTIVE' },
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    console.log('\n📊 Department Manager Status:')
    departments.forEach(dept => {
      const hasManager = dept.manager ? '✅' : '❌'
      const managerCount = dept.users.length
      console.log(`  ${hasManager} ${dept.name} (${dept.code})`)
      console.log(`     Manager: ${dept.manager ? dept.manager.name : 'None assigned'}`)
      console.log(`     Available managers in dept: ${managerCount}`)
      if (managerCount > 0) {
        dept.users.forEach(mgr => console.log(`       - ${mgr.name}`))
      }
      console.log('')
    })
    
    const unassignedDepts = departments.filter(d => !d.managerId)
    console.log(`\n📈 Summary: ${unassignedDepts.length} departments without managers`)
    
    // Check notifications
    const notifications = await prisma.notification.findMany({
      where: { type: 'MANAGER_ASSIGNMENT' },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log(`\n🔔 Recent manager assignment notifications: ${notifications.length}`)
    notifications.forEach(notif => {
      console.log(`  - ${notif.title} (${notif.status}) - ${notif.createdAt.toISOString()}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkManagerAssignments()
