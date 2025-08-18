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

async function generate2025Data() {
  try {
    console.log('🗓️ Generating data for past months of 2025 and current month...\n')

    // Get existing data
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()

    console.log(`Found ${users.length} users, ${departments.length} departments, ${items.length} items, ${suppliers.length} suppliers`)

    if (items.length === 0 || suppliers.length === 0) {
      console.log('❌ Need items and suppliers first. Please run the big data generation script.')
      return
    }

    // Define 2025 date ranges
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-based (December = 11)
    
    // Generate data for each month of 2025 up to current month
    console.log(`📅 Generating data for months January to ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}...\n`)

    const statuses = ['APPROVED', 'COMPLETED']
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED']

    // Generate data for each month from January to current month
    for (let month = 0; month <= currentMonth; month++) {
      const monthStart = new Date(currentYear, month, 1)
      const monthEnd = new Date(currentYear, month + 1, 0) // Last day of month
      const monthName = monthStart.toLocaleString('default', { month: 'long' })
      
      console.log(`📊 Generating data for ${monthName} ${currentYear}...`)

      // For current month, ensure each department spends at least $3,000
      const isCurrentMonth = month === currentMonth
      const minDepartmentSpending = isCurrentMonth ? 3000 : 1000

      // Generate requests for this month
      const requestsThisMonth = isCurrentMonth ? 80 : Math.floor(Math.random() * 40) + 30 // More requests in current month
      
      for (let i = 0; i < requestsThisMonth; i++) {
        const randomUser = getRandomElement(users)
        const randomDept = getRandomElement(departments)
        const status = getRandomElement(statuses)
        const priority = getRandomElement(priorities)
        
        const requestDate = randomDate(monthStart, monthEnd)

        const request = await prisma.request.create({
          data: {
            title: `${randomDept.name} ${monthName} Request ${i + 1}`,
            description: `${monthName} procurement for ${randomDept.name} department`,
            priority: priority as any,
            status: status as any,
            requesterId: randomUser.id,
            department: randomDept.name,
            totalAmount: 0,
            createdAt: requestDate,
            updatedAt: requestDate
          }
        })

        // Add items to request
        const itemsCount = Math.floor(Math.random() * 5) + 2 // 2-6 items
        let totalAmount = 0

        for (let j = 0; j < itemsCount; j++) {
          const randomItem = getRandomElement(items)
          const quantity = Math.floor(Math.random() * 8) + 1
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
              notes: `${monthName} procurement - ${randomDept.name}`
            }
          })
        }

        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount }
        })
      }

      // Generate purchase orders for this month
      const posThisMonth = isCurrentMonth ? 40 : Math.floor(Math.random() * 20) + 10
      
      for (let i = 0; i < posThisMonth; i++) {
        const randomUser = getRandomElement(users)
        const randomSupplier = getRandomElement(suppliers)
        const status = getRandomElement(poStatuses)
        
        const orderDate = randomDate(monthStart, monthEnd)
        const totalAmount = isCurrentMonth ? 
          randomAmount(1500, 8000) : // Higher amounts for current month
          randomAmount(800, 5000)

        await prisma.purchaseOrder.create({
          data: {
            orderNumber: `PO-${currentYear}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
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

      console.log(`  ✅ Generated ${requestsThisMonth} requests and ${posThisMonth} POs for ${monthName}`)
    }

    // Now ensure each department has at least $3,000 spending in current month
    console.log(`\n💰 Ensuring each department spends at least $3,000 in current month...`)

    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0)

    for (const dept of departments) {
      // Calculate current spending for this department
      const deptRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          requester: { departmentId: dept.id }
        },
        include: {
          items: { include: { item: true } }
        }
      })

      const requestSpending = deptRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0)

      const deptPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const poSpending = deptPOs._sum.totalAmount || 0
      const totalSpending = requestSpending + poSpending

      console.log(`  ${dept.name}: Current spending $${totalSpending.toFixed(2)}`)

      // If spending is less than $3,000, add more
      if (totalSpending < 3000) {
        const needed = 3000 - totalSpending
        console.log(`    Need to add $${needed.toFixed(2)} more spending`)

        // Add high-value requests to reach the minimum
        const requestsToAdd = Math.ceil(needed / 1000) // Add requests worth ~$1000 each
        
        for (let i = 0; i < requestsToAdd; i++) {
          // Get a user from this department
          const deptUser = users.find(u => u.departmentId === dept.id) || getRandomElement(users)
          const requestDate = randomDate(currentMonthStart, currentMonthEnd)

          const request = await prisma.request.create({
            data: {
              title: `${dept.name} Additional December Procurement ${i + 1}`,
              description: `High-value procurement to meet department spending targets`,
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
          const targetAmount = Math.min(needed - (i * 1000), 1500)
          let currentAmount = 0
          
          while (currentAmount < targetAmount && currentAmount < needed) {
            const randomItem = getRandomElement(items.filter(item => item.price > 100)) // High-value items
            const quantity = Math.floor(Math.random() * 3) + 1
            const unitPrice = randomAmount(randomItem.price * 0.95, randomItem.price * 1.05)
            const itemTotal = quantity * unitPrice
            
            if (currentAmount + itemTotal <= targetAmount + 200) { // Allow slight overage
              await prisma.requestItem.create({
                data: {
                  requestId: request.id,
                  itemId: randomItem.id,
                  quantity,
                  unitPrice,
                  totalPrice: itemTotal,
                  notes: `High-value procurement for ${dept.name} December targets`
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

        console.log(`    ✅ Added additional spending for ${dept.name}`)
      } else {
        console.log(`    ✅ ${dept.name} already meets minimum spending requirement`)
      }
    }

    console.log('\n📊 2025 Data Generation Summary:')
    console.log(`  ✅ Generated data for all months of ${currentYear} up to current month`)
    console.log('  ✅ Ensured every department spends at least $3,000 in current month')
    console.log('  ✅ Created realistic monthly spending patterns')
    console.log('  ✅ Generated substantial data for forecasting and reporting')

    console.log('\n🎉 2025 data generation completed successfully!')

  } catch (error) {
    console.error('❌ Error generating 2025 data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generate2025Data()
