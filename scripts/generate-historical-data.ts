import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { subYears, startOfMonth, endOfMonth, addDays } from 'date-fns';

const prisma = new PrismaClient();

// Department names for realistic data
const DEPARTMENTS = [
  'IT', 'Finance', 'Marketing', 'Sales', 'HR', 'Operations', 
  'Legal', 'R&D', 'Customer Service', 'Facilities', 'Procurement'
];

// Item categories
const CATEGORIES = [
  { name: 'Office Supplies', description: 'General office supplies and stationery' },
  { name: 'Technology', description: 'Computer and technology equipment' },
  { name: 'Cleaning Supplies', description: 'Cleaning and maintenance supplies' },
  { name: 'Furniture', description: 'Office furniture and ergonomic equipment' },
  { name: 'Kitchen Supplies', description: 'Break room and kitchen supplies' },
  { name: 'Safety Equipment', description: 'Safety and security equipment' },
  { name: 'Printing', description: 'Printing and copying supplies' },
  { name: 'Breakroom', description: 'Breakroom and pantry supplies' }
];

// Supplier names
const SUPPLIERS = [
  { name: 'Office Depot', contactPerson: 'John Smith', email: 'orders@officedepot.com' },
  { name: 'Staples Inc.', contactPerson: 'Jane Doe', email: 'business@staples.com' },
  { name: 'Best Buy Business', contactPerson: 'Michael Chen', email: 'corporate@bestbuy.com' },
  { name: 'Amazon Business', contactPerson: 'Sarah Johnson', email: 'b2b@amazon.com' },
  { name: 'Costco Business Center', contactPerson: 'Robert Martinez', email: 'business@costco.com' },
  { name: 'Walmart Business', contactPerson: 'Lisa Anderson', email: 'business@walmart.com' },
  { name: 'Target Business', contactPerson: 'David Wilson', email: 'b2b@target.com' }
];

// Item names by category
const ITEMS_BY_CATEGORY: Record<string, { name: string; unit: string }[]> = {
  'Office Supplies': [
    { name: 'Ballpoint Pens (Pack of 10)', unit: 'pack' },
    { name: 'A4 Copy Paper (500 sheets)', unit: 'ream' },
    { name: 'Stapler', unit: 'piece' },
    { name: 'Spiral Notebooks (Pack of 5)', unit: 'pack' },
    { name: 'File Folders (Pack of 25)', unit: 'pack' },
    { name: 'Paper Clips (Box of 100)', unit: 'box' },
    { name: 'Sticky Notes (Pack of 6)', unit: 'pack' },
    { name: 'Highlighters (Set of 4)', unit: 'set' }
  ],
  'Technology': [
    { name: 'LaserJet Toner Cartridge', unit: 'piece' },
    { name: 'LED Monitor', unit: 'piece' },
    { name: 'Wireless Keyboard and Mouse Set', unit: 'set' },
    { name: 'USB-C Charging Cable (6ft)', unit: 'piece' },
    { name: 'External Hard Drive (1TB)', unit: 'piece' },
    { name: 'Wireless Mouse', unit: 'piece' },
    { name: 'USB Flash Drive (32GB)', unit: 'piece' },
    { name: 'Laptop Stand', unit: 'piece' }
  ],
  'Cleaning Supplies': [
    { name: 'All-Purpose Cleaner', unit: 'bottle' },
    { name: 'Paper Towels (12-pack)', unit: 'pack' },
    { name: 'Disinfectant Wipes (6-pack)', unit: 'pack' },
    { name: 'Glass Cleaner', unit: 'bottle' },
    { name: 'Bathroom Cleaner', unit: 'bottle' },
    { name: 'Floor Cleaner', unit: 'bottle' },
    { name: 'Trash Bags (50-count)', unit: 'pack' },
    { name: 'Hand Sanitizer (1L)', unit: 'bottle' }
  ],
  'Furniture': [
    { name: 'Ergonomic Office Chair', unit: 'piece' },
    { name: 'Standing Desk Converter', unit: 'piece' },
    { name: 'Desk Lamp', unit: 'piece' },
    { name: 'Bookshelf', unit: 'piece' },
    { name: 'Filing Cabinet', unit: 'piece' },
    { name: 'Office Desk', unit: 'piece' },
    { name: 'Conference Table', unit: 'piece' },
    { name: 'Reception Desk', unit: 'piece' }
  ],
  'Kitchen Supplies': [
    { name: 'Coffee K-Cups (24-pack)', unit: 'pack' },
    { name: 'Disposable Cups (100-pack)', unit: 'pack' },
    { name: 'Paper Plates (150-count)', unit: 'pack' },
    { name: 'Plastic Cutlery (50-set)', unit: 'set' },
    { name: 'Napkins (200-count)', unit: 'pack' },
    { name: 'Coffee Filters (100-count)', unit: 'pack' },
    { name: 'Sugar Packets (200-count)', unit: 'pack' },
    { name: 'Creamer (Box of 50)', unit: 'box' }
  ],
  'Safety Equipment': [
    { name: 'Fire Extinguisher', unit: 'piece' },
    { name: 'First Aid Kit', unit: 'piece' },
    { name: 'Smoke Detector', unit: 'piece' },
    { name: 'Emergency Light', unit: 'piece' },
    { name: 'Safety Goggles', unit: 'pair' },
    { name: 'Hard Hat', unit: 'piece' },
    { name: 'Safety Vest', unit: 'piece' },
    { name: 'Fire Blanket', unit: 'piece' }
  ],
  'Printing': [
    { name: 'Ink Cartridge (Black)', unit: 'piece' },
    { name: 'Ink Cartridge (Color)', unit: 'piece' },
    { name: 'Printer Drum Unit', unit: 'piece' },
    { name: 'Fax Paper (500 sheets)', unit: 'ream' },
    { name: 'Carbon Paper (50 sheets)', unit: 'pack' },
    { name: 'Labels (300-count)', unit: 'pack' },
    { name: 'Envelopes (100-count)', unit: 'pack' },
    { name: 'Business Cards (500-count)', unit: 'pack' }
  ],
  'Breakroom': [
    { name: 'Microwave', unit: 'piece' },
    { name: 'Refrigerator', unit: 'piece' },
    { name: 'Water Cooler', unit: 'piece' },
    { name: 'Vending Machine', unit: 'piece' },
    { name: 'Coffee Machine', unit: 'piece' },
    { name: 'Dishwasher', unit: 'piece' },
    { name: 'Trash Can', unit: 'piece' },
    { name: 'Recycling Bin', unit: 'piece' }
  ]
};

