import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to generate random dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper function to generate realistic amounts
function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

async function main() {
  console.log('🌱 Seeding database with enhanced realistic data...')

  // Clear existing data
  await prisma.demandForecast.deleteMany()
  await prisma.return.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.requestItem.deleteMany()
  await prisma.request.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.item.deleteMany()
  await prisma.category.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()

  // Create single admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Main Admin',
      password: adminPassword,
      role: 'ADMIN',
      department: 'IT',
      lastSignIn: randomDate(new Date(2024, 0, 1), new Date()),
    },
  })

  // Create manager users
  const managerPassword = await bcrypt.hash('manager123', 12)
  const managers = [
    { email: 'mike.manager@company.com', name: 'Mike Manager', department: 'Operations' },
    { email: 'lisa.chen@company.com', name: 'Lisa Chen', department: 'Finance' },
    { email: 'david.rodriguez@company.com', name: 'David Rodriguez', department: 'HR' },
    { email: 'jennifer.kim@company.com', name: 'Jennifer Kim', department: 'Marketing' },
    { email: 'robert.taylor@company.com', name: 'Robert Taylor', department: 'Sales' },
  ]

  const createdManagers = []
  for (const manager of managers) {
    const user = await prisma.user.create({
      data: {
        ...manager,
        password: managerPassword,
        role: 'MANAGER',
        lastSignIn: randomDate(new Date(2024, 0, 1), new Date()),
      },
    })
    createdManagers.push(user)
  }

  // Create employee users
  const employeePassword = await bcrypt.hash('employee123', 12)
  const employees = [
    { email: 'alice.employee@company.com', name: 'Alice Johnson', department: 'Marketing' },
    { email: 'bob.smith@company.com', name: 'Bob Smith', department: 'Sales' },
    { email: 'carol.jones@company.com', name: 'Carol Jones', department: 'Marketing' },
    { email: 'dan.brown@company.com', name: 'Dan Brown', department: 'Operations' },
    { email: 'eva.garcia@company.com', name: 'Eva Garcia', department: 'Finance' },
    { email: 'frank.miller@company.com', name: 'Frank Miller', department: 'IT' },
    { email: 'grace.davis@company.com', name: 'Grace Davis', department: 'HR' },
    { email: 'henry.wilson@company.com', name: 'Henry Wilson', department: 'Sales' },
    { email: 'iris.taylor@company.com', name: 'Iris Taylor', department: 'Marketing' },
    { email: 'jack.anderson@company.com', name: 'Jack Anderson', department: 'Operations' },
    { email: 'kate.thomas@company.com', name: 'Kate Thomas', department: 'Finance' },
    { email: 'liam.white@company.com', name: 'Liam White', department: 'IT' },
    { email: 'maya.patel@company.com', name: 'Maya Patel', department: 'HR' },
    { email: 'noah.clark@company.com', name: 'Noah Clark', department: 'Operations' },
    { email: 'olivia.martinez@company.com', name: 'Olivia Martinez', department: 'Sales' },
  ]

  const createdEmployees = []
  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        ...emp,
        password: employeePassword,
        role: 'EMPLOYEE',
        lastSignIn: randomDate(new Date(2024, 0, 1), new Date()),
      },
    })
    createdEmployees.push(user)
  }

  // Create suppliers with more realistic data
  const suppliers = [
    {
      name: 'Office Depot Business Solutions',
      email: 'business@officedepot.com',
      phone: '+1-800-463-3768',
      address: '6600 North Military Trail, Boca Raton, FL 33496',
      contactPerson: 'John Smith',
    },
    {
      name: 'Staples Business Advantage',
      email: 'advantage@staples.com',
      phone: '+1-800-378-2753',
      address: '500 Staples Drive, Framingham, MA 01702',
      contactPerson: 'Jane Doe',
    },
    {
      name: 'Best Buy for Business',
      email: 'business@bestbuy.com',
      phone: '+1-800-353-1700',
      address: '7601 Penn Avenue South, Richfield, MN 55423',
      contactPerson: 'Michael Chen',
    },
    {
      name: 'Amazon Business',
      email: 'business@amazon.com',
      phone: '+1-888-281-3847',
      address: '410 Terry Avenue North, Seattle, WA 98109',
      contactPerson: 'Sarah Johnson',
    },
    {
      name: 'Costco Business Center',
      email: 'business@costco.com',
      phone: '+1-800-774-2678',
      address: '999 Lake Drive, Issaquah, WA 98027',
      contactPerson: 'Robert Martinez',
    },
    {
      name: 'W.B. Mason',
      email: 'orders@wbmason.com',
      phone: '+1-800-962-2766',
      address: '59 Centre Street, Brockton, MA 02303',
      contactPerson: 'Lisa Wong',
    },
  ]

  const createdSuppliers = []
  for (const supplier of suppliers) {
    const created = await prisma.supplier.create({ data: supplier })
    createdSuppliers.push(created)
  }

  // Create categories with subcategories
  const categories = [
    { name: 'Office Supplies', description: 'General office supplies and stationery' },
    { name: 'Technology', description: 'Computer and technology equipment' },
    { name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' },
    { name: 'Furniture', description: 'Office furniture and ergonomic equipment' },
    { name: 'Kitchen Supplies', description: 'Break room and kitchen supplies' },
    { name: 'Safety Equipment', description: 'Safety and security equipment' },
    { name: 'Printing & Paper', description: 'Printing supplies and paper products' },
    { name: 'Storage & Organization', description: 'Filing and storage solutions' },
  ]

  const createdCategories = []
  for (const category of categories) {
    const created = await prisma.category.create({ data: category })
    createdCategories.push(created)
  }

  // Create comprehensive items with realistic data
  const items = [
    // Office Supplies
    {
      reference: 'PEN-BLU-001',
      name: 'BIC Cristal Blue Ballpoint Pens (50-pack)',
      description: 'Classic blue ballpoint pens with clear barrel',
      unit: 'pack',
      price: 24.99,
      minStock: 15,
      currentStock: 42,
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[0].id,
      isEcoFriendly: false,
    },
    {
      reference: 'PEN-BLK-002',
      name: 'Pilot G2 Black Gel Pens (12-pack)',
      description: 'Smooth writing gel pens with comfortable grip',
      unit: 'pack',
      price: 18.50,
      minStock: 20,
      currentStock: 8, // Low stock
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[1].id,
      isEcoFriendly: false,
    },
    {
      reference: 'PAP-A4-001',
      name: 'HP Copy Paper A4 (500 sheets)',
      description: 'Bright white multipurpose paper, 80gsm',
      unit: 'ream',
      price: 9.99,
      minStock: 50,
      currentStock: 125,
      categoryId: createdCategories[6].id, // Printing & Paper
      supplierId: createdSuppliers[0].id,
      isEcoFriendly: true,
      ecoRating: 4,
      recyclable: true,
    },
    {
      reference: 'STA-HD-001',
      name: 'Swingline Heavy-Duty Stapler',
      description: 'Professional stapler, 160-sheet capacity',
      unit: 'piece',
      price: 34.99,
      minStock: 8,
      currentStock: 12,
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[1].id,
      isEcoFriendly: false,
    },
    {
      reference: 'NOT-SPR-001',
      name: 'Five Minute Journal Notebooks (5-pack)',
      description: 'College-ruled spiral notebooks, 100 pages each',
      unit: 'pack',
      price: 22.99,
      minStock: 20,
      currentStock: 55,
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[0].id,
      isEcoFriendly: true,
      ecoRating: 3,
      recyclable: true,
    },
    // Technology
    {
      reference: 'TON-HP-001',
      name: 'HP 26A Black LaserJet Toner Cartridge',
      description: 'Original HP toner for LaserJet Pro M402/M426 series',
      unit: 'piece',
      price: 94.99,
      minStock: 5,
      currentStock: 3, // Low stock
      categoryId: createdCategories[1].id,
      supplierId: createdSuppliers[2].id,
      isEcoFriendly: false,
    },
    {
      reference: 'MON-DEL-001',
      name: 'Dell 24" FHD Monitor (P2422H)',
      description: '1920x1080 IPS monitor with USB hub',
      unit: 'piece',
      price: 229.99,
      minStock: 3,
      currentStock: 7,
      categoryId: createdCategories[1].id,
      supplierId: createdSuppliers[2].id,
      isEcoFriendly: true,
      ecoRating: 4,
    },
    {
      reference: 'KEY-LOG-001',
      name: 'Logitech MK540 Wireless Combo',
      description: 'Wireless keyboard and mouse with 3-year battery life',
      unit: 'set',
      price: 49.99,
      minStock: 10,
      currentStock: 18,
      categoryId: createdCategories[1].id,
      supplierId: createdSuppliers[3].id,
      isEcoFriendly: false,
    },
    // Cleaning Supplies
    {
      reference: 'CLN-LYS-001',
      name: 'Lysol All-Purpose Cleaner (32oz)',
      description: 'Disinfectant cleaner kills 99.9% of germs',
      unit: 'bottle',
      price: 7.49,
      minStock: 15,
      currentStock: 6, // Low stock
      categoryId: createdCategories[2].id,
      supplierId: createdSuppliers[4].id,
      isEcoFriendly: false,
    },
    {
      reference: 'TOW-BOU-001',
      name: 'Bounty Paper Towels (12-pack)',
      description: 'Select-A-Size paper towels, 12 mega rolls',
      unit: 'pack',
      price: 28.99,
      minStock: 8,
      currentStock: 15,
      categoryId: createdCategories[2].id,
      supplierId: createdSuppliers[4].id,
      isEcoFriendly: false,
    },
    // Furniture
    {
      reference: 'CHA-ERG-001',
      name: 'Herman Miller Aeron Chair (Size B)',
      description: 'Ergonomic office chair with lumbar support',
      unit: 'piece',
      price: 1395.00,
      minStock: 2,
      currentStock: 4,
      categoryId: createdCategories[3].id,
      supplierId: createdSuppliers[0].id,
      isEcoFriendly: true,
      ecoRating: 5,
      recyclable: true,
    },
    {
      reference: 'DES-STA-001',
      name: 'UPLIFT V2 Standing Desk',
      description: 'Height-adjustable standing desk, 48"x30"',
      unit: 'piece',
      price: 599.00,
      minStock: 2,
      currentStock: 3,
      categoryId: createdCategories[3].id,
      supplierId: createdSuppliers[1].id,
      isEcoFriendly: true,
      ecoRating: 4,
    },
    // Kitchen Supplies
    {
      reference: 'COF-KCU-001',
      name: 'Green Mountain Coffee K-Cups (72-pack)',
      description: 'Breakfast Blend medium roast coffee pods',
      unit: 'pack',
      price: 42.99,
      minStock: 15,
      currentStock: 28,
      categoryId: createdCategories[4].id,
      supplierId: createdSuppliers[4].id,
      isEcoFriendly: true,
      ecoRating: 3,
    },
    {
      reference: 'CUP-DIS-001',
      name: 'Solo Hot Cups (1000-pack)',
      description: '12oz insulated paper cups with lids',
      unit: 'pack',
      price: 89.99,
      minStock: 10,
      currentStock: 22,
      categoryId: createdCategories[4].id,
      supplierId: createdSuppliers[4].id,
      isEcoFriendly: true,
      ecoRating: 3,
      recyclable: true,
    },
    // Safety Equipment
    {
      reference: 'EXT-FIR-001',
      name: 'Amerex ABC Fire Extinguisher (10lb)',
      description: 'Multi-purpose dry chemical fire extinguisher',
      unit: 'piece',
      price: 65.99,
      minStock: 4,
      currentStock: 6,
      categoryId: createdCategories[5].id,
      supplierId: createdSuppliers[2].id,
      isEcoFriendly: false,
    },
    {
      reference: 'AID-KIT-001',
      name: 'Johnson & Johnson First Aid Kit',
      description: 'Comprehensive 140-piece first aid kit',
      unit: 'piece',
      price: 39.99,
      minStock: 3,
      currentStock: 5,
      categoryId: createdCategories[5].id,
      supplierId: createdSuppliers[3].id,
      isEcoFriendly: false,
    },
    // Storage & Organization
    {
      reference: 'FOL-MAN-001',
      name: 'Pendaflex Manila File Folders (100-pack)',
      description: 'Letter size manila folders with 1/3-cut tabs',
      unit: 'pack',
      price: 24.99,
      minStock: 12,
      currentStock: 28,
      categoryId: createdCategories[7].id,
      supplierId: createdSuppliers[1].id,
      isEcoFriendly: true,
      ecoRating: 3,
      recyclable: true,
    },
    {
      reference: 'BOX-STO-001',
      name: 'Bankers Box Storage Boxes (12-pack)',
      description: 'Letter/legal size storage boxes with lids',
      unit: 'pack',
      price: 34.99,
      minStock: 8,
      currentStock: 16,
      categoryId: createdCategories[7].id,
      supplierId: createdSuppliers[0].id,
      isEcoFriendly: true,
      ecoRating: 4,
      recyclable: true,
    },
  ]

  const createdItems = []
  for (const item of items) {
    const created = await prisma.item.create({ data: item })
    createdItems.push(created)
  }

  console.log(`✅ Created ${createdItems.length} items`)

  // Create realistic requests with proper dates and amounts
  const requestStatuses = ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED']
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  const departments = ['Marketing', 'Sales', 'Operations', 'Finance', 'IT', 'HR']

  const requests = []
  for (let i = 0; i < 25; i++) {
    const requester = createdEmployees[Math.floor(Math.random() * createdEmployees.length)]
    const status = requestStatuses[Math.floor(Math.random() * requestStatuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const createdDate = randomDate(new Date(2024, 0, 1), new Date())
    
    const request = await prisma.request.create({
      data: {
        title: `Office Supplies Request #${String(i + 1).padStart(3, '0')}`,
        description: `Request for office supplies for ${requester.department} department`,
        status: status as any,
        priority: priority as any,
        requesterId: requester.id,
        department: requester.department,
        totalAmount: 0, // Will be calculated after adding items
        createdAt: createdDate,
        updatedAt: status === 'PENDING' ? createdDate : randomDate(createdDate, new Date()),
      },
    })
    requests.push(request)
  }

  // Add request items and calculate totals
  for (const request of requests) {
    const numItems = Math.floor(Math.random() * 4) + 1 // 1-4 items per request
    let totalAmount = 0
    const usedItemIds = new Set() // Track used items to avoid duplicates

    for (let j = 0; j < numItems; j++) {
      let item
      let attempts = 0
      // Find an item that hasn't been used in this request
      do {
        item = createdItems[Math.floor(Math.random() * createdItems.length)]
        attempts++
      } while (usedItemIds.has(item.id) && attempts < 10)
      
      if (usedItemIds.has(item.id)) continue // Skip if we can't find a unique item
      
      usedItemIds.add(item.id)
      const quantity = Math.floor(Math.random() * 10) + 1
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
          notes: `Requested for ${request.department} department use`,
        },
      })
    }

    // Update request total amount
    await prisma.request.update({
      where: { id: request.id },
      data: { totalAmount },
    })
  }

  console.log(`✅ Created ${requests.length} requests with items`)

  // Create purchase orders with realistic data
  const purchaseOrderStatuses = ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']
  
  for (let i = 0; i < 15; i++) {
    const supplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)]
    const status = purchaseOrderStatuses[Math.floor(Math.random() * purchaseOrderStatuses.length)]
    const orderDate = randomDate(new Date(2024, 0, 1), new Date())
    const expectedDate = new Date(orderDate.getTime() + (Math.random() * 14 + 3) * 24 * 60 * 60 * 1000) // 3-17 days later
    
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-2024-${String(i + 1).padStart(4, '0')}`,
        supplierId: supplier.id,
        status: status as any,
        totalAmount: 0, // Will be calculated
        orderDate,
        expectedDate,
        receivedDate: status === 'RECEIVED' ? randomDate(expectedDate, new Date()) : null,
        notes: `Purchase order for ${supplier.name}`,
        createdById: adminUser.id,
        createdAt: orderDate,
      },
    })

    // Add order items
    const numItems = Math.floor(Math.random() * 5) + 1 // 1-5 items per order
    let totalAmount = 0
    const usedItemIds = new Set() // Track used items to avoid duplicates

    for (let j = 0; j < numItems; j++) {
      let item
      let attempts = 0
      // Find an item that hasn't been used in this order
      do {
        item = createdItems[Math.floor(Math.random() * createdItems.length)]
        attempts++
      } while (usedItemIds.has(item.id) && attempts < 10)
      
      if (usedItemIds.has(item.id)) continue // Skip if we can't find a unique item
      
      usedItemIds.add(item.id)
      const quantity = Math.floor(Math.random() * 50) + 10 // 10-59 quantity
      const unitPrice = item.price * (0.8 + Math.random() * 0.4) // ±20% price variation
      const totalPrice = quantity * unitPrice
      const receivedQuantity = status === 'RECEIVED' ? quantity : 
                              status === 'PARTIALLY_RECEIVED' ? Math.floor(quantity * 0.7) : 0
      totalAmount += totalPrice

      await prisma.orderItem.create({
        data: {
          purchaseOrderId: purchaseOrder.id,
          itemId: item.id,
          quantity,
          unitPrice,
          totalPrice,
          receivedQuantity,
        },
      })
    }

    // Update purchase order total
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: { totalAmount },
    })
  }

  console.log('✅ Created 15 purchase orders with items')

  // Create stock movements
  const movementTypes = ['IN', 'OUT', 'ADJUSTMENT', 'RETURN']
  
  for (let i = 0; i < 50; i++) {
    const item = createdItems[Math.floor(Math.random() * createdItems.length)]
    const type = movementTypes[Math.floor(Math.random() * movementTypes.length)]
    const user = [...createdEmployees, ...createdManagers, adminUser][Math.floor(Math.random() * (createdEmployees.length + createdManagers.length + 1))]
    const quantity = Math.floor(Math.random() * 20) + 1
    const createdDate = randomDate(new Date(2024, 0, 1), new Date())

    await prisma.stockMovement.create({
      data: {
        itemId: item.id,
        type: type as any,
        quantity: type === 'OUT' ? -quantity : quantity,
        reason: `${type} movement for ${item.name}`,
        reference: type === 'IN' ? `PO-2024-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}` : null,
        userId: user.id,
        createdAt: createdDate,
      },
    })
  }

  console.log('✅ Created 50 stock movements')

  // Create audit logs
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT']
  const entities = ['Request', 'PurchaseOrder', 'Item', 'User']
  
  for (let i = 0; i < 30; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)]
    const entity = entities[Math.floor(Math.random() * entities.length)]
    const user = [...createdEmployees, ...createdManagers, adminUser, admin2][Math.floor(Math.random() * (createdEmployees.length + createdManagers.length + 2))]
    const timestamp = randomDate(new Date(2024, 0, 1), new Date())

    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: `${entity.toLowerCase()}_${Math.floor(Math.random() * 1000)}`,
        performedBy: user.id,
        timestamp,
        details: `${action} operation performed on ${entity}`,
      },
    })
  }

  console.log('✅ Created 30 audit log entries')

  console.log('🎉 Enhanced database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Users: ${createdEmployees.length + createdManagers.length + 2}`)
  console.log(`- Suppliers: ${createdSuppliers.length}`)
  console.log(`- Categories: ${createdCategories.length}`)
  console.log(`- Items: ${createdItems.length}`)
  console.log(`- Requests: ${requests.length}`)
  console.log('- Purchase Orders: 15')
  console.log('- Stock Movements: 50')
  console.log('- Audit Logs: 30')
  console.log('\n🔐 Login Credentials:')
  console.log('Admin: admin@company.com / admin123')
  console.log('Manager: mike.manager@company.com / manager123')
  console.log('Employee: alice.employee@company.com / employee123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })