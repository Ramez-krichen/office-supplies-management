const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPurchaseOrderStatuses() {
  try {
    console.log('🔍 Checking purchase order statuses in database...')
    
    const orders = await prisma.purchaseOrder.findMany({
      select: { 
        id: true,
        orderNumber: true,
        status: true 
      }
    })
    
    console.log(`\n📊 Found ${orders.length} purchase orders`)
    
    // Get unique statuses
    const statuses = [...new Set(orders.map(o => o.status))]
    console.log('\n📋 Unique statuses found:', statuses)
    
    // Count by status
    const statusCounts = {}
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })
    
    console.log('\n📈 Status counts:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
    
    // Check for invalid statuses
    const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']
    const invalidStatuses = statuses.filter(status => !validStatuses.includes(status))
    
    if (invalidStatuses.length > 0) {
      console.log('\n⚠️  INVALID STATUSES FOUND:', invalidStatuses)
      console.log('These need to be updated to valid enum values.')
      
      // Show some examples
      console.log('\n📝 Examples of orders with invalid statuses:')
      for (const invalidStatus of invalidStatuses) {
        const examples = orders.filter(o => o.status === invalidStatus).slice(0, 3)
        console.log(`   ${invalidStatus}:`)
        examples.forEach(order => {
          console.log(`     - ${order.orderNumber} (${order.id})`)
        })
      }
    } else {
      console.log('\n✅ All purchase order statuses are valid!')
    }
    
  } catch (error) {
    console.error('❌ Error checking purchase order statuses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPurchaseOrderStatuses()
