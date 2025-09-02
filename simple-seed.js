const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      department: null
    }
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create some departments
  console.log('Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Administration',
        code: 'ADMIN',
        description: 'Administrative department',
        budget: 50000,
        managerId: adminUser.id
      }
    }),
    prisma.department.create({
      data: {
        name: 'IT',
        code: 'IT',
        description: 'Information Technology department',
        budget: 75000
      }
    }),
    prisma.department.create({
      data: {
        name: 'Operations',
        code: 'OPS',
        description: 'Operations department', 
        budget: 60000
      }
    })
  ]);
  console.log('✅ Departments created:', departments.length);

  // Create some categories
  console.log('Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Office Supplies',
        description: 'General office supplies and stationery'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Technology',
        description: 'Computers, software, and IT equipment'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Furniture',
        description: 'Office furniture and equipment'
      }
    })
  ]);
  console.log('✅ Categories created:', categories.length);

  // Create some suppliers
  console.log('Creating suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Office Depot',
        email: 'orders@officedepot.com',
        phone: '+1-555-0101',
        address: '123 Business Ave, Commerce City, CC 12345',
        contactPerson: 'John Smith',
        contactTitle: 'Sales Manager',
        website: 'https://www.officedepot.com',
        status: 'ACTIVE'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Tech Solutions Inc',
        email: 'sales@techsolutions.com', 
        phone: '+1-555-0202',
        address: '456 Technology Blvd, Tech Park, TP 67890',
        contactPerson: 'Sarah Johnson',
        contactTitle: 'Account Executive',
        website: 'https://www.techsolutions.com',
        status: 'ACTIVE'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Furniture Plus',
        email: 'info@furnitureplus.com',
        phone: '+1-555-0303',
        address: '789 Furniture Way, Design District, DD 11111',
        contactPerson: 'Mike Wilson',
        contactTitle: 'Sales Director',
        website: 'https://www.furnitureplus.com',
        status: 'ACTIVE'
      }
    })
  ]);
  console.log('✅ Suppliers created:', suppliers.length);

  // Create some basic items
  console.log('Creating items...');
  const items = await Promise.all([
    prisma.item.create({
      data: {
        name: 'Ballpoint Pens (Pack of 12)',
        description: 'Blue ballpoint pens, smooth writing',
        categoryId: categories[0].id,
        supplierId: suppliers[0].id,
        unitPrice: 8.99,
        stockQuantity: 100,
        reorderLevel: 20,
        unit: 'pack'
      }
    }),
    prisma.item.create({
      data: {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        categoryId: categories[1].id,
        supplierId: suppliers[1].id,
        unitPrice: 29.99,
        stockQuantity: 50,
        reorderLevel: 10,
        unit: 'each'
      }
    }),
    prisma.item.create({
      data: {
        name: 'Office Chair',
        description: 'Ergonomic office chair with lumbar support',
        categoryId: categories[2].id,
        supplierId: suppliers[2].id,
        unitPrice: 199.99,
        stockQuantity: 15,
        reorderLevel: 5,
        unit: 'each'
      }
    })
  ]);
  console.log('✅ Items created:', items.length);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Email: admin@company.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });