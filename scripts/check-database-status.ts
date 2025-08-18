import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseStatus() {
  try {
    console.log('🔍 Checking Database Status...\n')

    // Check all tables
    const counts = {
      users: await prisma.user.count(),
      departments: await prisma.department.count(),
      requests: await prisma.request.count(),
      purchaseOrders: await prisma.purchaseOrder.count(),
      items: await prisma.item.count(),
      categories: await prisma.category.count(),
      suppliers: await prisma.supplier.count()
    }

    console.log('📊 Table Counts:')
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`)
    })

    // Check if we have any admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true }
    })

    console.log('\n👤 Admin Users:')
    if (adminUsers.length === 0) {
      console.log('   ❌ No admin users found!')
    } else {
      adminUsers.forEach(admin => {
        console.log(`   ✅ ${admin.name} (${admin.email})`)
      })
    }

    // Check recent data
    const recentRequests = await prisma.request.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true }
    })

    console.log('\n📋 Recent Requests:')
    if (recentRequests.length === 0) {
      console.log('   ❌ No requests found!')
    } else {
      recentRequests.forEach(req => {
        console.log(`   - ${req.title} (${req.createdAt.toISOString()})`)
      })
    }

    console.log('\n🎯 Status Summary:')
    if (counts.users === 0) {
      console.log('   ❌ Database appears to be empty - migration reset wiped all data')
      console.log('   💡 Need to run comprehensive seed script to restore data')
    } else {
      console.log('   ✅ Database has data')
    }

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseStatus()
