// Generate detailed monthly data for 2025
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generate2025Data() {
  console.log('📅 Generating detailed monthly data for 2025...')

  try {
    // Get existing data to work with
    const users = await prisma.user.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()
    const categories = await prisma.category.findMany()

    if (users.length === 0 || items.length === 0 || suppliers.length === 0) {
      console.log('❌ No base data found. Please run the comprehensive seed first.')
      return
    }

    console.log(`📊 Working with ${users.length} users, ${items.length} items, ${suppliers.length} suppliers`)

    // Generate data for each month of 2025
    const months = [
      { month: 0, name: 'January', days: 31 },
      { month: 1, name: 'February', days: 28 },
      { month: 2, name: 'March', days: 31 },
      { month: 3, name: 'April', days: 30 },
      { month: 4, name: 'May', days: 31 },
      { month: 5, name: 'June', days: 30 },
      { month: 6, name: 'July', days: 31 },
      { month: 7, name: 'August', days: 31 }
    ]

    let totalRequests = 0
    let totalOrders = 0
    let totalMovements = 0

    for (const monthInfo of months) {
      console.log(`\n📅 Generating data for ${monthInfo.name} 2025...`)
      
      const startDate = new Date(2025, monthInfo.month, 1)
      const endDate = new Date(2025, monthInfo.month, monthInfo.days, 23, 59, 59)

      // Generate 15-25 requests per month
      const requestCount = Math.floor(Math.random() * 11) + 15
      console.log(`   📋 Creating ${requestCount} requests...`)

      for (let i = 0; i < requestCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomDay = Math.floor(Math.random() * monthInfo.days) + 1
        const requestDate = new Date(2025, monthInfo.month, randomDay, 
          Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

        // Create request
        const request = await prisma.request.create({
          data: {
            title: `Monthly Supply Request ${monthInfo.name} #${i + 1}`,
            description: `Regular monthly supply request for ${randomUser.department} department`,
            status: Math.random() > 0.2 ? 'APPROVED' : Math.random() > 0.5 ? 'PENDING' : 'REJECTED',
            priority: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.5 ? 'MEDIUM' : 'LOW',
            department: randomUser.department,
            requesterId: randomUser.id,
            createdAt: requestDate,
            updatedAt: requestDate
          }
        })

        // Add 1-5 items to each request (ensure unique items per request)
        const itemCount = Math.floor(Math.random() * 5) + 1
        const usedItems = new Set<string>()

        for (let j = 0; j < itemCount; j++) {
          let randomItem
          let attempts = 0

          // Find an item that hasn't been used in this request
          do {
            randomItem = items[Math.floor(Math.random() * items.length)]
            attempts++
          } while (usedItems.has(randomItem.id) && attempts < 10)

          // If we couldn't find a unique item after 10 attempts, skip
          if (usedItems.has(randomItem.id)) continue

          usedItems.add(randomItem.id)
          const quantity = Math.floor(Math.random() * 20) + 1

          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: randomItem.id,
              quantity: quantity,
              unitPrice: randomItem.price,
              totalPrice: quantity * randomItem.price
            }
          })
        }

        totalRequests++
      }

      // Generate 8-15 purchase orders per month
      const orderCount = Math.floor(Math.random() * 8) + 8
      console.log(`   🛒 Creating ${orderCount} purchase orders...`)

      for (let i = 0; i < orderCount; i++) {
        const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
        const randomDay = Math.floor(Math.random() * monthInfo.days) + 1
        const orderDate = new Date(2025, monthInfo.month, randomDay,
          Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

        const orderNumber = `PO-2025${String(monthInfo.month + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}-${Date.now()}`

        const randomCreator = users[Math.floor(Math.random() * users.length)]

        const order = await prisma.purchaseOrder.create({
          data: {
            orderNumber: orderNumber,
            supplierId: randomSupplier.id,
            status: Math.random() > 0.3 ? 'SENT' : Math.random() > 0.5 ? 'RECEIVED' : 'DRAFT',
            totalAmount: 0, // Will be calculated after adding items
            createdById: randomCreator.id,
            createdAt: orderDate,
            updatedAt: orderDate
          }
        })

        // Add 2-8 items to each order (ensure unique items per order)
        const orderItemCount = Math.floor(Math.random() * 7) + 2
        let orderTotal = 0
        const usedOrderItems = new Set<string>()

        for (let j = 0; j < orderItemCount; j++) {
          let randomItem
          let attempts = 0

          // Find an item that hasn't been used in this order
          do {
            randomItem = items[Math.floor(Math.random() * items.length)]
            attempts++
          } while (usedOrderItems.has(randomItem.id) && attempts < 10)

          // If we couldn't find a unique item after 10 attempts, skip
          if (usedOrderItems.has(randomItem.id)) continue

          usedOrderItems.add(randomItem.id)
          const quantity = Math.floor(Math.random() * 50) + 10
          const unitPrice = randomItem.price * (0.8 + Math.random() * 0.4) // Supplier pricing variation

          const itemTotal = quantity * unitPrice
          orderTotal += itemTotal

          await prisma.orderItem.create({
            data: {
              purchaseOrderId: order.id,
              itemId: randomItem.id,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: itemTotal
            }
          })
        }

        // Update order total
        await prisma.purchaseOrder.update({
          where: { id: order.id },
          data: { totalAmount: orderTotal }
        })

        totalOrders++
      }

      // Generate stock movements (20-40 per month)
      const movementCount = Math.floor(Math.random() * 21) + 20
      console.log(`   📊 Creating ${movementCount} stock movements...`)

      for (let i = 0; i < movementCount; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const randomDay = Math.floor(Math.random() * monthInfo.days) + 1
        const movementDate = new Date(2025, monthInfo.month, randomDay,
          Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

        const movementType = Math.random() > 0.6 ? 'IN' : 'OUT'
        const quantity = Math.floor(Math.random() * 30) + 1

        const randomMovementUser = users[Math.floor(Math.random() * users.length)]

        await prisma.stockMovement.create({
          data: {
            itemId: randomItem.id,
            type: movementType,
            quantity: quantity,
            reason: movementType === 'IN' ? 'PURCHASE' : Math.random() > 0.5 ? 'CONSUMPTION' : 'ADJUSTMENT',
            userId: randomMovementUser.id,
            reference: `${monthInfo.name}-${movementType}-${i + 1}`,
            createdAt: movementDate
          }
        })

        totalMovements++
      }

      // Generate some returns (2-5 per month)
      const returnCount = Math.floor(Math.random() * 4) + 2
      console.log(`   ↩️ Creating ${returnCount} returns...`)

      for (let i = 0; i < returnCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const randomDay = Math.floor(Math.random() * monthInfo.days) + 1
        const returnDate = new Date(2025, monthInfo.month, randomDay,
          Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

        const returnNumber = `RET-2025${String(monthInfo.month + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}-${Date.now()}`
        const quantity = Math.floor(Math.random() * 5) + 1

        await prisma.return.create({
          data: {
            returnNumber: returnNumber,
            itemId: randomItem.id,
            requesterId: randomUser.id,
            quantity: quantity,
            reason: Math.random() > 0.5 ? 'DEFECTIVE' : Math.random() > 0.5 ? 'EXCESS' : 'WRONG_ITEM',
            condition: Math.random() > 0.5 ? 'DAMAGED' : 'GOOD',
            status: Math.random() > 0.3 ? 'APPROVED' : 'PENDING',
            description: `Return processed in ${monthInfo.name} 2025`,
            createdAt: returnDate,
            updatedAt: returnDate
          }
        })
      }

      console.log(`   ✅ ${monthInfo.name} 2025 data generated successfully`)
    }

    console.log('\n🎉 2025 monthly data generation completed!')
    console.log(`📊 Summary:`)
    console.log(`   📋 Total Requests: ${totalRequests}`)
    console.log(`   🛒 Total Purchase Orders: ${totalOrders}`)
    console.log(`   📊 Total Stock Movements: ${totalMovements}`)
    console.log(`   ↩️ Total Returns: ${months.length * 3} (average)`)

  } catch (error) {
    console.error('❌ Error generating 2025 data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
generate2025Data()
