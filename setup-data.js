const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupData() {
  try {
    console.log('🚀 Setting up initial data...');

    // 1. Create departments
    console.log('\n📊 Creating departments...');
    const departmentData = [
      { code: 'IT', name: 'Information Technology', description: 'IT support and infrastructure' },
      { code: 'HR', name: 'Human Resources', description: 'Human resources and personnel management' },
      { code: 'FINANCE', name: 'Finance', description: 'Financial planning and accounting' },
      { code: 'OPS', name: 'Operations', description: 'Daily operations and logistics' },
      { code: 'MKT', name: 'Marketing', description: 'Marketing and communications' },
      { code: 'SALES', name: 'Sales', description: 'Sales and customer relations' },
      { code: 'LEGAL', name: 'Legal', description: 'Legal affairs and compliance' },
      { code: 'PROC', name: 'Procurement', description: 'Procurement and vendor management' },
      { code: 'IT_DEV', name: 'Software Development', description: 'Software development and engineering', parentId: null }
    ];

    const createdDepartments = [];
    for (const dept of departmentData) {
      const department = await prisma.department.create({ data: dept });
      createdDepartments.push(department);
      console.log(`   ✅ Created: ${dept.name} (${dept.code})`);
    }

    // 2. Create admin user
    console.log('\n👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Main Admin',
        password: adminPassword,
        role: 'ADMIN',
        department: 'IT',
        departmentId: createdDepartments.find(d => d.code === 'IT')?.id,
        status: 'ACTIVE'
      }
    });
    console.log(`   ✅ Created admin: ${adminUser.name}`);

    // 3. Create managers
    console.log('\n👨‍💼 Creating managers...');
    const managerData = [
      { name: 'Manager 1', email: 'manager.it@company.com', dept: 'IT' },
      { name: 'Manager 2', email: 'manager.hr@company.com', dept: 'HR' },
      { name: 'Manager 3', email: 'manager.finance@company.com', dept: 'FINANCE' },
      { name: 'Manager 4', email: 'manager.ops@company.com', dept: 'OPS' },
      { name: 'Manager 5', email: 'manager.mkt@company.com', dept: 'MKT' }
    ];

    const managers = [];
    for (const mgr of managerData) {
      const department = createdDepartments.find(d => d.code === mgr.dept);
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
        });
        managers.push(manager);
        
        // Update department with manager
        await prisma.department.update({
          where: { id: department.id },
          data: { managerId: manager.id }
        });
        
        console.log(`   ✅ Created manager: ${mgr.name} for ${department.name}`);
      }
    }

    // 4. Create employees
    console.log('\n👨‍💼 Creating employees...');
    const employeeCount = 3; // 3 employees per department
    
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
        });
      }
      console.log(`   ✅ Created ${employeeCount} employees for ${dept.name}`);
    }

    // 5. Create suppliers
    console.log('\n🏢 Creating suppliers...');
    const suppliers = [
      { name: 'TechCorp Solutions', email: 'orders@techcorp.com', phone: '+1-555-0101', address: '123 Tech Street, Silicon Valley, CA' },
      { name: 'Office Depot Pro', email: 'business@officedepot.com', phone: '+1-555-0102', address: '456 Business Ave, New York, NY' },
      { name: 'Furniture Plus', email: 'sales@furnitureplus.com', phone: '+1-555-0103', address: '789 Furniture Blvd, Chicago, IL' },
      { name: 'CleanCo Supplies', email: 'orders@cleanco.com', phone: '+1-555-0104', address: '321 Clean Street, Miami, FL' }
    ];

    const createdSuppliers = [];
    for (const supplier of suppliers) {
      const createdSupplier = await prisma.supplier.create({ data: supplier });
      createdSuppliers.push(createdSupplier);
      console.log(`   ✅ Created supplier: ${supplier.name}`);
    }

    // 6. Create categories
    console.log('\n📦 Creating categories...');
    const categories = [
      { name: 'Office Supplies', description: 'Basic office supplies and stationery' },
      { name: 'Technology', description: 'Computer equipment and software' },
      { name: 'Furniture', description: 'Office furniture and fixtures' },
      { name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' }
    ];

    const createdCategories = [];
    for (const cat of categories) {
      const category = await prisma.category.create({ data: cat });
      createdCategories.push(category);
      console.log(`   ✅ Created category: ${cat.name}`);
    }

    // 7. Create items
    console.log('\n📦 Creating items...');
    const items = [
      { reference: 'LAP001', name: 'Laptop Computer', price: 1200, categoryId: createdCategories[1].id, supplierId: createdSuppliers[0].id, unit: 'piece', currentStock: 10, minStock: 2 },
      { reference: 'CHR001', name: 'Office Chair', price: 250, categoryId: createdCategories[2].id, supplierId: createdSuppliers[2].id, unit: 'piece', currentStock: 15, minStock: 3 },
      { reference: 'PAP001', name: 'Printer Paper', price: 25, categoryId: createdCategories[0].id, supplierId: createdSuppliers[1].id, unit: 'ream', currentStock: 50, minStock: 10 },
      { reference: 'CLN001', name: 'Cleaning Spray', price: 8, categoryId: createdCategories[3].id, supplierId: createdSuppliers[3].id, unit: 'bottle', currentStock: 20, minStock: 5 }
    ];

    for (const item of items) {
      await prisma.item.create({ data: item });
      console.log(`   ✅ Created item: ${item.name}`);
    }

    console.log('\n✅ Setup completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Manager: manager.it@company.com / manager123');
    console.log('Employee: employee.it.1@company.com / employee123');

  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupData();
