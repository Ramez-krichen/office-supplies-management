const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixPurchaseOrderStatuses() {
  try {
    console.log('🔧 Fixing purchase order statuses...')
    
    // Mapping of invalid statuses to valid ones
    const statusMapping = {
      'SENT': 'ORDERED',           // SENT -> ORDERED (order has been sent to supplier)
      'CONFIRMED': 'APPROVED',     // CONFIRMED -> APPROVED (order has been confirmed/approved)
      'PARTIALLY_RECEIVED': 'ORDERED', // PARTIALLY_RECEIVED -> ORDERED (still waiting for full delivery)
      // Keep valid statuses as they are
      'DRAFT': 'DRAFT',
      'PENDING': 'PENDING', 
      'APPROVED': 'APPROVED',
      'ORDERED': 'ORDERED',
      'RECEIVED': 'RECEIVED',
      'CANCELLED': 'CANCELLED'
    }
    
    console.log('\n📋 Status mapping:')
    Object.entries(statusMapping).forEach(([from, to]) => {
      if (from !== to) {
        console.log(`   ${from} -> ${to}`)
      }
    })
    
    // First, let's try to get a count using raw SQL to bypass Prisma validation
    console.log('\n🔍 Checking current status distribution...')
    
    try {
      const result = await prisma.$queryRaw`
        SELECT status, COUNT(*) as count 
        FROM purchase_orders 
        GROUP BY status
      `
      
      console.log('Current status distribution:')
      result.forEach(row => {
        console.log(`   ${row.status}: ${row.count}`)
      })
      
    } catch (error) {
      console.log('Could not query current statuses, proceeding with updates...')
    }
    
    // Update invalid statuses using raw SQL
    console.log('\n🔄 Updating invalid statuses...')
    
    const updates = [
      { from: 'SENT', to: 'ORDERED' },
      { from: 'CONFIRMED', to: 'APPROVED' },
      { from: 'PARTIALLY_RECEIVED', to: 'ORDERED' }
    ]
    
    for (const update of updates) {
      try {
        const result = await prisma.$executeRaw`
          UPDATE purchase_orders 
          SET status = ${update.to}
          WHERE status = ${update.from}
        `
        console.log(`✅ Updated ${result} orders from ${update.from} to ${update.to}`)
      } catch (error) {
        console.log(`⚠️  Could not update ${update.from} to ${update.to}:`, error.message)
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...')
    try {
      const finalResult = await prisma.$queryRaw`
        SELECT status, COUNT(*) as count 
        FROM purchase_orders 
        GROUP BY status
      `
      
      console.log('Final status distribution:')
      finalResult.forEach(row => {
        console.log(`   ${row.status}: ${row.count}`)
      })
      
      // Check if all statuses are now valid
      const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']
      const currentStatuses = finalResult.map(row => row.status)
      const invalidStatuses = currentStatuses.filter(status => !validStatuses.includes(status))
      
      if (invalidStatuses.length === 0) {
        console.log('\n🎉 All purchase order statuses are now valid!')
        console.log('The system dashboard API should now work correctly.')
      } else {
        console.log('\n⚠️  Still have invalid statuses:', invalidStatuses)
      }
      
    } catch (error) {
      console.log('Could not verify final status, but updates were attempted.')
    }
    
  } catch (error) {
    console.error('❌ Error fixing purchase order statuses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPurchaseOrderStatuses()
