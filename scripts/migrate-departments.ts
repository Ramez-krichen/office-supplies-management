import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function migrateDepartments() {
  try {
    console.log('🏗️ Migrating to Department Table System...\n')

    // 1. Create departments based on existing data
    const departmentData = [
      {
        code: 'IT',
        name: 'Information Technology',
        description: 'Manages technology infrastructure, software development, and IT support services',
        budget: 500000
      },
      {
        code: 'HR',
        name: 'Human Resources',
        description: 'Handles recruitment, employee relations, benefits, and organizational development',
        budget: 200000
      },
      {
        code: 'FINANCE',
        name: 'Finance',
        description: 'Manages financial planning, accounting, budgeting, and financial reporting',
        budget: 300000
      },
      {
        code: 'OPS',
        name: 'Operations',
        description: 'Oversees daily business operations, process optimization, and operational efficiency',
        budget: 400000
      },
      {
        code: 'MKT',
        name: 'Marketing',
        description: 'Develops marketing strategies, brand management, and customer acquisition',
        budget: 250000
      },
      {
        code: 'SALES',
        name: 'Sales',
        description: 'Manages sales processes, customer relationships, and revenue generation',
        budget: 350000
      },
      {
        code: 'LEGAL',
        name: 'Legal',
        description: 'Provides legal counsel, contract management, and compliance oversight',
        budget: 150000
      },
      {
        code: 'PROC',
        name: 'Procurement',
        description: 'Manages supplier relationships, purchasing processes, and vendor management',
        budget: 180000
      }
    ]

    console.log('📊 Creating departments...')
    const createdDepartments = []
    
    for (const dept of departmentData) {
      const department = await prisma.department.create({
        data: dept
      })
      createdDepartments.push(department)
      console.log(`   ✅ Created: ${dept.name} (${dept.code})`)
    }

    // 2. Create admin user first
    console.log('\n👤 Creating admin user...')
    const adminPassword = await bcrypt.hash('admin123', 12)
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Main Admin',
        password: adminPassword,
        role: 'ADMIN',
        department: 'IT', // Keep for backward compatibility
        departmentId: createdDepartments.find(d => d.code === 'IT')?.id,
        status: 'ACTIVE'
      }
    })
    console.log(`   ✅ Created admin: ${adminUser.email}`)

    // 3. Assign department managers
    console.log('\n👥 Creating department managers...')
    const managerData = [
      { dept: 'IT', name: 'John Smith', email: 'john.smith@company.com' },
      { dept: 'HR', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
      { dept: 'FINANCE', name: 'Michael Brown', email: 'michael.brown@company.com' },
      { dept: 'OPS', name: 'Emily Davis', email: 'emily.davis@company.com' },
      { dept: 'MKT', name: 'David Wilson', email: 'david.wilson@company.com' },
      { dept: 'SALES', name: 'Lisa Anderson', email: 'lisa.anderson@company.com' },
      { dept: 'LEGAL', name: 'Robert Taylor', email: 'robert.taylor@company.com' },
      { dept: 'PROC', name: 'Jennifer White', email: 'jennifer.white@company.com' }
    ]

    const managers = []
    for (const mgr of managerData) {
      const department = createdDepartments.find(d => d.code === mgr.dept)
      if (department) {
        const manager = await prisma.user.create({
          data: {
            email: mgr.email,
            name: mgr.name,
            password: await bcrypt.hash('manager123', 12),
            role: 'MANAGER',
            department: department.name,
            departmentId: department.id,
            status: 'ACTIVE'
          }
        })
        managers.push(manager)
        
        // Update department with manager
        await prisma.department.update({
          where: { id: department.id },
          data: { managerId: manager.id }
        })
        
        console.log(`   ✅ Created manager: ${mgr.name} for ${department.name}`)
      }
    }

    // 4. Create some employees for each department
    console.log('\n👨‍💼 Creating employees...')
    const employeeCount = 5 // 5 employees per department
    
    for (const dept of createdDepartments) {
      for (let i = 1; i <= employeeCount; i++) {
        await prisma.user.create({
          data: {
            email: `employee.${dept.code.toLowerCase()}.${i}@company.com`,
            name: `Employee ${dept.code} ${i}`,
            password: await bcrypt.hash('employee123', 12),
            role: 'EMPLOYEE',
            department: dept.name,
            departmentId: dept.id,
            status: 'ACTIVE'
          }
        })
      }
      console.log(`   ✅ Created ${employeeCount} employees for ${dept.name}`)
    }

    // 5. Create suppliers first
    console.log('\n🏢 Creating suppliers...')

    const suppliers = [
      { name: 'TechCorp Solutions', email: 'orders@techcorp.com', phone: '+1-555-0101', address: '123 Tech Street, Silicon Valley, CA' },
      { name: 'Office Depot Pro', email: 'business@officedepot.com', phone: '+1-555-0102', address: '456 Business Ave, New York, NY' },
      { name: 'Furniture Plus', email: 'sales@furnitureplus.com', phone: '+1-555-0103', address: '789 Furniture Blvd, Chicago, IL' },
      { name: 'CleanCo Supplies', email: 'orders@cleanco.com', phone: '+1-555-0104', address: '321 Clean Street, Miami, FL' }
    ]

    const createdSuppliers = []
    for (const supplier of suppliers) {
      const createdSupplier = await prisma.supplier.create({ data: supplier })
      createdSuppliers.push(createdSupplier)
      console.log(`   ✅ Created supplier: ${supplier.name}`)
    }

    // 6. Create categories
    console.log('\n📦 Creating categories...')

    const categories = [
      { name: 'Office Supplies', description: 'Basic office supplies and stationery' },
      { name: 'Technology', description: 'Computer equipment and software' },
      { name: 'Furniture', description: 'Office furniture and fixtures' },
      { name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' }
    ]

    const createdCategories = []
    for (const cat of categories) {
      const category = await prisma.category.create({ data: cat })
      createdCategories.push(category)
      console.log(`   ✅ Created category: ${cat.name}`)
    }

    // 7. Create some basic items
    console.log('\n📦 Creating basic items...')
    const items = [
      { reference: 'LAP001', name: 'Laptop Computer', price: 1200, categoryId: createdCategories[1].id, supplierId: createdSuppliers[0].id, unit: 'piece', currentStock: 10, minStock: 2 },
      { reference: 'CHR001', name: 'Office Chair', price: 250, categoryId: createdCategories[2].id, supplierId: createdSuppliers[2].id, unit: 'piece', currentStock: 15, minStock: 3 },
      { reference: 'PAP001', name: 'Printer Paper', price: 25, categoryId: createdCategories[0].id, supplierId: createdSuppliers[1].id, unit: 'ream', currentStock: 50, minStock: 10 },
      { reference: 'CLN001', name: 'Cleaning Spray', price: 8, categoryId: createdCategories[3].id, supplierId: createdSuppliers[3].id, unit: 'bottle', currentStock: 20, minStock: 5 }
    ]

    for (const item of items) {
      await prisma.item.create({ data: item })
      console.log(`   ✅ Created item: ${item.name}`)
    }

    // 8. Summary
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Departments: ${createdDepartments.length}`)
    console.log(`   ✅ Managers: ${managers.length}`)
    console.log(`   ✅ Employees: ${createdDepartments.length * employeeCount}`)
    console.log(`   ✅ Categories: ${createdCategories.length}`)
    console.log(`   ✅ Items: ${items.length}`)
    console.log(`   ✅ Admin: 1`)

    console.log('\n🎉 Department migration completed successfully!')

  } catch (error) {
    console.error('❌ Error during migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateDepartments()
