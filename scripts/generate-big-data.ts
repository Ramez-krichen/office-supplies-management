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

async function generateBigData() {
  try {
    console.log('🚀 Generating comprehensive spending data for 2025...\n')

    // Get existing data
    const users = await prisma.user.findMany()
    const departments = await prisma.department.findMany()
    
    console.log(`Found ${users.length} users and ${departments.length} departments`)

    // Create comprehensive suppliers if needed
    const supplierData = [
      { name: 'Office Depot', email: 'orders@officedepot.com', phone: '555-0101', status: 'ACTIVE' },
      { name: 'Staples Business', email: 'business@staples.com', phone: '555-0102', status: 'ACTIVE' },
      { name: 'Amazon Business', email: 'business@amazon.com', phone: '555-0103', status: 'ACTIVE' },
      { name: 'Best Buy Business', email: 'business@bestbuy.com', phone: '555-0104', status: 'ACTIVE' },
      { name: 'Dell Technologies', email: 'enterprise@dell.com', phone: '555-0105', status: 'ACTIVE' },
      { name: 'HP Enterprise', email: 'business@hp.com', phone: '555-0106', status: 'ACTIVE' },
      { name: 'Microsoft Business', email: 'enterprise@microsoft.com', phone: '555-0107', status: 'ACTIVE' },
      { name: 'Cisco Systems', email: 'orders@cisco.com', phone: '555-0108', status: 'ACTIVE' },
      { name: 'Herman Miller', email: 'business@hermanmiller.com', phone: '555-0109', status: 'ACTIVE' },
      { name: 'Steelcase', email: 'orders@steelcase.com', phone: '555-0110', status: 'ACTIVE' }
    ]

    let suppliers = await prisma.supplier.findMany()
    if (suppliers.length < 5) {
      console.log('Creating suppliers...')
      for (const supplier of supplierData) {
        const existing = await prisma.supplier.findFirst({ where: { name: supplier.name } })
        if (!existing) {
          const created = await prisma.supplier.create({ data: supplier })
          suppliers.push(created)
          console.log(`  ✅ Created supplier: ${supplier.name}`)
        }
      }
    }

    // Create comprehensive categories
    const categoryData = [
      { name: 'Office Supplies', description: 'Basic office supplies and stationery' },
      { name: 'Technology Hardware', description: 'Computer equipment and hardware' },
      { name: 'Software & Licenses', description: 'Software licenses and subscriptions' },
      { name: 'Office Furniture', description: 'Desks, chairs, and office furniture' },
      { name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' },
      { name: 'Kitchen Supplies', description: 'Break room and kitchen supplies' },
      { name: 'Security Equipment', description: 'Security cameras and access control' },
      { name: 'Networking Equipment', description: 'Routers, switches, and network gear' }
    ]

    let categories = await prisma.category.findMany()
    if (categories.length < 5) {
      console.log('Creating categories...')
      for (const category of categoryData) {
        const existing = await prisma.category.findFirst({ where: { name: category.name } })
        if (!existing) {
          const created = await prisma.category.create({ data: category })
          categories.push(created)
          console.log(`  ✅ Created category: ${category.name}`)
        }
      }
    }

    // Create comprehensive items with big price ranges
    const itemData = [
      // Office Supplies
      { reference: 'PEN001', name: 'Premium Ballpoint Pens (Pack of 50)', price: 45.99, unit: 'pack', categoryName: 'Office Supplies' },
      { reference: 'PAP001', name: 'Premium A4 Paper (Case of 10 reams)', price: 89.99, unit: 'case', categoryName: 'Office Supplies' },
      { reference: 'STA001', name: 'Executive Stapler Set', price: 125.00, unit: 'set', categoryName: 'Office Supplies' },
      
      // Technology Hardware
      { reference: 'LAP001', name: 'Dell Latitude 7420 Laptop', price: 1899.99, unit: 'each', categoryName: 'Technology Hardware' },
      { reference: 'MON001', name: '27" 4K Monitor Dell UltraSharp', price: 599.99, unit: 'each', categoryName: 'Technology Hardware' },
      { reference: 'KEY001', name: 'Mechanical Keyboard Premium', price: 189.99, unit: 'each', categoryName: 'Technology Hardware' },
      { reference: 'MOU001', name: 'Wireless Mouse Professional', price: 79.99, unit: 'each', categoryName: 'Technology Hardware' },
      { reference: 'DOC001', name: 'Docking Station Universal', price: 299.99, unit: 'each', categoryName: 'Technology Hardware' },
      
      // Software & Licenses
      { reference: 'OFF001', name: 'Microsoft Office 365 Business (Annual)', price: 149.99, unit: 'license', categoryName: 'Software & Licenses' },
      { reference: 'WIN001', name: 'Windows 11 Pro License', price: 199.99, unit: 'license', categoryName: 'Software & Licenses' },
      { reference: 'ADB001', name: 'Adobe Creative Suite (Annual)', price: 599.99, unit: 'license', categoryName: 'Software & Licenses' },
      
      // Office Furniture
      { reference: 'CHA001', name: 'Herman Miller Aeron Chair', price: 1395.00, unit: 'each', categoryName: 'Office Furniture' },
      { reference: 'DES001', name: 'Standing Desk Electric 60"', price: 899.99, unit: 'each', categoryName: 'Office Furniture' },
      { reference: 'CAB001', name: 'Filing Cabinet 4-Drawer', price: 449.99, unit: 'each', categoryName: 'Office Furniture' },
      
      // Networking Equipment
      { reference: 'RTR001', name: 'Cisco Router Enterprise', price: 2499.99, unit: 'each', categoryName: 'Networking Equipment' },
      { reference: 'SWI001', name: '48-Port Gigabit Switch', price: 899.99, unit: 'each', categoryName: 'Networking Equipment' },
      { reference: 'WAP001', name: 'Wireless Access Point Enterprise', price: 399.99, unit: 'each', categoryName: 'Networking Equipment' }
    ]

    let items = await prisma.item.findMany()
    if (items.length < 10) {
      console.log('Creating items...')
      for (const itemInfo of itemData) {
        const category = categories.find(c => c.name === itemInfo.categoryName)
        const supplier = getRandomElement(suppliers)
        
        if (category) {
          const existing = await prisma.item.findFirst({ where: { reference: itemInfo.reference } })
          if (!existing) {
            const created = await prisma.item.create({
              data: {
                reference: itemInfo.reference,
                name: itemInfo.name,
                price: itemInfo.price,
                unit: itemInfo.unit,
                currentStock: Math.floor(Math.random() * 100) + 50,
                minStock: Math.floor(Math.random() * 20) + 10,
                categoryId: category.id,
                supplierId: supplier.id
              }
            })
            items.push(created)
            console.log(`  ✅ Created item: ${itemInfo.name} - $${itemInfo.price}`)
          }
        }
      }
    }

    console.log(`\nUsing ${suppliers.length} suppliers, ${categories.length} categories, ${items.length} items`)

    // Generate data for entire year 2025
    const year2025Start = new Date('2025-01-01')
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    console.log('\n📅 Generating requests for entire year 2025...')

    const statuses = ['APPROVED', 'COMPLETED']
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

    // Generate 500 requests throughout 2025 (big numbers!)
    for (let i = 0; i < 500; i++) {
      const randomUser = getRandomElement(users)
      const randomDept = getRandomElement(departments)
      const status = getRandomElement(statuses)
      const priority = getRandomElement(priorities)
      
      // Create request date throughout 2025
      const requestDate = randomDate(year2025Start, now)

      const request = await prisma.request.create({
        data: {
          title: `${randomDept.name} Equipment Request ${i + 1}`,
          description: `Large equipment and supplies order for ${randomDept.name} department`,
          priority: priority as any,
          status: status as any,
          requesterId: randomUser.id,
          department: randomDept.name,
          totalAmount: 0,
          createdAt: requestDate,
          updatedAt: requestDate
        }
      })

      // Add 3-8 items to each request (big orders!)
      const itemsCount = Math.floor(Math.random() * 6) + 3
      let totalAmount = 0

      for (let j = 0; j < itemsCount; j++) {
        const randomItem = getRandomElement(items)
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
            notes: `Bulk order for ${randomDept.name} department expansion`
          }
        })
      }

      // Update request total
      await prisma.request.update({
        where: { id: request.id },
        data: { totalAmount }
      })

      if ((i + 1) % 50 === 0) {
        console.log(`  ✅ Created ${i + 1}/500 requests - Latest: $${totalAmount.toFixed(2)}`)
      }
    }

    console.log('\n📦 Generating purchase orders for 2025...')

    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED']

    // Generate 200 purchase orders throughout 2025 (big numbers!)
    for (let i = 0; i < 200; i++) {
      const randomUser = getRandomElement(users)
      const randomSupplier = getRandomElement(suppliers)
      const status = getRandomElement(poStatuses)
      
      const orderDate = randomDate(year2025Start, now)
      // Big purchase orders: $500 to $15,000
      const totalAmount = randomAmount(500, 15000)

      await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO-2025-${String(i + 1).padStart(4, '0')}`,
          supplierId: randomSupplier.id,
          status: status as any,
          totalAmount,
          orderDate,
          createdById: randomUser.id,
          createdAt: orderDate,
          updatedAt: orderDate
        }
      })

      if ((i + 1) % 25 === 0) {
        console.log(`  ✅ Created ${i + 1}/200 POs - Latest: $${totalAmount.toFixed(2)}`)
      }
    }

    // Generate extra data for current month (December 2025)
    console.log('\n📅 Generating extra data for current month...')

    // Generate 50 additional requests for current month
    for (let i = 0; i < 50; i++) {
      const randomUser = getRandomElement(users)
      const randomDept = getRandomElement(departments)
      const status = getRandomElement(statuses)
      const priority = getRandomElement(priorities)
      
      const requestDate = randomDate(currentMonth, now)

      const request = await prisma.request.create({
        data: {
          title: `${randomDept.name} December Procurement ${i + 1}`,
          description: `End-of-year procurement for ${randomDept.name} department`,
          priority: priority as any,
          status: status as any,
          requesterId: randomUser.id,
          department: randomDept.name,
          totalAmount: 0,
          createdAt: requestDate,
          updatedAt: requestDate
        }
      })

      // Add 2-5 high-value items
      const itemsCount = Math.floor(Math.random() * 4) + 2
      let totalAmount = 0

      for (let j = 0; j < itemsCount; j++) {
        const randomItem = getRandomElement(items)
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
            notes: `December procurement - ${randomDept.name}`
          }
        })
      }

      await prisma.request.update({
        where: { id: request.id },
        data: { totalAmount }
      })
    }

    // Generate 30 additional POs for current month
    for (let i = 0; i < 30; i++) {
      const randomUser = getRandomElement(users)
      const randomSupplier = getRandomElement(suppliers)
      const status = getRandomElement(poStatuses)
      
      const orderDate = randomDate(currentMonth, now)
      const totalAmount = randomAmount(1000, 25000) // Even bigger amounts for current month

      await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO-2025-DEC-${String(i + 1).padStart(3, '0')}`,
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

    console.log('\n📊 Data Generation Summary:')
    console.log('  ✅ 500 requests for entire year 2025')
    console.log('  ✅ 200 purchase orders for entire year 2025')
    console.log('  ✅ 50 additional requests for current month')
    console.log('  ✅ 30 additional purchase orders for current month')
    console.log('  ✅ High-value items and big spending amounts')
    console.log('  ✅ Comprehensive suppliers and categories')

    console.log('\n🎉 Big data generation completed successfully!')
    console.log('The system now has substantial data for forecasting and reporting!')

  } catch (error) {
    console.error('❌ Error generating big data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateBigData()
