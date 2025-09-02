import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function generateAugust2025Data() {
  try {
    console.log('🗓️ Generating comprehensive data for August 2025...\n')

    // Get existing data
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()

    console.log(`Found ${users.length} users, ${departments.length} departments, ${items.length} items, ${suppliers.length} suppliers`)

    if (items.length === 0 || suppliers.length === 0 || users.length === 0) {
      console.log('❌ Need items, suppliers, and users first.')
      return
    }

    const august2025Start = new Date(2025, 7, 1) // August 1, 2025
    const august2025End = new Date(2025, 7, 31, 23, 59, 59) // August 31, 2025

    // Check existing August 2025 data
    const existingRequests = await prisma.request.count({
      where: {
        createdAt: { gte: august2025Start, lte: august2025End }
      }
    })

    const existingPOs = await prisma.purchaseOrder.count({
      where: {
        createdAt: { gte: august2025Start, lte: august2025End }
      }
    })

    console.log(`Current August 2025 data: ${existingRequests} requests, ${existingPOs} purchase orders`)

    const statuses = ['APPROVED', 'COMPLETED'] as const
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED'] as const

    // Target high spending for August 2025 (current month)
    const targetDepartmentSpending = 15000 // $15,000 per department minimum
    const totalTargetSpending = targetDepartmentSpending * departments.length

    console.log(`\n💰 Target spending: $${totalTargetSpending.toFixed(2)} across ${departments.length} departments`)
    console.log(`📅 Generating data for August 1-31, 2025...\n`)

    // Generate substantial requests for August 2025
    console.log('📝 Generating high-value requests...')
    
    for (let requestIndex = 0; requestIndex < 120; requestIndex++) {
      const randomUser = getRandomElement(users)
      const randomDept = getRandomElement(departments)
      const status = getRandomElement(statuses)
      const priority = getRandomElement(priorities)
      
      const requestDate = randomDate(august2025Start, august2025End)

      const request = await prisma.request.create({
        data: {
          title: `August 2025 ${randomDept.name} Procurement Request #${requestIndex + 1}`,
          description: `Monthly procurement needs for ${randomDept.name} department - office supplies, equipment, and materials`,
          priority: priority,
          status: status,
          requesterId: randomUser.id,
          department: randomDept.name,
          totalAmount: 0,
          createdAt: requestDate,
          updatedAt: requestDate
        }
      })

      // Add 3-8 items per request with realistic quantities and prices
      const itemsCount = Math.floor(Math.random() * 6) + 3
      let totalAmount = 0
      const usedItemIds = new Set<string>()

      for (let j = 0; j < itemsCount; j++) {
        let randomItem = getRandomElement(items)
        let attempts = 0
        while (usedItemIds.has(randomItem.id) && attempts < 10) {
          randomItem = getRandomElement(items)
          attempts++
        }
        
        if (usedItemIds.has(randomItem.id)) continue
        usedItemIds.add(randomItem.id)

        const quantity = Math.floor(Math.random() * 15) + 1
        const unitPrice = randomAmount(randomItem.price * 0.85, randomItem.price * 1.15)
        const itemTotal = quantity * unitPrice
        totalAmount += itemTotal

        await prisma.requestItem.create({
          data: {
            requestId: request.id,
            itemId: randomItem.id,
            quantity,
            unitPrice,
            totalPrice: itemTotal,
            notes: `August 2025 procurement for ${randomDept.name}`
          }
        })
      }

      await prisma.request.update({
        where: { id: request.id },
        data: { totalAmount }
      })
    }

    // Generate substantial purchase orders for August 2025
    console.log('🛒 Generating high-value purchase orders...')
    
    for (let poIndex = 0; poIndex < 80; poIndex++) {
      const randomUser = getRandomElement(users)
      const randomSupplier = getRandomElement(suppliers)
      const status = getRandomElement(poStatuses)
      
      const orderDate = randomDate(august2025Start, august2025End)
      const totalAmount = randomAmount(2000, 12000) // High-value orders

      const orderNumber = `PO-2025-08-${String(existingPOs + poIndex + 1).padStart(4, '0')}`

      await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: randomSupplier.id,
          status: status,
          totalAmount,
          orderDate,
          createdById: randomUser.id,
          createdAt: orderDate,
          updatedAt: orderDate
        }
      })
    }

    // Ensure each department has substantial spending
    console.log('\n🏢 Ensuring balanced department spending...')
    
    for (const dept of departments) {
      console.log(`  Checking ${dept.name} department...`)
      
      // Calculate current spending for this department
      const deptRequests = await prisma.request.aggregate({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: august2025Start, lte: august2025End },
          department: dept.name
        },
        _sum: { totalAmount: true }
      })

      const requestSpending = deptRequests._sum.totalAmount || 0

      // Get users from this department
      const deptUsers = users.filter(u => u.departmentId === dept.id)
      if (deptUsers.length === 0) continue

      const deptPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdAt: { gte: august2025Start, lte: august2025End },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const poSpending = deptPOs._sum.totalAmount || 0
      const totalSpending = requestSpending + poSpending

      console.log(`    Current spending: $${totalSpending.toFixed(2)}`)
      
      if (totalSpending < targetDepartmentSpending) {
        const needed = targetDepartmentSpending - totalSpending
        console.log(`    Adding $${needed.toFixed(2)} more spending`)

        // Add additional high-value requests
        const additionalRequests = Math.ceil(needed / 3000)
        
        for (let i = 0; i < additionalRequests; i++) {
          const deptUser = getRandomElement(deptUsers)
          const requestDate = randomDate(august2025Start, august2025End)
          const targetAmount = Math.min(needed - (i * 3000), 5000)

          const request = await prisma.request.create({
            data: {
              title: `${dept.name} August High-Value Procurement ${i + 1}`,
              description: `Strategic procurement to meet departmental requirements for August 2025`,
              priority: 'HIGH',
              status: 'APPROVED',
              requesterId: deptUser.id,
              department: dept.name,
              totalAmount: 0,
              createdAt: requestDate,
              updatedAt: requestDate
            }
          })

          // Add high-value items
          let currentAmount = 0
          const highValueItems = items.filter(item => item.price > 100)
          const usedItemIds = new Set<string>()
          
          while (currentAmount < targetAmount) {
            const itemPool = highValueItems.length > 0 ? highValueItems : items
            const availableItems = itemPool.filter(item => !usedItemIds.has(item.id))
            
            if (availableItems.length === 0) break
            
            const randomItem = getRandomElement(availableItems)
            usedItemIds.add(randomItem.id)
            
            const quantity = Math.floor(Math.random() * 8) + 1
            const unitPrice = randomAmount(randomItem.price * 0.95, randomItem.price * 1.05)
            const itemTotal = quantity * unitPrice
            
            if (currentAmount + itemTotal <= targetAmount + 1000) {
              await prisma.requestItem.create({
                data: {
                  requestId: request.id,
                  itemId: randomItem.id,
                  quantity,
                  unitPrice,
                  totalPrice: itemTotal,
                  notes: `High-value procurement for ${dept.name} August targets`
                }
              })
              currentAmount += itemTotal
            } else {
              break
            }
          }

          await prisma.request.update({
            where: { id: request.id },
            data: { totalAmount: currentAmount }
          })
        }
      }
    }

    // Generate final summary statistics
    console.log('\n📊 August 2025 Data Generation Summary:')
    console.log('─'.repeat(60))
    
    const finalRequests = await prisma.request.count({
      where: {
        createdAt: { gte: august2025Start, lte: august2025End },
        status: { in: ['APPROVED', 'COMPLETED'] }
      }
    })

    const finalPOs = await prisma.purchaseOrder.count({
      where: {
        createdAt: { gte: august2025Start, lte: august2025End },
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
      }
    })

    const finalRequestTotal = await prisma.request.aggregate({
      where: {
        createdAt: { gte: august2025Start, lte: august2025End },
        status: { in: ['APPROVED', 'COMPLETED'] }
      },
      _sum: { totalAmount: true }
    })

    const finalPOTotal = await prisma.purchaseOrder.aggregate({
      where: {
        createdAt: { gte: august2025Start, lte: august2025End },
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
      },
      _sum: { totalAmount: true }
    })

    const totalSpending = (finalRequestTotal._sum.totalAmount || 0) + (finalPOTotal._sum.totalAmount || 0)

    console.log(`📝 Total Requests: ${finalRequests}`)
    console.log(`🛒 Total Purchase Orders: ${finalPOs}`)
    console.log(`💰 Total Request Spending: $${(finalRequestTotal._sum.totalAmount || 0).toFixed(2)}`)
    console.log(`💳 Total PO Spending: $${(finalPOTotal._sum.totalAmount || 0).toFixed(2)}`)
    console.log(`📊 Combined Total Spending: $${totalSpending.toFixed(2)}`)

    // Department breakdown
    console.log('\n🏢 Department Spending Breakdown:')
    for (const dept of departments) {
      const deptRequests = await prisma.request.aggregate({
        where: {
          createdAt: { gte: august2025Start, lte: august2025End },
          status: { in: ['APPROVED', 'COMPLETED'] },
          department: dept.name
        },
        _sum: { totalAmount: true }
      })

      const deptPOs = await prisma.purchaseOrder.aggregate({
        where: {
          createdAt: { gte: august2025Start, lte: august2025End },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const deptTotal = (deptRequests._sum.totalAmount || 0) + (deptPOs._sum.totalAmount || 0)
      const bar = '█'.repeat(Math.floor(deptTotal / 2000))
      console.log(`  ${dept.name.padEnd(20)} ${bar} $${deptTotal.toFixed(2)}`)
    }

    console.log('─'.repeat(60))
    console.log('\n🎉 August 2025 data generation completed successfully!')
    console.log('   The dashboard charts should now show substantial spending for August 2025.')
    console.log('   Refresh your dashboard to see the updated Monthly Spending Trend chart.')

  } catch (error) {
    console.error('❌ Error generating August 2025 data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateAugust2025Data()