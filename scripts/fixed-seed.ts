import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
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
    },
  })

  // Create manager users
  const managerPassword = await bcrypt.hash('manager123', 12)
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'Mike Manager',
      password: managerPassword,
      role: 'MANAGER',
      department: 'Operations',
    },
  })

  const manager2 = await prisma.user.create({
    data: {
      email: 'lisa.manager@example.com',
      name: 'Lisa Chen',
      password: managerPassword,
      role: 'MANAGER',
      department: 'Finance',
    },
  })

  const manager3 = await prisma.user.create({
    data: {
      email: 'david.manager@example.com',
      name: 'David Rodriguez',
      password: managerPassword,
      role: 'MANAGER',
      department: 'HR',
    },
  })

  // Create employee users
  const employeePassword = await bcrypt.hash('employee123', 12)
  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@example.com',
      name: 'Alice Employee',
      password: employeePassword,
      role: 'EMPLOYEE',
      department: 'Marketing',
    },
  })

  const employees = [
    { email: 'bob.smith@example.com', name: 'Bob Smith', department: 'Sales' },
    { email: 'carol.jones@example.com', name: 'Carol Jones', department: 'Marketing' },
    { email: 'dan.brown@example.com', name: 'Dan Brown', department: 'Operations' },
    { email: 'eva.garcia@example.com', name: 'Eva Garcia', department: 'Finance' },
    { email: 'frank.miller@example.com', name: 'Frank Miller', department: 'IT' },
    { email: 'grace.davis@example.com', name: 'Grace Davis', department: 'HR' },
    { email: 'henry.wilson@example.com', name: 'Henry Wilson', department: 'Sales' },
    { email: 'iris.taylor@example.com', name: 'Iris Taylor', department: 'Marketing' },
    { email: 'jack.anderson@example.com', name: 'Jack Anderson', department: 'Operations' },
    { email: 'kate.thomas@example.com', name: 'Kate Thomas', department: 'Finance' },
  ]

  const createdEmployees = []
  for (const emp of employees) {
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        name: emp.name,
        password: employeePassword,
        role: 'EMPLOYEE',
        department: emp.department,
      },
    })
    createdEmployees.push(user)
  }

  // Create suppliers
  const suppliers = [
    {
      name: 'Office Depot',
      email: 'orders@officedepot.com',
      phone: '+1-555-0123',
      address: '123 Business St, New York, NY 10001',
      contactPerson: 'John Smith',
    },
    {
      name: 'Staples Inc.',
      email: 'business@staples.com',
      phone: '+1-555-0456',
      address: '456 Commerce Ave, Boston, MA 02101',
      contactPerson: 'Jane Doe',
    },
    {
      name: 'Best Buy Business',
      email: 'corporate@bestbuy.com',
      phone: '+1-555-0789',
      address: '789 Tech Boulevard, San Francisco, CA 94102',
      contactPerson: 'Michael Chen',
    },
    {
      name: 'Amazon Business',
      email: 'b2b@amazon.com',
      phone: '+1-555-0321',
      address: '321 Fulfillment Way, Seattle, WA 98101',
      contactPerson: 'Sarah Johnson',
    },
    {
      name: 'Costco Business Center',
      email: 'business@costco.com',
      phone: '+1-555-0654',
      address: '654 Wholesale Dr, Chicago, IL 60601',
      contactPerson: 'Robert Martinez',
    },
  ]

  const createdSuppliers = []
  for (const supplier of suppliers) {
    const created = await prisma.supplier.create({ data: supplier })
    createdSuppliers.push(created)
  }

  // Create categories
  const categories = [
    {
      name: 'Office Supplies',
      description: 'General office supplies and stationery',
    },
    {
      name: 'Technology',
      description: 'Computer and technology equipment',
    },
    {
      name: 'Cleaning Supplies',
      description: 'Cleaning and maintenance supplies',
    },
    {
      name: 'Furniture',
      description: 'Office furniture and ergonomic equipment',
    },
    {
      name: 'Kitchen Supplies',
      description: 'Break room and kitchen supplies',
    },
    {
      name: 'Safety Equipment',
      description: 'Safety and security equipment',
    },
  ]

  const createdCategories = []
  for (const category of categories) {
    const created = await prisma.category.create({ data: category })
    createdCategories.push(created)
  }

  // Create items
  const items = [
    // Office Supplies
    {
      reference: 'PEN-001',
      name: 'Blue Ballpoint Pens (Pack of 10)',
      description: 'High-quality blue ballpoint pens',
      unit: 'pack',
      price: 12.99,
      minStock: 20,
      currentStock: 45,
      categoryId: createdCategories[0].id, // Office Supplies
      supplierId: createdSuppliers[0].id,
    },
    {
      reference: 'PAP-001',
      name: 'A4 Copy Paper (500 sheets)',
      description: 'White A4 copy paper, 80gsm',
      unit: 'ream',
      price: 8.50,
      minStock: 50,
      currentStock: 120,
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[0].id,
    },
    {
      reference: 'STA-001',
      name: 'Heavy-Duty Stapler',
      description: 'Professional stapler with 1000 staples included',
      unit: 'piece',
      price: 24.99,
      minStock: 10,
      currentStock: 15,
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[1].id,
    },
    {
      reference: 'NOT-001',
      name: 'Spiral Notebooks (Pack of 5)',
      description: 'College-ruled spiral notebooks',
      unit: 'pack',
      price: 15.99,
      minStock: 25,
      currentStock: 60,
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[0].id,
    },
    {
      reference: 'FOL-001',
      name: 'File Folders (Pack of 25)',
      description: 'Manila file folders, letter size',
      unit: 'pack',
      price: 18.50,
      minStock: 15,
      currentStock: 35,
      categoryId: createdCategories[0].id,
      supplierId: createdSuppliers[1].id,
    },
    // Technology
    {
      reference: 'TON-001',
      name: 'HP LaserJet Toner Cartridge',
      description: 'Black toner cartridge for HP LaserJet printers',
      unit: 'piece',
      price: 89.99,
      minStock: 5,
      currentStock: 3,
      categoryId: createdCategories[1].id, // Technology
      supplierId: createdSuppliers[2].id,
    },
    {
      reference: 'MON-001',
      name: '24-inch LED Monitor',
      description: 'Full HD 1920x1080 LED monitor',
      unit: 'piece',
      price: 199.99,
      minStock: 3,
      currentStock: 8,
      categoryId: createdCategories[1].id,
      supplierId: createdSuppliers[2].id,
    },
    {
      reference: 'KEY-001',
      name: 'Wireless Keyboard and Mouse Set',
      description: 'Ergonomic wireless keyboard and optical mouse',
      unit: 'set',
      price: 45.99,
      minStock: 10,
      currentStock: 22,
      categoryId: createdCategories[1].id,
      supplierId: createdSuppliers[2].id,
    },
    {
      reference: 'CAB-001',
      name: 'USB-C Charging Cable (6ft)',
      description: 'High-speed USB-C charging and data cable',
      unit: 'piece',
      price: 12.99,
      minStock: 20,
      currentStock: 45,
      categoryId: createdCategories[1].id,
      supplierId: createdSuppliers[3].id,
    },
    // Cleaning Supplies
    {
      reference: 'CLN-001',
      name: 'All-Purpose Cleaner',
      description: 'Multi-surface cleaning spray, 32oz',
      unit: 'bottle',
      price: 6.75,
      minStock: 15,
      currentStock: 8,
      categoryId: createdCategories[2].id, // Cleaning Supplies
      supplierId: createdSuppliers[4].id,
    },
    {
      reference: 'TOW-001',
      name: 'Paper Towels (12-pack)',
      description: 'Absorbent paper towels, 12 rolls',
      unit: 'pack',
      price: 24.99,
      minStock: 10,
      currentStock: 18,
      categoryId: createdCategories[2].id,
      supplierId: createdSuppliers[4].id,
    },
    {
      reference: 'DIS-001',
      name: 'Disinfectant Wipes (6-pack)',
      description: 'Antibacterial disinfectant wipes',
      unit: 'pack',
      price: 18.99,
      minStock: 12,
      currentStock: 25,
      categoryId: createdCategories[2].id,
      supplierId: createdSuppliers[4].id,
    },
    // Furniture
    {
      reference: 'CHA-001',
      name: 'Ergonomic Office Chair',
      description: 'Adjustable height office chair with lumbar support',
      unit: 'piece',
      price: 299.99,
      minStock: 2,
      currentStock: 5,
      categoryId: createdCategories[3].id, // Furniture
      supplierId: createdSuppliers[0].id,
    },
    {
      reference: 'DES-001',
      name: 'Standing Desk Converter',
      description: 'Adjustable standing desk converter',
      unit: 'piece',
      price: 199.99,
      minStock: 3,
      currentStock: 7,
      categoryId: createdCategories[3].id,
      supplierId: createdSuppliers[1].id,
    },
    // Kitchen Supplies
    {
      reference: 'COF-001',
      name: 'Coffee K-Cups (24-pack)',
      description: 'Premium coffee K-cups, medium roast',
      unit: 'pack',
      price: 16.99,
      minStock: 20,
      currentStock: 40,
      categoryId: createdCategories[4].id, // Kitchen Supplies
      supplierId: createdSuppliers[4].id,
    },
    {
      reference: 'CUP-001',
      name: 'Disposable Cups (100-pack)',
      description: '12oz disposable coffee cups',
      unit: 'pack',
      price: 12.99,
      minStock: 15,
      currentStock: 30,
      categoryId: createdCategories[4].id,
      supplierId: createdSuppliers[4].id,
    },
    // Safety Equipment
    {
      reference: 'EXT-001',
      name: 'Fire Extinguisher',
      description: 'ABC dry chemical fire extinguisher, 5lb',
      unit: 'piece',
      price: 45.99,
      minStock: 5,
      currentStock: 8,
      categoryId: createdCategories[5].id, // Safety Equipment
      supplierId: createdSuppliers[2].id,
    },
    {
      reference: 'AID-001',
      name: 'First Aid Kit',
      description: 'Complete first aid kit for office use',
      unit: 'piece',
      price: 29.99,
      minStock: 3,
      currentStock: 6,
      categoryId: createdCategories[5].id,
      supplierId: createdSuppliers[2].id,
    },
  ]

  const createdItems = []
  for (const item of items) {
    const created = await prisma.item.create({ data: item })
    createdItems.push(created)
  }

  // Create sample requests
  const requests = [
    {
      title: 'Office Supplies for Q1',
      description: 'Monthly office supplies request for the development team',
      status: 'PENDING',
      priority: 'MEDIUM',
      requesterId: employeeUser.id, // Employee
      department: 'IT',
    },
    {
      title: 'Cleaning Supplies Restock',
      description: 'Urgent restock of cleaning supplies for the office',
      status: 'APPROVED',
      priority: 'HIGH',
      requesterId: createdEmployees[0].id, // Employee
      department: 'Administration',
    },
    {
      title: 'Technology Equipment Upgrade',
      description: 'New monitors and keyboards for the design team',
      status: 'PENDING',
      priority: 'HIGH',
      requesterId: createdEmployees[1].id, // Employee
      department: 'Design',
    },
    {
      title: 'Kitchen Supplies Monthly Order',
      description: 'Coffee and disposable cups for break room',
      status: 'APPROVED',
      priority: 'LOW',
      requesterId: createdEmployees[2].id, // Employee
      department: 'HR',
    },
    {
      title: 'Safety Equipment Inspection',
      description: 'Replace expired fire extinguishers and first aid kits',
      status: 'REJECTED',
      priority: 'HIGH',
      requesterId: createdEmployees[3].id, // Employee
      department: 'Facilities',
    },
    {
      title: 'Furniture for New Hires',
      description: 'Ergonomic chairs and standing desks for 3 new employees',
      status: 'PENDING',
      priority: 'MEDIUM',
      requesterId: createdEmployees[4].id, // Employee
      department: 'HR',
    },
  ]

  const createdRequests = []
  for (const request of requests) {
    const created = await prisma.request.create({ data: request })
    createdRequests.push(created)
  }

  // Create request items
  const requestItems = [
    // Request 1 items (Office Supplies for Q1)
    { requestId: createdRequests[0].id, itemId: createdItems[0].id, quantity: 5, unitPrice: 12.99, totalPrice: 64.95 }, // Blue Pens
    { requestId: createdRequests[0].id, itemId: createdItems[1].id, quantity: 10, unitPrice: 8.50, totalPrice: 85.00 }, // A4 Paper
    { requestId: createdRequests[0].id, itemId: createdItems[3].id, quantity: 2, unitPrice: 15.99, totalPrice: 31.98 }, // Notebooks
    
    // Request 2 items (Cleaning Supplies Restock)
    { requestId: createdRequests[1].id, itemId: createdItems[9].id, quantity: 3, unitPrice: 6.75, totalPrice: 20.25 }, // All-Purpose Cleaner
    { requestId: createdRequests[1].id, itemId: createdItems[10].id, quantity: 2, unitPrice: 24.99, totalPrice: 49.98 }, // Paper Towels
    { requestId: createdRequests[1].id, itemId: createdItems[11].id, quantity: 1, unitPrice: 18.99, totalPrice: 18.99 }, // Disinfectant Wipes
    
    // Request 3 items (Technology Equipment Upgrade)
    { requestId: createdRequests[2].id, itemId: createdItems[6].id, quantity: 3, unitPrice: 199.99, totalPrice: 599.97 }, // LED Monitors
    { requestId: createdRequests[2].id, itemId: createdItems[7].id, quantity: 3, unitPrice: 45.99, totalPrice: 137.97 }, // Keyboard/Mouse Sets
    
    // Request 4 items (Kitchen Supplies Monthly Order)
    { requestId: createdRequests[3].id, itemId: createdItems[14].id, quantity: 4, unitPrice: 16.99, totalPrice: 67.96 }, // Coffee K-Cups
    { requestId: createdRequests[3].id, itemId: createdItems[15].id, quantity: 2, unitPrice: 12.99, totalPrice: 25.98 }, // Disposable Cups
    
    // Request 5 items (Safety Equipment Inspection)
    { requestId: createdRequests[4].id, itemId: createdItems[16].id, quantity: 2, unitPrice: 45.99, totalPrice: 91.98 }, // Fire Extinguisher
    { requestId: createdRequests[4].id, itemId: createdItems[17].id, quantity: 1, unitPrice: 29.99, totalPrice: 29.99 }, // First Aid Kit
    
    // Request 6 items (Furniture for New Hires)
    { requestId: createdRequests[5].id, itemId: createdItems[12].id, quantity: 3, unitPrice: 299.99, totalPrice: 899.97 }, // Office Chairs
    { requestId: createdRequests[5].id, itemId: createdItems[13].id, quantity: 3, unitPrice: 199.99, totalPrice: 599.97 }, // Standing Desks
  ]

  for (const requestItem of requestItems) {
    await prisma.requestItem.create({
      data: {
        requestId: requestItem.requestId,
        itemId: requestItem.itemId,
        quantity: requestItem.quantity,
        unitPrice: requestItem.unitPrice,
        totalPrice: requestItem.totalPrice
      }
    })
  }

  // Create approvals
  const approvals = [
    {
      requestId: createdRequests[1].id, // Approved cleaning supplies request
      approverId: managerUser.id, // Manager - Fixed field name from approvedBy to approverId
      status: 'APPROVED',
      level: 1,
      comments: 'Approved for immediate procurement due to urgent need',
    },
    {
      requestId: createdRequests[3].id, // Approved kitchen supplies request
      approverId: managerUser.id, // Manager - Fixed field name from approvedBy to approverId
      status: 'APPROVED',
      level: 1,
      comments: 'Standard monthly order approved',
    },
    {
      requestId: createdRequests[4].id, // Rejected safety equipment request
      approverId: adminUser.id, // Admin - Fixed field name from approvedBy to approverId
      status: 'REJECTED',
      level: 2,
      comments: 'Budget constraints - please resubmit next quarter',
    },
  ]

  for (const approval of approvals) {
    await prisma.approval.create({ data: approval })
  }

  // Create stock movements
  const stockMovements = [
    {
      itemId: createdItems[9].id, // All-Purpose Cleaner
      type: 'OUT',
      quantity: 7,
      reason: 'Approved request fulfillment',
      userId: managerUser.id, // Manager
    },
    {
      itemId: createdItems[1].id, // A4 Paper
      type: 'IN',
      quantity: 50,
      reason: 'New stock delivery',
      userId: adminUser.id, // Admin
    },
    {
      itemId: createdItems[5].id, // Toner Cartridge
      type: 'OUT',
      quantity: 2,
      reason: 'Printer maintenance',
      userId: employeeUser.id, // Employee
    },
  ]

  for (const movement of stockMovements) {
    await prisma.stockMovement.create({ data: movement })
  }

  console.log('✅ Database seeded successfully!')
  console.log('Demo users created:')
  console.log('- Admin: admin@example.com / admin123')
  console.log('- Manager: manager@example.com / manager123')
  console.log('- Employee: employee@example.com / employee123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })