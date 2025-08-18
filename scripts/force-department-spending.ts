import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

async function forceDepartmentSpending() {
  try {
    console.log('💰 Forcing each department to spend at least $3,000 in current month...\n')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Get all departments and users
    const departments = await prisma.department.findMany()
    const users = await prisma.user.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()

    console.log(`Found ${departments.length} departments, ${users.length} users, ${items.length} items`)

    if (items.length === 0) {
      console.log('❌ No items found. Creating some basic items first...')
      
      // Create basic supplier if needed
      let supplier = await prisma.supplier.findFirst()
      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            name: 'Enterprise Supplies Inc',
            email: 'orders@enterprisesupplies.com',
            status: 'ACTIVE'
          }
        })
      }

      // Create basic category if needed
      let category = await prisma.category.findFirst()
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: 'Office Equipment',
            description: 'Office equipment and supplies'
          }
        })
      }

      // Create high-value items
      const itemsToCreate = [
        { reference: 'LAPTOP001', name: 'Business Laptop Dell', price: 1299.99, unit: 'each' },
        { reference: 'MONITOR001', name: '27" 4K Monitor', price: 599.99, unit: 'each' },
        { reference: 'CHAIR001', name: 'Executive Office Chair', price: 899.99, unit: 'each' },
        { reference: 'DESK001', name: 'Standing Desk Premium', price: 799.99, unit: 'each' },
        { reference: 'PRINTER001', name: 'Laser Printer Enterprise', price: 499.99, unit: 'each' },
        { reference: 'SOFTWARE001', name: 'Office Suite License', price: 299.99, unit: 'license' },
        { reference: 'TABLET001', name: 'Business Tablet', price: 399.99, unit: 'each' },
        { reference: 'PHONE001', name: 'Business Phone System', price: 199.99, unit: 'each' }
      ]

      for (const itemData of itemsToCreate) {
        const existing = await prisma.item.findFirst({ where: { reference: itemData.reference } })
        if (!existing) {
          await prisma.item.create({
            data: {
              ...itemData,
              currentStock: 100,
              minStock: 10,
              categoryId: category.id,
              supplierId: supplier.id
            }
          })
          console.log(`  ✅ Created item: ${itemData.name}`)
        }
      }

      // Refresh items list
      const updatedItems = await prisma.item.findMany()
      console.log(`Now have ${updatedItems.length} items available`)
    }

    // Get fresh items list
    const availableItems = await prisma.item.findMany()

    for (const dept of departments) {
      console.log(`\n🏢 Processing ${dept.name}...`)

      // Check current spending
      const currentRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          requester: { departmentId: dept.id }
        },
        include: { items: true }
      })

      const currentRequestSpending = currentRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, item) => itemTotal + item.totalPrice, 0)
      }, 0)

      const currentPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const currentPOSpending = currentPOs._sum.totalAmount || 0
      const totalCurrentSpending = currentRequestSpending + currentPOSpending

      console.log(`  Current spending: $${totalCurrentSpending.toFixed(2)}`)

      if (totalCurrentSpending < 3000) {
        const needed = 3000 - totalCurrentSpending
        console.log(`  Need to add: $${needed.toFixed(2)}`)

        // Get users from this department
        const deptUsers = users.filter(u => u.departmentId === dept.id)
        const userToUse = deptUsers.length > 0 ? deptUsers[0] : users[0]

        // Create high-value requests to reach $3,000
        let addedSpending = 0
        let requestCount = 0

        while (addedSpending < needed && requestCount < 10) {
          requestCount++
          const requestDate = randomDate(currentMonth, now)

          const request = await prisma.request.create({
            data: {
              title: `${dept.name} Essential Equipment Request ${requestCount}`,
              description: `High-priority equipment procurement for ${dept.name} department operations`,
              priority: 'HIGH',
              status: 'APPROVED',
              requesterId: userToUse.id,
              department: dept.name,
              totalAmount: 0,
              createdAt: requestDate,
              updatedAt: requestDate
            }
          })

          // Add high-value items to this request
          let requestTotal = 0
          const targetForThisRequest = Math.min(needed - addedSpending, randomAmount(800, 1500))

          while (requestTotal < targetForThisRequest && requestTotal < needed - addedSpending) {
            const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)]
            const quantity = Math.floor(Math.random() * 3) + 1
            const unitPrice = randomAmount(randomItem.price * 0.95, randomItem.price * 1.05)
            const itemTotal = quantity * unitPrice

            if (requestTotal + itemTotal <= targetForThisRequest + 100) { // Allow slight overage
              await prisma.requestItem.create({
                data: {
                  requestId: request.id,
                  itemId: randomItem.id,
                  quantity,
                  unitPrice,
                  totalPrice: itemTotal,
                  notes: `Essential equipment for ${dept.name} operations`
                }
              })
              requestTotal += itemTotal
            } else {
              break
            }
          }

          // Update request total
          await prisma.request.update({
            where: { id: request.id },
            data: { totalAmount: requestTotal }
          })

          addedSpending += requestTotal
          console.log(`    ✅ Added request ${requestCount}: $${requestTotal.toFixed(2)} (Total added: $${addedSpending.toFixed(2)})`)

          if (addedSpending >= needed) break
        }

        // Add some purchase orders if still needed
        if (addedSpending < needed && suppliers.length > 0) {
          const remainingNeeded = needed - addedSpending
          const posToCreate = Math.ceil(remainingNeeded / 1000)

          for (let i = 0; i < posToCreate && addedSpending < needed; i++) {
            const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
            const poAmount = Math.min(remainingNeeded - (addedSpending - totalCurrentSpending), randomAmount(800, 2000))
            const orderDate = randomDate(currentMonth, now)

            await prisma.purchaseOrder.create({
              data: {
                orderNumber: `PO-${dept.code}-${now.getFullYear()}-${String(i + 1).padStart(3, '0')}`,
                supplierId: randomSupplier.id,
                status: 'APPROVED',
                totalAmount: poAmount,
                orderDate,
                createdById: userToUse.id,
                createdAt: orderDate,
                updatedAt: orderDate
              }
            })

            addedSpending += poAmount
            console.log(`    ✅ Added PO ${i + 1}: $${poAmount.toFixed(2)}`)
          }
        }

        console.log(`  ✅ ${dept.name} total added spending: $${addedSpending.toFixed(2)}`)
      } else {
        console.log(`  ✅ ${dept.name} already meets target`)
      }
    }

    console.log('\n🎉 Department spending enforcement completed!')
    console.log('All departments should now have at least $3,000 in monthly spending.')

  } catch (error) {
    console.error('❌ Error forcing department spending:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forceDepartmentSpending()
