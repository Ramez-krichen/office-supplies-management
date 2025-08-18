import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

async function addSpendingData() {
  try {
    console.log('💰 Adding spending data to existing database...\n')

    // First, check if we have the basic data we need
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()
    
    console.log(`Found ${users.length} users and ${departments.length} departments`)

    // Check if we have suppliers and items
    let suppliers = await prisma.supplier.findMany()
    let categories = await prisma.category.findMany()
    let items = await prisma.item.findMany()

    // Create basic suppliers if none exist
    if (suppliers.length === 0) {
      console.log('Creating suppliers...')
      const supplierData = [
        { name: 'Office Depot', email: 'orders@officedepot.com', phone: '555-0101', status: 'ACTIVE' },
        { name: 'Staples', email: 'business@staples.com', phone: '555-0102', status: 'ACTIVE' },
        { name: 'Amazon Business', email: 'business@amazon.com', phone: '555-0103', status: 'ACTIVE' },
        { name: 'Best Buy Business', email: 'business@bestbuy.com', phone: '555-0104', status: 'ACTIVE' }
      ]

      for (const supplier of supplierData) {
        const created = await prisma.supplier.create({ data: supplier })
        suppliers.push(created)
        console.log(`  ✅ Created supplier: ${supplier.name}`)
      }
    }

    // Create basic categories if none exist
    if (categories.length === 0) {
      console.log('Creating categories...')
      const categoryData = [
        { name: 'Office Supplies', description: 'Basic office supplies and stationery' },
        { name: 'Technology', description: 'Computer equipment and software' },
        { name: 'Furniture', description: 'Office furniture and fixtures' },
        { name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' }
      ]

      for (const category of categoryData) {
        const created = await prisma.category.create({ data: category })
        categories.push(created)
        console.log(`  ✅ Created category: ${category.name}`)
      }
    }

    // Create basic items if none exist
    if (items.length === 0) {
      console.log('Creating items...')
      const itemData = [
        { reference: 'PEN001', name: 'Blue Ballpoint Pens (Pack of 10)', price: 12.99, unit: 'pack', currentStock: 50, minStock: 10, categoryId: categories[0].id, supplierId: suppliers[0].id },
        { reference: 'PAP001', name: 'A4 Copy Paper (500 sheets)', price: 8.50, unit: 'ream', currentStock: 100, minStock: 20, categoryId: categories[0].id, supplierId: suppliers[0].id },
        { reference: 'MON001', name: '24" LED Monitor', price: 299.99, unit: 'each', currentStock: 15, minStock: 5, categoryId: categories[1].id, supplierId: suppliers[3].id },
        { reference: 'KEY001', name: 'Wireless Keyboard', price: 79.99, unit: 'each', currentStock: 25, minStock: 5, categoryId: categories[1].id, supplierId: suppliers[3].id },
        { reference: 'CHA001', name: 'Office Chair', price: 199.99, unit: 'each', currentStock: 10, minStock: 2, categoryId: categories[2].id, supplierId: suppliers[1].id },
        { reference: 'CLN001', name: 'All-Purpose Cleaner', price: 6.99, unit: 'bottle', currentStock: 30, minStock: 10, categoryId: categories[3].id, supplierId: suppliers[0].id }
      ]

      for (const item of itemData) {
        const created = await prisma.item.create({ data: item })
        items.push(created)
        console.log(`  ✅ Created item: ${item.name}`)
      }
    }

    console.log(`\nUsing ${suppliers.length} suppliers, ${categories.length} categories, ${items.length} items`)

    // Create requests with spending for current month
    console.log('\nCreating requests with spending...')
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const statuses = ['APPROVED', 'COMPLETED']
    const priorities = ['LOW', 'MEDIUM', 'HIGH']

    // Create 20 requests for current month
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomDept = departments[Math.floor(Math.random() * departments.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      
      // Create request date in current month
      const requestDate = randomDate(currentMonth, now)

      const request = await prisma.request.create({
        data: {
          title: `${randomDept.name} Monthly Supplies ${i + 1}`,
          description: `Office supplies request for ${randomDept.name} department`,
          priority: priority as any,
          status: status as any,
          requesterId: randomUser.id,
          department: randomDept.name,
          totalAmount: 0,
          createdAt: requestDate,
          updatedAt: requestDate
        }
      })

      // Add 2-4 items to each request
      const itemsCount = Math.floor(Math.random() * 3) + 2
      let totalAmount = 0

      for (let j = 0; j < itemsCount; j++) {
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const quantity = Math.floor(Math.random() * 5) + 1
        const unitPrice = randomAmount(randomItem.price * 0.95, randomItem.price * 1.05)
        const itemTotal = quantity * unitPrice
        totalAmount += itemTotal

        await prisma.requestItem.create({
          data: {
            requestId: request.id,
            itemId: randomItem.id,
            quantity,
            unitPrice,
            totalPrice: itemTotal,
            notes: `For ${randomDept.name} department use`
          }
        })
      }

      // Update request total
      await prisma.request.update({
        where: { id: request.id },
        data: { totalAmount }
      })

      console.log(`  ✅ Created request: ${request.title} - $${totalAmount.toFixed(2)}`)
    }

    // Create some purchase orders for current month
    console.log('\nCreating purchase orders...')
    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED']

    for (let i = 0; i < 10; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
      const status = poStatuses[Math.floor(Math.random() * poStatuses.length)]
      
      const orderDate = randomDate(currentMonth, now)
      const totalAmount = randomAmount(100, 2000)

      await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')}`,
          supplierId: randomSupplier.id,
          status: status as any,
          totalAmount,
          orderDate,
          createdById: randomUser.id,
          createdAt: orderDate,
          updatedAt: orderDate
        }
      })

      console.log(`  ✅ Created PO: PO-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(4, '0')} - $${totalAmount.toFixed(2)}`)
    }

    console.log('\n🎉 Spending data added successfully!')
    console.log('The departments page should now show monthly spending amounts.')

  } catch (error) {
    console.error('❌ Error adding spending data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSpendingData()
