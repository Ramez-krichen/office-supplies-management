import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createSimpleSpending() {
  try {
    console.log('Creating simple spending data...')

    // Get current month
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get users and departments
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()

    if (users.length === 0 || departments.length === 0) {
      console.log('No users or departments found')
      return
    }

    // Create a simple supplier if none exists
    let supplier = await prisma.supplier.findFirst()
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: 'Office Supplies Inc',
          email: 'orders@officesupplies.com',
          status: 'ACTIVE'
        }
      })
      console.log('Created supplier')
    }

    // Create a simple category if none exists
    let category = await prisma.category.findFirst()
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Office Supplies',
          description: 'Basic office supplies'
        }
      })
      console.log('Created category')
    }

    // Create a simple item if none exists
    let item = await prisma.item.findFirst()
    if (!item) {
      item = await prisma.item.create({
        data: {
          reference: 'PEN001',
          name: 'Blue Pens',
          price: 10.00,
          unit: 'pack',
          currentStock: 100,
          minStock: 10,
          categoryId: category.id,
          supplierId: supplier.id
        }
      })
      console.log('Created item')
    }

    // Create some approved requests for current month
    for (let i = 0; i < 5; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomDept = departments[Math.floor(Math.random() * departments.length)]

      const request = await prisma.request.create({
        data: {
          title: `Office Supplies Request ${i + 1}`,
          description: 'Monthly office supplies',
          status: 'APPROVED',
          priority: 'MEDIUM',
          requesterId: randomUser.id,
          department: randomDept.name,
          totalAmount: 50.00,
          createdAt: new Date(currentMonth.getTime() + Math.random() * (now.getTime() - currentMonth.getTime()))
        }
      })

      // Add request item
      await prisma.requestItem.create({
        data: {
          requestId: request.id,
          itemId: item.id,
          quantity: 5,
          unitPrice: 10.00,
          totalPrice: 50.00
        }
      })

      console.log(`Created request ${i + 1}`)
    }

    // Create some purchase orders for current month
    for (let i = 0; i < 3; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]

      await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO-2025-${String(i + 1).padStart(3, '0')}`,
          supplierId: supplier.id,
          status: 'CONFIRMED',
          totalAmount: 100.00,
          createdById: randomUser.id,
          createdAt: new Date(currentMonth.getTime() + Math.random() * (now.getTime() - currentMonth.getTime()))
        }
      })

      console.log(`Created PO ${i + 1}`)
    }

    console.log('Simple spending data created successfully!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSimpleSpending()
