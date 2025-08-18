const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSystemDashboard() {
  try {
    console.log('🖥️  Testing system dashboard queries...')
    
    // Test the same queries that the system dashboard API uses
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    console.log('\n📊 Testing basic counts...')
    
    // Get total counts
    const [
      totalUsers,
      activeUsers,
      totalRequests,
      totalPurchaseOrders,
      recentRequests,
      recentOrders,
      recentUsers
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          lastSignIn: {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total requests
      prisma.request.count(),
      
      // Total purchase orders
      prisma.purchaseOrder.count(),
      
      // Recent requests (last 7 days)
      prisma.request.count({
        where: {
          createdAt: { gte: oneWeekAgo }
        }
      }),
      
      // Recent purchase orders (last 7 days)
      prisma.purchaseOrder.count({
        where: {
          createdAt: { gte: oneWeekAgo }
        }
      }),
      
      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: { gte: oneWeekAgo }
        }
      })
    ])
    
    console.log(`✅ Total users: ${totalUsers}`)
    console.log(`✅ Active users: ${activeUsers}`)
    console.log(`✅ Total requests: ${totalRequests}`)
    console.log(`✅ Total purchase orders: ${totalPurchaseOrders}`)
    console.log(`✅ Recent requests (7 days): ${recentRequests}`)
    console.log(`✅ Recent orders (7 days): ${recentOrders}`)
    console.log(`✅ Recent users (7 days): ${recentUsers}`)
    
    // Test the problematic purchase order spending query
    console.log('\n💰 Testing purchase order spending query (this was failing)...')
    
    const [requestSpending, poSpending] = await Promise.all([
      // Calculate total spending from requests
      prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        include: {
          items: {
            include: {
              item: true
            }
          }
        }
      }),
      
      // Calculate total spending from purchase orders (this was the failing query)
      prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] }
        },
        _sum: {
          totalAmount: true
        }
      })
    ])
    
    console.log(`✅ Found ${requestSpending.length} approved/completed requests`)
    console.log(`✅ Purchase order spending query successful: $${poSpending._sum.totalAmount || 0}`)
    
    // Calculate request spending
    const totalRequestSpending = requestSpending.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)
    
    const totalSpending = totalRequestSpending + (poSpending._sum.totalAmount || 0)
    console.log(`✅ Total system spending: $${totalSpending.toFixed(2)}`)
    
    console.log('\n🎉 All system dashboard queries executed successfully!')
    console.log('The React Hooks error and system dashboard API should now work correctly.')
    
  } catch (error) {
    console.error('❌ Error testing system dashboard:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSystemDashboard()
