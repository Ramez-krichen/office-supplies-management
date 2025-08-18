import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function generateLast12MonthsData() {
  try {
    console.log('📊 Generating spending data for the last 12 months...\n')

    // Get existing data
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()

    console.log(`Found ${users.length} users, ${departments.length} departments, ${items.length} items, ${suppliers.length} suppliers`)

    if (items.length === 0 || suppliers.length === 0 || users.length === 0) {
      console.log('❌ Need items, suppliers, and users first. Please run the seed scripts.')
      return
    }

    const statuses = ['APPROVED', 'COMPLETED']
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED']

    // Define the months to generate data for
    const months = [
      { year: 2024, month: 8, name: 'September 2024', requestsMin: 40, requestsMax: 60, posMin: 25, posMax: 35, amountMin: 1500, amountMax: 4000 },
      { year: 2024, month: 9, name: 'October 2024', requestsMin: 45, requestsMax: 65, posMin: 28, posMax: 38, amountMin: 1600, amountMax: 4200 },
      { year: 2024, month: 10, name: 'November 2024', requestsMin: 50, requestsMax: 70, posMin: 30, posMax: 40, amountMin: 1700, amountMax: 4500 },
      { year: 2024, month: 11, name: 'December 2024', requestsMin: 60, requestsMax: 80, posMin: 35, posMax: 45, amountMin: 2000, amountMax: 5000 },
      { year: 2025, month: 0, name: 'January 2025', requestsMin: 35, requestsMax: 55, posMin: 20, posMax: 30, amountMin: 1400, amountMax: 3800 },
      { year: 2025, month: 1, name: 'February 2025', requestsMin: 40, requestsMax: 60, posMin: 25, posMax: 35, amountMin: 1500, amountMax: 4000 },
      { year: 2025, month: 2, name: 'March 2025', requestsMin: 45, requestsMax: 65, posMin: 28, posMax: 38, amountMin: 1600, amountMax: 4200 },
      { year: 2025, month: 3, name: 'April 2025', requestsMin: 50, requestsMax: 70, posMin: 30, posMax: 40, amountMin: 1700, amountMax: 4500 },
      { year: 2025, month: 4, name: 'May 2025', requestsMin: 55, requestsMax: 75, posMin: 32, posMax: 42, amountMin: 1800, amountMax: 4700 },
      { year: 2025, month: 5, name: 'June 2025', requestsMin: 60, requestsMax: 80, posMin: 35, posMax: 45, amountMin: 2000, amountMax: 5000 },
      { year: 2025, month: 6, name: 'July 2025', requestsMin: 65, requestsMax: 85, posMin: 38, posMax: 48, amountMin: 2200, amountMax: 5500 },
      { year: 2025, month: 7, name: 'August 2025', requestsMin: 70, requestsMax: 90, posMin: 40, posMax: 50, amountMin: 2500, amountMax: 6000 }
    ]

    for (const monthData of months) {
      const monthStart = new Date(monthData.year, monthData.month, 1)
      const monthEnd = new Date(monthData.year, monthData.month + 1, 0, 23, 59, 59) // Last day of month
      
      console.log(`\n📅 Generating data for ${monthData.name}...`)

      // Check existing data for this month
      const existingRequests = await prisma.request.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      const existingPOs = await prisma.purchaseOrder.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      })

      console.log(`  Existing: ${existingRequests} requests, ${existingPOs} purchase orders`)

      // Generate requests for this month
      const requestsToGenerate = Math.floor(Math.random() * (monthData.requestsMax - monthData.requestsMin + 1)) + monthData.requestsMin
      
      for (let i = 0; i < requestsToGenerate; i++) {
        const randomUser = getRandomElement(users)
        const randomDept = departments.length > 0 ? getRandomElement(departments) : null
        const status = getRandomElement(statuses)
        const priority = getRandomElement(priorities)
        
        const requestDate = randomDate(monthStart, monthEnd)

        const request = await prisma.request.create({
          data: {
            title: `${monthData.name} Request #${i + 1}`,
            description: `Procurement request for ${monthData.name} - ${randomDept?.name || randomUser.department || 'General'}`,
            priority: priority as any,
            status: status as any,
            requesterId: randomUser.id,
            department: randomDept?.name || randomUser.department || 'General',
            totalAmount: 0,
            createdAt: requestDate,
            updatedAt: requestDate
          }
        })

        // Add items to request
        const itemsCount = Math.floor(Math.random() * 6) + 2 // 2-7 items
        let totalAmount = 0
        const usedItemIds = new Set<string>()

        for (let j = 0; j < itemsCount; j++) {
          // Get a random item that hasn't been used in this request
          let randomItem = getRandomElement(items)
          let attempts = 0
          while (usedItemIds.has(randomItem.id) && attempts < 10) {
            randomItem = getRandomElement(items)
            attempts++
          }
          
          // Skip if we couldn't find a unique item
          if (usedItemIds.has(randomItem.id)) continue
          
          usedItemIds.add(randomItem.id)
          const quantity = Math.floor(Math.random() * 10) + 1
          const unitPrice = randomAmount(randomItem.price * 0.9, randomItem.price * 1.1)
          const itemTotal = quantity * unitPrice
          totalAmount += itemTotal

          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: randomItem.id,
              quantity,
              unitPrice,
              totalPrice: itemTotal,
              notes: `${monthData.name} procurement`
            }
          })
        }

        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount }
        })
      }

      // Generate purchase orders for this month
      const posToGenerate = Math.floor(Math.random() * (monthData.posMax - monthData.posMin + 1)) + monthData.posMin
      
      for (let i = 0; i < posToGenerate; i++) {
        const randomUser = getRandomElement(users)
        const randomSupplier = getRandomElement(suppliers)
        const status = getRandomElement(poStatuses)
        
        const orderDate = randomDate(monthStart, monthEnd)
        const totalAmount = randomAmount(monthData.amountMin, monthData.amountMax)

        const orderNumber = `PO-${monthData.year}-${String(monthData.month + 1).padStart(2, '0')}-${String(existingPOs + i + 1).padStart(3, '0')}`

        await prisma.purchaseOrder.create({
          data: {
            orderNumber,
            supplierId: randomSupplier.id,
            status: status as any,
            totalAmount,
            orderDate,
            createdById: randomUser.id,
            createdAt: orderDate,
            updatedAt: orderDate
          }
        })
      }

      console.log(`  ✅ Generated ${requestsToGenerate} requests and ${posToGenerate} purchase orders`)
    }

    // Now ensure each department has substantial spending across all months
    console.log('\n💰 Ensuring balanced department spending across all months...')

    for (const dept of departments) {
      console.log(`\n  Checking ${dept.name} department...`)
      
      for (const monthData of months) {
        const monthStart = new Date(monthData.year, monthData.month, 1)
        const monthEnd = new Date(monthData.year, monthData.month + 1, 0, 23, 59, 59)

        // Calculate current spending for this department in this month
        const deptRequests = await prisma.request.aggregate({
          where: {
            status: { in: ['APPROVED', 'COMPLETED'] },
            createdAt: { gte: monthStart, lte: monthEnd },
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
            createdAt: { gte: monthStart, lte: monthEnd },
            createdBy: { departmentId: dept.id }
          },
          _sum: { totalAmount: true }
        })

        const poSpending = deptPOs._sum.totalAmount || 0
        const totalSpending = requestSpending + poSpending

        const targetSpending = 5000 // Target at least $5,000 per department per month
        
        if (totalSpending < targetSpending) {
          const needed = targetSpending - totalSpending
          console.log(`    ${monthData.name}: Current $${totalSpending.toFixed(2)}, adding $${needed.toFixed(2)}`)

          // Add additional high-value requests
          const additionalRequests = Math.ceil(needed / 1500)
          
          for (let i = 0; i < additionalRequests; i++) {
            const deptUser = getRandomElement(deptUsers)
            const requestDate = randomDate(monthStart, monthEnd)
            const targetAmount = Math.min(needed - (i * 1500), 2000)

            const request = await prisma.request.create({
              data: {
                title: `${dept.name} ${monthData.name} Additional Procurement ${i + 1}`,
                description: `Additional procurement to ensure adequate department supplies`,
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
            const highValueItems = items.filter(item => item.price > 50)
            const usedItemIds = new Set<string>()
            
            while (currentAmount < targetAmount) {
              const itemPool = highValueItems.length > 0 ? highValueItems : items
              const availableItems = itemPool.filter(item => !usedItemIds.has(item.id))
              
              if (availableItems.length === 0) break
              
              const randomItem = getRandomElement(availableItems)
              usedItemIds.add(randomItem.id)
              
              const quantity = Math.floor(Math.random() * 5) + 1
              const unitPrice = randomAmount(randomItem.price * 0.95, randomItem.price * 1.05)
              const itemTotal = quantity * unitPrice
              
              if (currentAmount + itemTotal <= targetAmount + 500) {
                await prisma.requestItem.create({
                  data: {
                    requestId: request.id,
                    itemId: randomItem.id,
                    quantity,
                    unitPrice,
                    totalPrice: itemTotal,
                    notes: `Department procurement for ${monthData.name}`
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
    }

    // Generate summary statistics
    console.log('\n📊 Data Generation Summary:')
    
    for (const monthData of months) {
      const monthStart = new Date(monthData.year, monthData.month, 1)
      const monthEnd = new Date(monthData.year, monthData.month + 1, 0, 23, 59, 59)
      
      const monthRequests = await prisma.request.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        }
      })

      const monthPOs = await prisma.purchaseOrder.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        }
      })

      const monthRequestTotal = await prisma.request.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        _sum: { totalAmount: true }
      })

      const monthPOTotal = await prisma.purchaseOrder.aggregate({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        },
        _sum: { totalAmount: true }
      })

      const totalSpending = (monthRequestTotal._sum.totalAmount || 0) + (monthPOTotal._sum.totalAmount || 0)

      console.log(`  ${monthData.name}: ${monthRequests} requests, ${monthPOs} POs, Total: $${totalSpending.toFixed(2)}`)
    }

    console.log('\n🎉 Successfully generated spending data for the last 12 months!')
    console.log('   The Monthly Spending Trend chart should now show realistic data for all months.')

  } catch (error) {
    console.error('❌ Error generating data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateLast12MonthsData()