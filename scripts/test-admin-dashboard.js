const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAdminDashboard() {
  try {
    console.log('🔍 Testing admin dashboard data fetching...')
    
    // Test the same queries that the admin dashboard API uses
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    console.log('\n📊 Testing basic statistics...')
    
    // System-wide statistics
    const totalRequests = await prisma.request.count()
    console.log(`✅ Total requests: ${totalRequests}`)
    
    const pendingRequests = await prisma.request.count({
      where: { status: 'PENDING' }
    })
    console.log(`✅ Pending requests: ${pendingRequests}`)
    
    const totalUsers = await prisma.user.count()
    console.log(`✅ Total users: ${totalUsers}`)
    
    const activeUsers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    })
    console.log(`✅ Active users: ${activeUsers}`)
    
    const totalItems = await prisma.item.count()
    console.log(`✅ Total items: ${totalItems}`)
    
    // Test the fixed purchase orders query
    console.log('\n🛒 Testing purchase orders query (this was the issue)...')
    const activePurchaseOrders = await prisma.purchaseOrder.count({
      where: { status: { in: ['PENDING', 'APPROVED', 'ORDERED'] } }
    })
    console.log(`✅ Active purchase orders: ${activePurchaseOrders}`)
    
    // Test financial statistics
    console.log('\n💰 Testing financial statistics...')
    const totalSpending = await prisma.request.aggregate({
      where: { status: { in: ['APPROVED', 'COMPLETED'] } },
      _sum: { totalAmount: true }
    })
    console.log(`✅ Total spending: $${totalSpending._sum.totalAmount || 0}`)
    
    const monthlySpending = await prisma.request.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth }
      },
      _sum: { totalAmount: true }
    })
    console.log(`✅ Monthly spending: $${monthlySpending._sum.totalAmount || 0}`)
    
    // Test department breakdown
    console.log('\n🏢 Testing department breakdown...')
    const departmentStats = await prisma.request.groupBy({
      by: ['department'],
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        department: { not: null }
      },
      _count: { id: true },
      _sum: { totalAmount: true }
    })
    console.log(`✅ Department stats: ${departmentStats.length} departments`)
    
    // Test recent requests
    console.log('\n📋 Testing recent requests...')
    const recentRequests = await prisma.request.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            department: true
          }
        }
      }
    })
    console.log(`✅ Recent requests: ${recentRequests.length} found`)
    
    console.log('\n🎉 All admin dashboard queries executed successfully!')
    console.log('The admin dashboard data fetching error has been fixed.')
    
  } catch (error) {
    console.error('❌ Error testing admin dashboard:', error)
    console.error('Error details:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminDashboard()
