import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function addMissingData() {
  try {
    console.log('🔧 Adding missing requests and purchase orders...\n')

    // Get existing data
    const users = await prisma.user.findMany()
    const items = await prisma.item.findMany()
    const suppliers = await prisma.supplier.findMany()

    if (users.length === 0 || items.length === 0 || suppliers.length === 0) {
      console.log('❌ Missing required data (users, items, or suppliers)')
      return
    }

    console.log(`Found ${users.length} users, ${items.length} items, ${suppliers.length} suppliers`)

    // Check if requests already exist
    const existingRequests = await prisma.request.count()
    const existingOrders = await prisma.purchaseOrder.count()

    console.log(`Current requests: ${existingRequests}, orders: ${existingOrders}`)

    if (existingRequests < 15) {
      console.log('📋 Creating sample requests...')
      
      // Create remaining requests to reach 15 total
      const requestsToCreate = 15 - existingRequests
      for (let i = 0; i < requestsToCreate; i++) {
        const requester = randomChoice(users)
        const numItems = Math.floor(Math.random() * 3) + 1 // 1-3 items per request
        const selectedItems = []
        const usedItemIds = new Set()

        for (let j = 0; j < numItems; j++) {
          let item
          let attempts = 0
          do {
            item = randomChoice(items)
            attempts++
          } while (usedItemIds.has(item.id) && attempts < 10)

          if (!usedItemIds.has(item.id)) {
            usedItemIds.add(item.id)
            const quantity = Math.floor(Math.random() * 10) + 1
            selectedItems.push({
              item,
              quantity,
              unitPrice: item.price,
              totalPrice: item.price * quantity
            })
          }
        }

        const totalAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
        const status = randomChoice(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'])
        
        const request = await prisma.request.create({
          data: {
            title: `Office Supplies Request ${existingRequests + i + 1}`,
            description: `Request for office supplies - ${selectedItems.map(item => item.item.name).join(', ')}`,
            requesterId: requester.id,
            status,
            priority: randomChoice(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
            totalAmount,
            department: requester.department,
            createdAt: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
          }
        })

        // Create request items
        for (const selectedItem of selectedItems) {
          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: selectedItem.item.id,
              quantity: selectedItem.quantity,
              unitPrice: selectedItem.unitPrice,
              totalPrice: selectedItem.totalPrice
            }
          })
        }

        // Create approval if status is not PENDING
        if (status !== 'PENDING') {
          const approver = randomChoice(users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER'))
          await prisma.approval.create({
            data: {
              requestId: request.id,
              approverId: approver.id,
              status: status === 'APPROVED' || status === 'COMPLETED' ? 'APPROVED' : 'REJECTED',
              comments: status === 'APPROVED' || status === 'COMPLETED' ? 'Request approved' : 'Request rejected - insufficient budget',
              level: 1
            }
          })
        }
      }
      console.log(`✅ Created ${requestsToCreate} additional requests (total: ${existingRequests + requestsToCreate})`)
    }

    if (existingOrders === 0) {
      console.log('🛒 Creating sample purchase orders...')
      
      // Create 8 sample purchase orders
      for (let i = 0; i < 8; i++) {
        const creator = randomChoice(users.filter(u => u.role === 'ADMIN' || u.role === 'MANAGER'))
        const supplier = randomChoice(suppliers)
        const numItems = Math.floor(Math.random() * 4) + 1 // 1-4 items per order
        const selectedItems = []
        
        for (let j = 0; j < numItems; j++) {
          const item = randomChoice(items)
          const quantity = Math.floor(Math.random() * 50) + 10 // 10-59 items
          selectedItems.push({
            item,
            quantity,
            unitPrice: item.price,
            totalPrice: item.price * quantity
          })
        }

        const totalAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0)
        const status = randomChoice(['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'])
        
        const order = await prisma.purchaseOrder.create({
          data: {
            orderNumber: `PO-${Date.now()}-${i + 1}`,
            supplierId: supplier.id,
            createdById: creator.id,
            status,
            totalAmount,
            notes: `Purchase order for ${selectedItems.map(item => item.item.name).join(', ')}`,
            expectedDate: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
            createdAt: randomDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), new Date())
          }
        })

        // Create order items
        for (const selectedItem of selectedItems) {
          await prisma.orderItem.create({
            data: {
              purchaseOrderId: order.id,
              itemId: selectedItem.item.id,
              quantity: selectedItem.quantity,
              unitPrice: selectedItem.unitPrice,
              totalPrice: selectedItem.totalPrice
            }
          })
        }
      }
      console.log('✅ Created 8 sample purchase orders')
    }

    // Check final counts
    const finalRequests = await prisma.request.count()
    const finalOrders = await prisma.purchaseOrder.count()
    const finalRequestItems = await prisma.requestItem.count()
    const finalOrderItems = await prisma.orderItem.count()

    console.log('\n📊 Final counts:')
    console.log(`  Requests: ${finalRequests}`)
    console.log(`  Purchase Orders: ${finalOrders}`)
    console.log(`  Request Items: ${finalRequestItems}`)
    console.log(`  Order Items: ${finalOrderItems}`)

    console.log('\n🎉 Missing data restoration completed!')

  } catch (error) {
    console.error('❌ Error adding missing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addMissingData()