async function main() {
  console.log('🌱 Generating 10 years of historical data...');
  
  // Clear existing data (optional - uncomment if you want to start fresh)
  // await prisma.requestItem.deleteMany();
  // await prisma.request.deleteMany();
  // await prisma.approval.deleteMany();
  // await prisma.stockMovement.deleteMany();
  // await prisma.orderItem.deleteMany();
  // await prisma.purchaseOrder.deleteMany();
  // await prisma.item.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.supplier.deleteMany();
  // await prisma.user.deleteMany();
  
  // Create users if they don't exist
  const existingUsers = await prisma.user.findMany();
  let adminUser, managerUsers: any[] = [], employeeUsers: any[] = [];
  
  if (existingUsers.length === 0) {
    console.log('Creating users...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Main Admin',
        password: adminPassword,
        role: 'ADMIN',
        department: 'IT',
      },
    });
    
    // Create manager users
    const managerPassword = await bcrypt.hash('manager123', 12);
    for (let i = 0; i < 5; i++) {
      const manager = await prisma.user.create({
        data: {
          email: `manager${i + 1}@example.com`,
          name: faker.person.fullName(),
          password: managerPassword,
          role: 'MANAGER',
          department: faker.helpers.arrayElement(DEPARTMENTS),
        },
      });
      managerUsers.push(manager);
    }
    
    // Create employee users
    const employeePassword = await bcrypt.hash('employee123', 12);
    for (let i = 0; i < 50; i++) {
      const employee = await prisma.user.create({
        data: {
          email: `employee${i + 1}@example.com`,
          name: faker.person.fullName(),
          password: employeePassword,
          role: 'EMPLOYEE',
          department: faker.helpers.arrayElement(DEPARTMENTS),
        },
      });
      employeeUsers.push(employee);
    }
  } else {
    adminUser = existingUsers.find(u => u.role === 'ADMIN') || existingUsers[0];
    managerUsers = existingUsers.filter(u => u.role === 'MANAGER');
    employeeUsers = existingUsers.filter(u => u.role === 'EMPLOYEE');
  }
  
  // Create categories if they don't exist
  const existingCategories = await prisma.category.findMany();
  let categories: any[] = [];
  
  if (existingCategories.length === 0) {
    console.log('Creating categories...');
    for (const categoryData of CATEGORIES) {
      const category = await prisma.category.create({
        data: categoryData
      });
      categories.push(category);
    }
  } else {
    categories = existingCategories;
  }
  
  // Create suppliers if they don't exist
  const existingSuppliers = await prisma.supplier.findMany();
  let suppliers: any[] = [];
  
  if (existingSuppliers.length === 0) {
    console.log('Creating suppliers...');
    for (const supplierData of SUPPLIERS) {
      const supplier = await prisma.supplier.create({
        data: {
          ...supplierData,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
        }
      });
      suppliers.push(supplier);
    }
  } else {
    suppliers = existingSuppliers;
  }
  
  // Create items if they don't exist
  const existingItems = await prisma.item.findMany();
  let items: any[] = [];
  
  if (existingItems.length === 0) {
    console.log('Creating items...');
    for (const category of categories) {
      const categoryItems = ITEMS_BY_CATEGORY[category.name] || [];
      for (const itemData of categoryItems) {
        const item = await prisma.item.create({
          data: {
            reference: `${category.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            name: itemData.name,
            description: `${itemData.name} - ${category.name}`,
            unit: itemData.unit,
            price: parseFloat((Math.random() * 100 + 5).toFixed(2)),
            minStock: Math.floor(Math.random() * 50) + 10,
            currentStock: Math.floor(Math.random() * 200) + 50,
            categoryId: category.id,
            supplierId: faker.helpers.arrayElement(suppliers).id,
            isActive: true,
            isEcoFriendly: Math.random() > 0.7,
            ecoRating: Math.floor(Math.random() * 5) + 1,
            carbonFootprint: parseFloat((Math.random() * 10).toFixed(2)),
            recyclable: Math.random() > 0.5,
          }
        });
        items.push(item);
      }
    }
  } else {
    items = existingItems;
  }
  
  // Generate historical data for the last 10 years
  console.log('Generating historical data for the last 10 years...');
  const currentDate = new Date();
  const tenYearsAgo = subYears(currentDate, 10);
  
  // Generate data year by year
  for (let year = 10; year >= 0; year--) {
    const yearDate = subYears(currentDate, year);
    console.log(`Generating data for ${yearDate.getFullYear()}...`);
    
    // Generate monthly data for the current year and previous years
    for (let month = 0; month < 12; month++) {
      // For the current year, only generate data up to the current month
      if (year === 0 && month > currentDate.getMonth()) {
        break;
      }
      
      const monthDate = new Date(yearDate.getFullYear(), month, 1);
      console.log(`  Generating data for ${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}...`);
      
      // Generate purchase orders (1-3 per month)
      const purchaseOrdersCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < purchaseOrdersCount; i++) {
        const supplier = faker.helpers.arrayElement(suppliers);
        const createdBy = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
        
        // Create purchase order
        const orderNumber = `PO-${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`;
        const orderDate = faker.date.between({
          from: startOfMonth(monthDate),
          to: endOfMonth(monthDate)
        });
        
        const purchaseOrder = await prisma.purchaseOrder.create({
          data: {
            orderNumber,
            supplierId: supplier.id,
            status: faker.helpers.arrayElement(['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']),
            totalAmount: 0,
            orderDate,
            expectedDate: addDays(orderDate, Math.floor(Math.random() * 30) + 1),
            receivedDate: Math.random() > 0.3 ? addDays(orderDate, Math.floor(Math.random() * 45) + 1) : null,
            notes: faker.helpers.arrayElement([
              'Monthly supply order',
              'Quarterly equipment purchase',
              'Emergency restock',
              'Annual budget purchase',
              null
            ]),
            createdById: createdBy.id,
          }
        });
        
        // Add order items (1-10 items per order)
        const itemsCount = Math.floor(Math.random() * 10) + 1;
        let orderTotal = 0;
        
        for (let j = 0; j < itemsCount; j++) {
          const item = faker.helpers.arrayElement(items);
          const quantity = Math.floor(Math.random() * 20) + 1;
          const unitPrice = item.price;
          const totalPrice = quantity * unitPrice;
          orderTotal += totalPrice;
          
          await prisma.orderItem.create({
            data: {
              purchaseOrderId: purchaseOrder.id,
              itemId: item.id,
              quantity,
              unitPrice,
              totalPrice,
              receivedQuantity: Math.random() > 0.2 ? quantity : Math.floor(Math.random() * quantity)
            }
          });
          
          // Create stock movements for received items
          if (Math.random() > 0.5) {
            await prisma.stockMovement.create({
              data: {
                itemId: item.id,
                type: 'IN',
                quantity: quantity,
                reason: 'Purchase order fulfillment',
                reference: orderNumber,
                userId: createdBy.id,
              }
            });
          }
        }
        
        // Update purchase order total
        await prisma.purchaseOrder.update({
          where: { id: purchaseOrder.id },
          data: { totalAmount: orderTotal }
        });
      }
      
      // Generate requests (5-15 per month)
      const requestsCount = Math.floor(Math.random() * 11) + 5;
      for (let i = 0; i < requestsCount; i++) {
        const requester = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
        const requestDate = faker.date.between({
          from: startOfMonth(monthDate),
          to: endOfMonth(monthDate)
        });
        
        const request = await prisma.request.create({
          data: {
            title: faker.helpers.arrayElement([
              'Office supplies needed',
              'Equipment replacement',
              'Monthly restock request',
              'Emergency supply request',
              'Project specific supplies'
            ]),
            description: faker.lorem.sentence(),
            status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED']),
            priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
            requesterId: requester.id,
            department: requester.department || faker.helpers.arrayElement(DEPARTMENTS),
            totalAmount: 0,
            createdAt: requestDate,
          }
        });
        
        // Add request items (1-5 items per request)
        const itemsCount = Math.floor(Math.random() * 5) + 1;
        let requestTotal = 0;
        
        for (let j = 0; j < itemsCount; j++) {
          const item = faker.helpers.arrayElement(items);
          const quantity = Math.floor(Math.random() * 10) + 1;
          const unitPrice = item.price;
          const totalPrice = quantity * unitPrice;
          requestTotal += totalPrice;
          
          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: item.id,
              quantity,
              unitPrice,
              totalPrice,
              notes: Math.random() > 0.7 ? faker.lorem.sentence() : null
            }
          });
        }
        
        // Update request total
        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount: requestTotal }
        });
        
        // Create approvals for approved/rejected requests
        if (request.status === 'APPROVED' || request.status === 'REJECTED') {
          const approver = faker.helpers.arrayElement(managerUsers);
          await prisma.approval.create({
            data: {
              requestId: request.id,
              approverId: approver.id,
              status: request.status,
              comments: faker.helpers.arrayElement([
                'Approved for immediate procurement',
                'Standard monthly order approved',
                'Budget constraints - please resubmit next quarter',
                'Urgent request - approved immediately',
                'Not approved due to budget limitations',
                null
              ]),
              level: 1,
              createdAt: addDays(requestDate, Math.floor(Math.random() * 3) + 1),
            }
          });
        }
      }
      
      // Generate stock movements (10-30 per month)
      const movementsCount = Math.floor(Math.random() * 21) + 10;
      for (let i = 0; i < movementsCount; i++) {
        const item = faker.helpers.arrayElement(items);
        const user = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
        const movementDate = faker.date.between({
          from: startOfMonth(monthDate),
          to: endOfMonth(monthDate)
        });
        
        await prisma.stockMovement.create({
          data: {
            itemId: item.id,
            type: faker.helpers.arrayElement(['IN', 'OUT']),
            quantity: Math.floor(Math.random() * 50) + 1,
            reason: faker.helpers.arrayElement([
              'Approved request fulfillment',
              'New stock delivery',
              'Printer maintenance',
              'Department transfer',
              'Damaged items disposal',
              'Expired items removal',
              'Seasonal adjustment',
              null
            ]),
            reference: faker.helpers.arrayElement([
              `REQ-${Math.floor(Math.random() * 1000)}`,
              `PO-${Math.floor(Math.random() * 1000)}`,
              null
            ]),
            userId: user.id,
            createdAt: movementDate,
          }
        });
      }
    }
  }
  
  console.log('✅ Historical data generation completed successfully!');
  console.log('📊 Summary:');
  console.log(`  - 10 years of data generated`);
  console.log(`  - ${suppliers.length} suppliers`);
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${items.length} items`);
  console.log(`  - ${managerUsers.length} managers`);
  console.log(`  - ${employeeUsers.length} employees`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });