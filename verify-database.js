const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database contents...\n')
    
    // Count all entities
    const userCount = await prisma.user.count()
    const categoryCount = await prisma.category.count()
    const supplierCount = await prisma.supplier.count()
    const itemCount = await prisma.item.count()
    const requestCount = await prisma.request.count()
    const purchaseOrderCount = await prisma.purchaseOrder.count()
    const stockMovementCount = await prisma.stockMovement.count()
    const returnCount = await prisma.return.count()
    const demandForecastCount = await prisma.demandForecast.count()
    const auditLogCount = await prisma.auditLog.count()
    
    console.log('📊 Database Summary:')
    console.log('=' .repeat(40))
    console.log(`👥 Users: ${userCount}`)
    console.log(`📂 Categories: ${categoryCount}`)
    console.log(`🏢 Suppliers: ${supplierCount}`)
    console.log(`📦 Items: ${itemCount}`)
    console.log(`📋 Requests: ${requestCount}`)
    console.log(`🛒 Purchase Orders: ${purchaseOrderCount}`)
    console.log(`📊 Stock Movements: ${stockMovementCount}`)
    console.log(`🔄 Returns: ${returnCount}`)
    console.log(`📈 Demand Forecasts: ${demandForecastCount}`)
    console.log(`📝 Audit Logs: ${auditLogCount}`)
    
    console.log('\n🎯 Demo Users:')
    console.log('=' .repeat(40))
    
    // Get demo users
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: ['admin@example.com', 'manager@example.com', 'employee@example.com']
        }
      },
      select: {
        email: true,
        name: true,
        role: true,
        department: true,
        status: true
      }
    })
    
    for (const user of demoUsers) {
      const password = user.email === 'admin@example.com' ? 'admin123' :
                      user.email === 'manager@example.com' ? 'manager123' : 'employee123'
      console.log(`✅ ${user.email} (${user.role})`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Department: ${user.department}`)
      console.log(`   Password: ${password}`)
      console.log(`   Status: ${user.status}`)
      console.log('')
    }
    
    // Get recent requests
    console.log('📋 Recent Requests (Last 5):')
    console.log('=' .repeat(40))
    
    const recentRequests = await prisma.request.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: { name: true, email: true }
        }
      }
    })
    
    for (const request of recentRequests) {
      console.log(`📄 ${request.title}`)
      console.log(`   Status: ${request.status}`)
      console.log(`   Priority: ${request.priority}`)
      console.log(`   Requester: ${request.requester.name}`)
      console.log(`   Total: $${request.totalAmount}`)
      console.log(`   Created: ${request.createdAt.toLocaleDateString()}`)
      console.log('')
    }
    
    console.log('✅ Database verification completed successfully!')
    console.log('🚀 Your database is ready for use!')
    
  } catch (error) {
    console.error('❌ Error verifying database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()