import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to generate random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to generate random number within range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to generate random float within range
function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

// Helper function to pick random item from array
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper function to pick multiple random items from array
function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

async function main() {
  console.log('🌱 Starting comprehensive data seeding for the past 10 years...')

  // Define date ranges
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(endDate.getFullYear() - 10)

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.demandForecast.deleteMany()
  await prisma.return.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.requestItem.deleteMany()
  await prisma.request.deleteMany()
  await prisma.item.deleteMany()
  await prisma.category.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()

  // Create Users
  console.log('👥 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales', 'Legal', 'Procurement']
  const roles = ['ADMIN', 'MANAGER', 'EMPLOYEE'] as const
  
  const users = []
  
  // Create single admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Main Admin',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'IT',
      status: 'ACTIVE',
      lastSignIn: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
      createdAt: randomDate(startDate, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    }
  })
  users.push(adminUser)
  
  // Create manager users
  for (let i = 0; i < 8; i++) {
    const user = await prisma.user.create({
      data: {
        email: `manager${i + 1}@company.com`,
        name: `Manager ${i + 1}`,
        password: hashedPassword,
        role: 'MANAGER',
        department: departments[i % departments.length],
        status: randomChoice(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']),
        lastSignIn: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()),
        createdAt: randomDate(startDate, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
      }
    })
    users.push(user)
  }
  
  // Create employee users
  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        email: `employee${i + 1}@company.com`,
        name: `Employee ${i + 1}`,
        password: hashedPassword,
        role: 'EMPLOYEE',
        department: randomChoice(departments),
        status: randomChoice(['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']),
        lastSignIn: randomDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), new Date()),
        createdAt: randomDate(startDate, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      }
    })
    users.push(user)
  }

  console.log(`✅ Created ${users.length} users`)

  // Create Categories
  console.log('📂 Creating categories...')
  const categoryData = [
    { name: 'Office Supplies', description: 'General office supplies and stationery' },
    { name: 'Technology', description: 'Computer equipment and electronics' },
    { name: 'Furniture', description: 'Office furniture and fixtures' },
    { name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' },
    { name: 'Stationery', description: 'Paper, pens, and writing materials' },
    { name: 'Equipment', description: 'Office equipment and machinery' },
    { name: 'Maintenance', description: 'Building and equipment maintenance' },
    { name: 'Eco-Friendly', description: 'Environmentally friendly products' },
    { name: 'Electronics', description: 'Electronic devices and accessories' },
    { name: 'Safety', description: 'Safety equipment and supplies' }
  ]

  const categories = []
  for (const catData of categoryData) {
    const category = await prisma.category.create({
      data: {
        ...catData,
        createdAt: randomDate(startDate, new Date(Date.now() - 300 * 24 * 60 * 60 * 1000))
      }
    })
    categories.push(category)
  }

  console.log(`✅ Created ${categories.length} categories`)

  // Create Suppliers
  console.log('🏢 Creating suppliers...')
  const supplierData = [
    { name: 'Office Depot Solutions', email: 'orders@officedepot.com', phone: '+1-555-0101', contactPerson: 'John Smith' },
    { name: 'TechWorld Supplies', email: 'sales@techworld.com', phone: '+1-555-0102', contactPerson: 'Sarah Johnson' },
    { name: 'Green Office Co.', email: 'info@greenoffice.com', phone: '+1-555-0103', contactPerson: 'Mike Green' },
    { name: 'Furniture Plus', email: 'orders@furnitureplus.com', phone: '+1-555-0104', contactPerson: 'Lisa Brown' },
    { name: 'Clean & Fresh Supplies', email: 'sales@cleanfresh.com', phone: '+1-555-0105', contactPerson: 'David Wilson' },
    { name: 'Stationery World', email: 'orders@stationeryworld.com', phone: '+1-555-0106', contactPerson: 'Emma Davis' },
    { name: 'ElectroTech Solutions', email: 'sales@electrotech.com', phone: '+1-555-0107', contactPerson: 'Robert Taylor' },
    { name: 'Safety First Equipment', email: 'orders@safetyfirst.com', phone: '+1-555-0108', contactPerson: 'Jennifer Miller' },
    { name: 'EcoSupply Partners', email: 'info@ecosupply.com', phone: '+1-555-0109', contactPerson: 'Chris Anderson' },
    { name: 'Global Office Solutions', email: 'sales@globalofficce.com', phone: '+1-555-0110', contactPerson: 'Amanda White' }
  ]

  const suppliers = []
  for (const suppData of supplierData) {
    const supplier = await prisma.supplier.create({
      data: {
        ...suppData,
        address: `${randomInt(100, 9999)} Business St, Suite ${randomInt(100, 999)}, City, State ${randomInt(10000, 99999)}`,
        createdAt: randomDate(startDate, new Date(Date.now() - 200 * 24 * 60 * 60 * 1000))
      }
    })
    suppliers.push(supplier)
  }

  console.log(`✅ Created ${suppliers.length} suppliers`)

  // Create Items
  console.log('📦 Creating items...')
  const itemTemplates = [
    // Office Supplies
    { name: 'A4 Paper Ream', unit: 'ream', basePrice: 8.99, category: 'Office Supplies' },
    { name: 'Ballpoint Pens (Pack of 10)', unit: 'pack', basePrice: 12.50, category: 'Office Supplies' },
    { name: 'Stapler', unit: 'piece', basePrice: 15.99, category: 'Office Supplies' },
    { name: 'Paper Clips (Box)', unit: 'box', basePrice: 3.99, category: 'Office Supplies' },
    { name: 'Sticky Notes (Pack)', unit: 'pack', basePrice: 6.99, category: 'Office Supplies' },
    
    // Technology
    { name: 'Wireless Mouse', unit: 'piece', basePrice: 29.99, category: 'Technology' },
    { name: 'USB Cable', unit: 'piece', basePrice: 12.99, category: 'Technology' },
    { name: 'Keyboard', unit: 'piece', basePrice: 45.99, category: 'Technology' },
    { name: 'Monitor Stand', unit: 'piece', basePrice: 35.99, category: 'Technology' },
    { name: 'Laptop Bag', unit: 'piece', basePrice: 39.99, category: 'Technology' },
    
    // Furniture
    { name: 'Office Chair', unit: 'piece', basePrice: 199.99, category: 'Furniture' },
    { name: 'Desk Lamp', unit: 'piece', basePrice: 49.99, category: 'Furniture' },
    { name: 'Filing Cabinet', unit: 'piece', basePrice: 149.99, category: 'Furniture' },
    { name: 'Bookshelf', unit: 'piece', basePrice: 89.99, category: 'Furniture' },
    { name: 'Desk Organizer', unit: 'piece', basePrice: 24.99, category: 'Furniture' },
    
    // Cleaning Supplies
    { name: 'All-Purpose Cleaner', unit: 'bottle', basePrice: 4.99, category: 'Cleaning Supplies' },
    { name: 'Paper Towels', unit: 'roll', basePrice: 2.99, category: 'Cleaning Supplies' },
    { name: 'Trash Bags (Box)', unit: 'box', basePrice: 8.99, category: 'Cleaning Supplies' },
    { name: 'Disinfectant Wipes', unit: 'pack', basePrice: 5.99, category: 'Cleaning Supplies' },
    { name: 'Vacuum Cleaner Bags', unit: 'pack', basePrice: 12.99, category: 'Cleaning Supplies' }
  ]

  const items = []
  for (let i = 0; i < itemTemplates.length; i++) {
    const template = itemTemplates[i]
    const category = categories.find(c => c.name === template.category)!
    const supplier = randomChoice(suppliers)
    
    // Create multiple variants of each item with different suppliers
    for (let variant = 0; variant < randomInt(1, 3); variant++) {
      const variantSupplier = variant === 0 ? supplier : randomChoice(suppliers)
      const priceVariation = randomFloat(0.8, 1.3)
      
      const item = await prisma.item.create({
        data: {
          reference: `ITM-${String(i + 1).padStart(3, '0')}-${String(variant + 1).padStart(2, '0')}`,
          name: variant === 0 ? template.name : `${template.name} (${variantSupplier.name})`,
          description: `High-quality ${template.name.toLowerCase()} for office use`,
          unit: template.unit,
          price: randomFloat(template.basePrice * priceVariation, template.basePrice * priceVariation * 1.2),
          minStock: randomInt(5, 50),
          currentStock: randomInt(0, 200),
          categoryId: category.id,
          supplierId: variantSupplier.id,
          isActive: randomChoice([true, true, true, false]),
          isEcoFriendly: randomChoice([true, false, false]),
          ecoRating: randomChoice([null, randomInt(1, 5)]),
          carbonFootprint: randomChoice([null, randomFloat(0.1, 10.0)]),
          recyclable: randomChoice([true, false]),
          createdAt: randomDate(startDate, new Date(Date.now() - 100 * 24 * 60 * 60 * 1000))
        }
      })
      items.push(item)
    }
  }

  console.log(`✅ Created ${items.length} items`)

  // Create Requests with RequestItems
  console.log('📋 Creating requests...')
  const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'] as const
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
  
  const requests = []
  for (let year = 0; year < 10; year++) {
    const yearStart = new Date(startDate.getFullYear() + year, 0, 1)
    const yearEnd = new Date(startDate.getFullYear() + year, 11, 31)
    
    // Create 50-150 requests per year
    const requestsPerYear = randomInt(50, 150)
    
    for (let i = 0; i < requestsPerYear; i++) {
      const requester = randomChoice(users.filter(u => u.role === 'EMPLOYEE' || u.role === 'MANAGER'))
      const requestDate = randomDate(yearStart, yearEnd)
      
      const request = await prisma.request.create({
        data: {
          title: `Office Supplies Request ${year + 1}-${String(i + 1).padStart(3, '0')}`,
          description: `Request for office supplies for ${requester.department} department`,
          status: randomChoice(requestStatuses),
          priority: randomChoice(priorities),
          requesterId: requester.id,
          department: requester.department,
          totalAmount: 0, // Will be calculated after adding items
          createdAt: requestDate,
          updatedAt: randomDate(requestDate, new Date(Math.min(requestDate.getTime() + 30 * 24 * 60 * 60 * 1000, Date.now())))
        }
      })
      
      // Add 1-8 items to each request
      const itemCount = randomInt(1, 8)
      const requestItems = randomChoices(items.filter(i => i.isActive), itemCount)
      let totalAmount = 0
      
      for (const item of requestItems) {
        const quantity = randomInt(1, 20)
        const unitPrice = item.price
        const totalPrice = quantity * unitPrice
        totalAmount += totalPrice
        
        await prisma.requestItem.create({
          data: {
            requestId: request.id,
            itemId: item.id,
            quantity,
            unitPrice,
            totalPrice,
            notes: randomChoice([null, 'Urgent need', 'Standard request', 'Bulk order'])
          }
        })
      }
      
      // Update request total amount
      await prisma.request.update({
        where: { id: request.id },
        data: { totalAmount }
      })
      
      requests.push({ ...request, totalAmount })
    }
  }

  console.log(`✅ Created ${requests.length} requests`)

  // Create Approvals
  console.log('✅ Creating approvals...')
  const approvalStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const
  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN')
  
  for (const request of requests) {
    // Each request gets 1-2 approval levels
    const approvalLevels = request.totalAmount > 1000 ? 2 : 1
    
    for (let level = 1; level <= approvalLevels; level++) {
      const approver = randomChoice(managers)
      const approvalDate = new Date(request.createdAt.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000)
      
      await prisma.approval.create({
        data: {
          requestId: request.id,
          approverId: approver.id,
          status: request.status === 'APPROVED' ? 'APPROVED' : 
                  request.status === 'REJECTED' ? 'REJECTED' : 
                  randomChoice(approvalStatuses),
          comments: randomChoice([
            null,
            'Approved as requested',
            'Please provide more details',
            'Budget approved',
            'Rejected - insufficient budget',
            'Approved with conditions'
          ]),
          level,
          createdAt: approvalDate,
          updatedAt: approvalDate
        }
      })
    }
  }

  // Create Purchase Orders
  console.log('🛒 Creating purchase orders...')
  const poStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'] as const
  
  const purchaseOrders = []
  for (let year = 0; year < 10; year++) {
    const yearStart = new Date(startDate.getFullYear() + year, 0, 1)
    const yearEnd = new Date(startDate.getFullYear() + year, 11, 31)
    
    // Create 30-80 purchase orders per year
    const ordersPerYear = randomInt(30, 80)
    
    for (let i = 0; i < ordersPerYear; i++) {
      const supplier = randomChoice(suppliers)
      const creator = randomChoice(users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN'))
      const orderDate = randomDate(yearStart, yearEnd)
      
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO-${startDate.getFullYear() + year}-${String(i + 1).padStart(4, '0')}`,
          supplierId: supplier.id,
          status: randomChoice(poStatuses),
          totalAmount: 0, // Will be calculated after adding items
          orderDate,
          expectedDate: new Date(orderDate.getTime() + randomInt(7, 30) * 24 * 60 * 60 * 1000),
          receivedDate: randomChoice([null, new Date(orderDate.getTime() + randomInt(5, 45) * 24 * 60 * 60 * 1000)]),
          notes: randomChoice([null, 'Urgent delivery required', 'Standard order', 'Bulk purchase']),
          createdById: creator.id,
          createdAt: orderDate,
          updatedAt: randomDate(orderDate, new Date(Math.min(orderDate.getTime() + 60 * 24 * 60 * 60 * 1000, Date.now())))
        }
      })
      
      // Add 1-10 items to each purchase order
      const supplierItems = items.filter(i => i.supplierId === supplier.id && i.isActive)
      if (supplierItems.length > 0) {
        const itemCount = randomInt(1, Math.min(10, supplierItems.length))
        const orderItems = randomChoices(supplierItems, itemCount)
        let totalAmount = 0
        
        for (const item of orderItems) {
          const quantity = randomInt(10, 100)
          const unitPrice = randomFloat(item.price * 0.9, item.price * 1.1) // Slight price variation
          const totalPrice = quantity * unitPrice
          totalAmount += totalPrice
          
          await prisma.orderItem.create({
            data: {
              purchaseOrderId: purchaseOrder.id,
              itemId: item.id,
              quantity,
              unitPrice,
              totalPrice,
              receivedQuantity: purchaseOrder.status === 'RECEIVED' ? quantity :
                              purchaseOrder.status === 'ORDERED' ? randomInt(0, quantity) : 0
            }
          })
        }
        
        // Update purchase order total amount
        await prisma.purchaseOrder.update({
          where: { id: purchaseOrder.id },
          data: { totalAmount }
        })
        
        purchaseOrders.push({ ...purchaseOrder, totalAmount })
      }
    }
  }

  console.log(`✅ Created ${purchaseOrders.length} purchase orders`)

  // Create Stock Movements
  console.log('📊 Creating stock movements...')
  const movementTypes = ['IN', 'OUT', 'ADJUSTMENT', 'RETURN'] as const
  
  for (let year = 0; year < 10; year++) {
    const yearStart = new Date(startDate.getFullYear() + year, 0, 1)
    const yearEnd = new Date(startDate.getFullYear() + year, 11, 31)
    
    // Create 200-500 stock movements per year
    const movementsPerYear = randomInt(200, 500)
    
    for (let i = 0; i < movementsPerYear; i++) {
      const item = randomChoice(items)
      const user = randomChoice(users)
      const movementDate = randomDate(yearStart, yearEnd)
      const type = randomChoice(movementTypes)
      
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type,
          quantity: type === 'OUT' ? -randomInt(1, 20) : randomInt(1, 50),
          reason: {
            'IN': randomChoice(['Purchase order received', 'Stock replenishment', 'Return to inventory']),
            'OUT': randomChoice(['Request fulfilled', 'Department allocation', 'Emergency use']),
            'ADJUSTMENT': randomChoice(['Inventory count correction', 'Damage adjustment', 'System correction']),
            'RETURN': randomChoice(['Defective item return', 'Unused item return', 'Wrong item return'])
          }[type],
          reference: type === 'IN' ? `PO-${randomInt(1000, 9999)}` : 
                    type === 'OUT' ? `REQ-${randomInt(1000, 9999)}` : null,
          userId: user.id,
          createdAt: movementDate
        }
      })
    }
  }

  // Create Returns
  console.log('🔄 Creating returns...')
  const returnReasons = ['DEFECTIVE', 'DAMAGED', 'WRONG_ITEM', 'EXCESS_QUANTITY', 'NOT_NEEDED', 'QUALITY_ISSUE', 'OTHER'] as const
  const itemConditions = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED', 'UNUSABLE'] as const
  const returnStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'REFUNDED'] as const
  
  for (let year = 0; year < 10; year++) {
    const yearStart = new Date(startDate.getFullYear() + year, 0, 1)
    const yearEnd = new Date(startDate.getFullYear() + year, 11, 31)
    
    // Create 20-50 returns per year
    const returnsPerYear = randomInt(20, 50)
    
    for (let i = 0; i < returnsPerYear; i++) {
      const item = randomChoice(items)
      const requester = randomChoice(users)
      const processor = randomChoice(users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN'))
      const returnDate = randomDate(yearStart, yearEnd)
      const status = randomChoice(returnStatuses)
      
      await prisma.return.create({
        data: {
          returnNumber: `RET-${startDate.getFullYear() + year}-${String(i + 1).padStart(4, '0')}`,
          itemId: item.id,
          quantity: randomInt(1, 10),
          reason: randomChoice(returnReasons),
          condition: randomChoice(itemConditions),
          description: `Return request for ${item.name}`,
          requesterId: requester.id,
          status,
          returnDate,
          processedDate: status === 'PROCESSED' || status === 'REFUNDED' ? 
            new Date(returnDate.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000) : null,
          processedBy: status === 'PROCESSED' || status === 'REFUNDED' ? processor.id : null,
          refundAmount: status === 'REFUNDED' ? randomFloat(item.price * 0.5, item.price) : 0,
          createdAt: returnDate,
          updatedAt: randomDate(returnDate, new Date(Math.min(returnDate.getTime() + 30 * 24 * 60 * 60 * 1000, Date.now())))
        }
      })
    }
  }

  // Create Demand Forecasts
  console.log('📈 Creating demand forecasts...')
  const periodTypes = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const
  const algorithms = ['Linear Regression', 'Moving Average', 'Exponential Smoothing', 'ARIMA', 'Neural Network']
  
  for (const item of items.slice(0, 20)) { // Only for first 20 items to keep data manageable
    for (let year = 0; year < 3; year++) { // Last 3 years
      const forecastYear = endDate.getFullYear() - 2 + year
      
      // Monthly forecasts
      for (let month = 1; month <= 12; month++) {
        const period = `${forecastYear}-${String(month).padStart(2, '0')}`
        const predictedDemand = randomInt(10, 100)
        const actualDemand = month <= new Date().getMonth() + 1 && forecastYear <= new Date().getFullYear() ? 
          randomInt(Math.max(1, predictedDemand - 20), predictedDemand + 20) : null
        
        await prisma.demandForecast.create({
          data: {
            itemId: item.id,
            period,
            periodType: 'MONTHLY',
            predictedDemand,
            actualDemand,
            confidence: randomFloat(0.6, 0.95),
            algorithm: randomChoice(algorithms),
            factors: JSON.stringify({
              seasonality: randomFloat(0.1, 0.3),
              trend: randomFloat(-0.1, 0.2),
              historical_avg: randomFloat(50, 150)
            }),
            createdAt: new Date(forecastYear, month - 1, 1),
            updatedAt: new Date(forecastYear, month - 1, randomInt(1, 28))
          }
        })
      }
    }
  }

  // Create Audit Logs
  console.log('📝 Creating audit logs...')
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SEND', 'RECEIVE']
  const entities = ['User', 'Supplier', 'Item', 'Request', 'PurchaseOrder', 'Return']
  
  for (let year = 0; year < 10; year++) {
    const yearStart = new Date(startDate.getFullYear() + year, 0, 1)
    const yearEnd = new Date(startDate.getFullYear() + year, 11, 31)
    
    // Create 100-300 audit logs per year
    const logsPerYear = randomInt(100, 300)
    
    for (let i = 0; i < logsPerYear; i++) {
      const user = randomChoice(users)
      const logDate = randomDate(yearStart, yearEnd)
      const action = randomChoice(actions)
      const entity = randomChoice(entities)
      
      await prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId: `${entity.toLowerCase()}_${randomInt(1000, 9999)}`,
          performedBy: user.id,
          timestamp: logDate,
          details: JSON.stringify({
            action,
            entity,
            user: user.name,
            department: user.department,
            changes: `${action} operation performed on ${entity}`
          })
        }
      })
    }
  }

  console.log('🎉 Comprehensive data seeding completed successfully!')
  console.log('📊 Summary:')
  console.log(`   👥 Users: ${users.length}`)
  console.log(`   📂 Categories: ${categories.length}`)
  console.log(`   🏢 Suppliers: ${suppliers.length}`)
  console.log(`   📦 Items: ${items.length}`)
  console.log(`   📋 Requests: ${requests.length}`)
  console.log(`   🛒 Purchase Orders: ${purchaseOrders.length}`)
  console.log('   📊 Stock Movements: ~2000-5000')
  console.log('   🔄 Returns: ~200-500')
  console.log('   📈 Demand Forecasts: ~720')
  console.log('   📝 Audit Logs: ~1000-3000')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })