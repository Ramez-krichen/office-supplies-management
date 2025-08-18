import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyAdminStatus() {
  try {
    console.log('🔍 Verifying admin user status...\n')

    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true,
        createdAt: true
      }
    })

    console.log(`📊 Total admin users found: ${adminUsers.length}`)
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found! This is a problem.')
    } else if (adminUsers.length === 1) {
      console.log('✅ Exactly one admin user found (correct)')
      const admin = adminUsers[0]
      console.log(`   - Email: ${admin.email}`)
      console.log(`   - Name: ${admin.name}`)
      console.log(`   - Department: ${admin.department}`)
      console.log(`   - Status: ${admin.status}`)
    } else {
      console.log(`❌ Multiple admin users found (${adminUsers.length}). Only one should exist.`)
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.name})`)
      })
    }

    // Get total user count by role
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    })

    console.log('\n📈 User distribution by role:')
    userCounts.forEach(count => {
      console.log(`   - ${count.role}: ${count._count.id} users`)
    })

    // Check dashboard data availability
    console.log('\n🔍 Checking dashboard data availability...')
    
    const totalRequests = await prisma.request.count()
    const totalItems = await prisma.item.count()
    const totalSuppliers = await prisma.supplier.count()
    
    console.log(`   - Total requests: ${totalRequests}`)
    console.log(`   - Total items: ${totalItems}`)
    console.log(`   - Total suppliers: ${totalSuppliers}`)

    console.log('\n✅ Admin verification completed!')

  } catch (error) {
    console.error('❌ Error during verification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdminStatus()
