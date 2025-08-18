import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function quickGenerateMonthlyData() {
  try {
    console.log('🚀 Quick generation of monthly spending data...\n')

    // Get existing data
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()

    if (items.length === 0 || suppliers.length === 0 || users.length === 0) {
      console.log('❌ Need items, suppliers, and users first.')
      return
    }

    console.log(`Found ${users.length} users, ${departments.length} departments, ${items.length} items, ${suppliers.length} suppliers`)

    // Generate bulk data for each month
    const months = [
      { year: 2024, month: 8, name: 'Sep 2024' },
      { year: 2024, month: 9, name: 'Oct 2024' },
      { year: 2024, month: 10, name: 'Nov 2024' },
      { year: 2024, month: 11, name: 'Dec 2024' },
      { year: 2025, month: 0, name: 'Jan 2025' },
      { year: 2025, month: 1, name: 'Feb 2025' },
      { year: 2025, month: 2, name: 'Mar 2025' },
      { year: 2025, month: 3, name: 'Apr 2025' },
      { year: 2025, month: 4, name: 'May 2025' },
      { year: 2025, month: 5, name: 'Jun 2025' },
      { year: 2025, month: 6, name: 'Jul 2025' },
      { year: 2025, month: 7, name: 'Aug 2025' }
    ]

    for (const m of months) {
      const monthStart = new Date(m.year, m.month, 1)
      const monthEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59)
      
      console.log(`\n📅 ${m.name}:`)

      // Check existing POs to avoid duplicates
      const existingPOCount = await prisma.purchaseOrder.count({
        where: {
          orderNumber: {
            startsWith: `PO-${m.year}-${String(m.month + 1).padStart(2, '0')}-`
          }
        }
      })

      // Create 20-30 purchase orders per month with varying amounts
      const poCount = Math.floor(Math.random() * 11) + 20
      const purchaseOrders = []
      
      for (let i = 0; i < poCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
        const orderDate = new Date(
          monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime())
        )
        
        // Vary amounts based on month (higher in recent months)
        const baseAmount = 2000 + (m.month * 100)
        const totalAmount = baseAmount + Math.random() * 3000

        // Generate unique order number
        const orderNum = existingPOCount + i + 1 + Math.floor(Math.random() * 1000)
        
        purchaseOrders.push({
          orderNumber: `PO-${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(orderNum).padStart(4, '0')}`,
          supplierId: randomSupplier.id,
          status: ['SENT', 'CONFIRMED', 'RECEIVED'][Math.floor(Math.random() * 3)],
          totalAmount: Math.round(totalAmount * 100) / 100,
          orderDate,
          createdById: randomUser.id,
          createdAt: orderDate,
          updatedAt: orderDate
        })
      }

      // Bulk create purchase orders
      await prisma.purchaseOrder.createMany({
        data: purchaseOrders
      })

      // Create 30-50 requests per month
      const requestCount = Math.floor(Math.random() * 21) + 30
      const requests = []
      
      for (let i = 0; i < requestCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomDept = departments.length > 0 ? 
          departments[Math.floor(Math.random() * departments.length)] : null
        const requestDate = new Date(
          monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime())
        )
        
        // Calculate total based on random items
        const itemCount = Math.floor(Math.random() * 5) + 2
        let totalAmount = 0
        for (let j = 0; j < itemCount; j++) {
          const randomItem = items[Math.floor(Math.random() * items.length)]
          const quantity = Math.floor(Math.random() * 10) + 1
          totalAmount += randomItem.price * quantity
        }

        requests.push({
          title: `${m.name} Request #${i + 1}`,
          description: `Monthly procurement request`,
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
          status: ['APPROVED', 'COMPLETED'][Math.floor(Math.random() * 2)],
          requesterId: randomUser.id,
          department: randomDept?.name || randomUser.department || 'General',
          totalAmount: Math.round(totalAmount * 100) / 100,
          createdAt: requestDate,
          updatedAt: requestDate
        })
      }

      // Bulk create requests
      await prisma.request.createMany({
        data: requests
      })

      const totalSpending = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0) +
                           requests.reduce((sum, req) => sum + req.totalAmount, 0)
      
      console.log(`  ✅ Created ${poCount} POs and ${requestCount} requests`)
      console.log(`  💰 Total spending: $${totalSpending.toFixed(2)}`)
    }

    // Summary
    console.log('\n📊 Summary:')
    for (const m of months) {
      const monthStart = new Date(m.year, m.month, 1)
      const monthEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59)
      
      const monthPOs = await prisma.purchaseOrder.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        },
        _sum: { totalAmount: true },
        _count: true
      })

      const monthRequests = await prisma.request.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true },
        _count: true
      })

      const total = (monthPOs._sum.totalAmount || 0) + (monthRequests._sum.totalAmount || 0)
      console.log(`  ${m.name}: ${monthPOs._count} POs + ${monthRequests._count} requests = $${total.toFixed(2)}`)
    }

    console.log('\n🎉 Monthly data generation completed!')
    console.log('   Refresh your dashboard to see the updated Monthly Spending Trend chart.')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickGenerateMonthlyData()