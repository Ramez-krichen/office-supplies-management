import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fillMonthlySpending() {
  try {
    console.log('💰 Filling monthly spending data for the chart...\n')

    // Get existing data
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()

    if (items.length === 0 || suppliers.length === 0 || users.length === 0) {
      console.log('❌ Need items, suppliers, and users first.')
      return
    }

    // Define target months with spending goals
    const monthTargets = [
      { year: 2024, month: 8, name: 'September 2024', targetSpending: 150000 },
      { year: 2024, month: 9, name: 'October 2024', targetSpending: 160000 },
      { year: 2024, month: 10, name: 'November 2024', targetSpending: 170000 },
      { year: 2024, month: 11, name: 'December 2024', targetSpending: 200000 },
      { year: 2025, month: 0, name: 'January 2025', targetSpending: 140000 },
      { year: 2025, month: 1, name: 'February 2025', targetSpending: 150000 },
      { year: 2025, month: 2, name: 'March 2025', targetSpending: 160000 },
      { year: 2025, month: 3, name: 'April 2025', targetSpending: 170000 },
      { year: 2025, month: 4, name: 'May 2025', targetSpending: 180000 },
      { year: 2025, month: 5, name: 'June 2025', targetSpending: 190000 },
      { year: 2025, month: 6, name: 'July 2025', targetSpending: 210000 },
      { year: 2025, month: 7, name: 'August 2025', targetSpending: 220000 }
    ]

    for (const target of monthTargets) {
      const monthStart = new Date(target.year, target.month, 1)
      const monthEnd = new Date(target.year, target.month + 1, 0, 23, 59, 59)
      
      console.log(`\n📅 Processing ${target.name}...`)

      // Check current spending
      const currentPOs = await prisma.purchaseOrder.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        },
        _sum: { totalAmount: true },
        _count: true
      })

      const currentRequests = await prisma.request.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true },
        _count: true
      })

      const currentSpending = (currentPOs._sum.totalAmount || 0) + (currentRequests._sum.totalAmount || 0)
      console.log(`  Current: ${currentPOs._count} POs, ${currentRequests._count} requests = $${currentSpending.toFixed(2)}`)

      if (currentSpending < target.targetSpending) {
        const needed = target.targetSpending - currentSpending
        console.log(`  Need to add: $${needed.toFixed(2)}`)

        // Add purchase orders to reach 60% of needed amount
        const poTarget = needed * 0.6
        let poAdded = 0
        let poCount = 0

        while (poAdded < poTarget) {
          try {
            const randomUser = users[Math.floor(Math.random() * users.length)]
            const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
            const orderDate = new Date(
              monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime())
            )
            
            const amount = Math.min(poTarget - poAdded, 3000 + Math.random() * 5000)
            const uniqueId = Date.now() + Math.floor(Math.random() * 10000)
            
            await prisma.purchaseOrder.create({
              data: {
                orderNumber: `PO-${target.year}-${String(target.month + 1).padStart(2, '0')}-${uniqueId}`,
                supplierId: randomSupplier.id,
                status: ['SENT', 'CONFIRMED', 'RECEIVED'][Math.floor(Math.random() * 3)] as any,
                totalAmount: Math.round(amount * 100) / 100,
                orderDate,
                createdById: randomUser.id,
                createdAt: orderDate,
                updatedAt: orderDate
              }
            })
            
            poAdded += amount
            poCount++
          } catch (error: any) {
            if (error.code === 'P2002') {
              // Duplicate, try again with different ID
              continue
            }
            throw error
          }
        }

        // Add requests to reach 40% of needed amount
        const requestTarget = needed * 0.4
        let requestAdded = 0
        let requestCount = 0

        while (requestAdded < requestTarget) {
          try {
            const randomUser = users[Math.floor(Math.random() * users.length)]
            const randomDept = departments.length > 0 ? 
              departments[Math.floor(Math.random() * departments.length)] : null
            const requestDate = new Date(
              monthStart.getTime() + Math.random() * (monthEnd.getTime() - monthStart.getTime())
            )
            
            const amount = Math.min(requestTarget - requestAdded, 2000 + Math.random() * 3000)
            
            const request = await prisma.request.create({
              data: {
                title: `${target.name} Procurement Request`,
                description: `Monthly supplies and equipment`,
                priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)] as any,
                status: ['APPROVED', 'COMPLETED'][Math.floor(Math.random() * 2)] as any,
                requesterId: randomUser.id,
                department: randomDept?.name || randomUser.department || 'General',
                totalAmount: Math.round(amount * 100) / 100,
                createdAt: requestDate,
                updatedAt: requestDate
              }
            })

            // Add a few items to make it realistic
            const itemCount = Math.min(3, items.length)
            let itemTotal = 0
            const usedItems = new Set<string>()

            for (let i = 0; i < itemCount; i++) {
              let randomItem = items[Math.floor(Math.random() * items.length)]
              
              // Skip if already used
              if (usedItems.has(randomItem.id)) continue
              usedItems.add(randomItem.id)

              const quantity = Math.floor(Math.random() * 5) + 1
              const unitPrice = randomItem.price
              const total = quantity * unitPrice
              itemTotal += total

              try {
                await prisma.requestItem.create({
                  data: {
                    requestId: request.id,
                    itemId: randomItem.id,
                    quantity,
                    unitPrice,
                    totalPrice: total,
                    notes: `${target.name} procurement`
                  }
                })
              } catch (e) {
                // Skip if duplicate
              }
            }

            // Update request total if we added items
            if (itemTotal > 0) {
              await prisma.request.update({
                where: { id: request.id },
                data: { totalAmount: itemTotal }
              })
              requestAdded += itemTotal
            } else {
              requestAdded += amount
            }
            
            requestCount++
          } catch (error: any) {
            console.error('Request error:', error.message)
            break
          }
        }

        console.log(`  ✅ Added ${poCount} POs ($${poAdded.toFixed(2)}) and ${requestCount} requests ($${requestAdded.toFixed(2)})`)
      } else {
        console.log(`  ✅ Already has sufficient spending`)
      }
    }

    // Final summary
    console.log('\n📊 Final Monthly Spending Summary:')
    console.log('─'.repeat(60))
    
    for (const target of monthTargets) {
      const monthStart = new Date(target.year, target.month, 1)
      const monthEnd = new Date(target.year, target.month + 1, 0, 23, 59, 59)
      
      const monthPOs = await prisma.purchaseOrder.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        },
        _sum: { totalAmount: true }
      })

      const monthRequests = await prisma.request.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true }
      })

      const total = (monthPOs._sum.totalAmount || 0) + (monthRequests._sum.totalAmount || 0)
      const bar = '█'.repeat(Math.floor(total / 10000))
      console.log(`${target.name.padEnd(20)} ${bar} $${total.toFixed(2)}`)
    }

    console.log('─'.repeat(60))
    console.log('\n🎉 Monthly spending data has been filled!')
    console.log('   Refresh your dashboard to see the updated Monthly Spending Trend chart.')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fillMonthlySpending()