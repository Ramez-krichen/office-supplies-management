import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { 
  subYears, 
  subMonths, 
  subWeeks, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfDay, 
  endOfDay, 
  addDays, 
  addWeeks, 
  addMonths, 
  isSameMonth, 
  isSameYear,
  format
} from 'date-fns';

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

// Seasonal factors for realistic data generation
const SEASONAL_FACTORS: Record<string, number> = {
  '01': 0.8, // January - Low
  '02': 0.7, // February - Low
  '03': 0.9, // March - Medium
  '04': 1.0, // April - Normal
  '05': 1.1, // May - Medium-high
  '06': 1.3, // June - High (summer)
  '07': 1.4, // July - High (summer)
  '08': 1.3, // August - High (summer)
  '09': 1.1, // September - Medium-high
  '10': 1.0, // October - Normal
  '11': 0.9, // November - Medium
  '12': 1.2  // December - High (holiday season)
};

// Department budgets for realistic spending
const DEPARTMENT_BUDGETS: Record<string, number> = {
  'IT': 50000,
  'Finance': 30000,
  'Marketing': 40000,
  'Sales': 35000,
  'HR': 25000,
  'Operations': 45000,
  'Legal': 20000,
  'R&D': 60000,
  'Customer Service': 25000,
  'Facilities': 35000,
  'Procurement': 30000
};

async function main() {
  console.log('🌱 Generating comprehensive data with detailed metrics, trends, and statistical breakdowns...');
  
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
  
  // Generate comprehensive data for the last 10 years
  console.log('Generating comprehensive data for the last 10 years...');
  const currentDate = new Date();
  const tenYearsAgo = subYears(currentDate, 10);
  
  // Track metrics for reporting
  let totalPurchaseOrders = 0;
  let totalRequests = 0;
  let totalStockMovements = 0;
  
  // Generate 10 years of historical data with monthly granularity
  console.log('Generating 10 years of historical data with monthly granularity...');
  for (let year = 10; year >= 0; year--) {
    const yearDate = subYears(currentDate, year);
    console.log(`Generating data for ${yearDate.getFullYear()}...`);
    
    // For each month in the year
    for (let month = 0; month < 12; month++) {
      // For the current year, only generate data up to the current month
      if (year === 0 && month > currentDate.getMonth()) {
        break;
      }
      
      const monthDate = new Date(yearDate.getFullYear(), month, 1);
      const monthKey = String(monthDate.getMonth() + 1).padStart(2, '0');
      const seasonalFactor = SEASONAL_FACTORS[monthKey] || 1.0;
      
      console.log(`  Generating data for ${monthDate.getFullYear()}-${monthKey}...`);
      
      // Generate purchase orders (2-5 per month with seasonal adjustment)
      const purchaseOrdersCount = Math.floor((Math.random() * 4 + 2) * seasonalFactor);
      for (let i = 0; i < purchaseOrdersCount; i++) {
        const supplier = faker.helpers.arrayElement(suppliers);
        const createdBy = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
        
        // Create purchase order
        const orderDate = faker.date.between({
          from: startOfMonth(monthDate),
          to: endOfMonth(monthDate)
        });
        
        // Create purchase order with unique order number
        let orderNumber;
        let purchaseOrder;
        let attempts = 0;
        
        // Try to create a unique order number
        while (attempts < 10) {
          orderNumber = `PO-${monthDate.getFullYear()}-${monthKey}-${String(i + 1).padStart(3, '0')}-${Math.floor(Math.random() * 1000)}`;
          try {
            purchaseOrder = await prisma.purchaseOrder.create({
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
            break;
          } catch (error: any) {
            if (error.code === 'P2002' && attempts < 9) {
              attempts++;
              continue;
            } else {
              throw error;
            }
          }
        }
        
        // If we couldn't create a purchase order after 10 attempts, throw an error
        if (!purchaseOrder) {
          throw new Error(`Could not create purchase order after 10 attempts`);
        }
        
        // Add order items (3-15 items per order)
        const itemsCount = Math.floor(Math.random() * 13) + 3;
        let orderTotal = 0;
        
        for (let j = 0; j < itemsCount; j++) {
          const item = faker.helpers.arrayElement(items);
          const quantity = Math.floor(Math.random() * 30) + 1;
          const unitPrice = item.price;
          const totalPrice = quantity * unitPrice;
          orderTotal += totalPrice;
          
          // Check if this item is already in the order
          const existingOrderItem = await prisma.orderItem.findUnique({
            where: {
              purchaseOrderId_itemId: {
                purchaseOrderId: purchaseOrder.id,
                itemId: item.id
              }
            }
          });
          
          // Only create if it doesn't already exist
          if (!existingOrderItem) {
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
          } else {
            // Update the existing item's quantity and total price
            const newQuantity = existingOrderItem.quantity + quantity;
            const newTotalPrice = existingOrderItem.unitPrice * newQuantity;
            const newReceivedQuantity = existingOrderItem.receivedQuantity + (Math.random() > 0.2 ? quantity : Math.floor(Math.random() * quantity));
            await prisma.orderItem.update({
              where: {
                purchaseOrderId_itemId: {
                  purchaseOrderId: purchaseOrder.id,
                  itemId: item.id
                }
              },
              data: {
                quantity: newQuantity,
                totalPrice: newTotalPrice,
                receivedQuantity: newReceivedQuantity
              }
            });
          }
          
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
                createdAt: orderDate,
              }
            });
          }
        }
        
        // Update purchase order total
        await prisma.purchaseOrder.update({
          where: { id: purchaseOrder.id },
          data: { totalAmount: orderTotal }
        });
        
        totalPurchaseOrders++;
      }
      
      // Generate requests (10-30 per month with seasonal adjustment)
      const requestsCount = Math.floor((Math.random() * 21 + 10) * seasonalFactor);
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
              'Project specific supplies',
              'Department budget allocation',
              'Seasonal supply adjustment'
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
        
        // Add request items (2-10 items per request)
        const itemsCount = Math.floor(Math.random() * 9) + 2;
        let requestTotal = 0;
        
        for (let j = 0; j < itemsCount; j++) {
          const item = faker.helpers.arrayElement(items);
          const quantity = Math.floor(Math.random() * 15) + 1;
          const unitPrice = item.price;
          const totalPrice = quantity * unitPrice;
          requestTotal += totalPrice;
          
          // Check if this item is already in the request
          const existingRequestItem = await prisma.requestItem.findUnique({
            where: {
              requestId_itemId: {
                requestId: request.id,
                itemId: item.id
              }
            }
          });
  
          // Only create if it doesn't already exist
          if (!existingRequestItem) {
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
          } else {
            // Update the existing item's quantity and total price
            const newQuantity = existingRequestItem.quantity + quantity;
            const newTotalPrice = existingRequestItem.unitPrice * newQuantity;
            await prisma.requestItem.update({
              where: {
                requestId_itemId: {
                  requestId: request.id,
                  itemId: item.id
                }
              },
              data: {
                quantity: newQuantity,
                totalPrice: newTotalPrice
              }
            });
          }
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
        
        totalRequests++;
      }
      
      // Generate stock movements (20-50 per month with seasonal adjustment)
      const movementsCount = Math.floor((Math.random() * 31 + 20) * seasonalFactor);
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
            quantity: Math.floor(Math.random() * 60) + 1,
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
        
        totalStockMovements++;
      }
    }
  }
  
  // Generate current year data with weekly granularity
  console.log('Generating current year data with weekly granularity...');
  const currentYear = currentDate.getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  
  // Generate weekly data for each week of the current year
  for (let week = 0; week < 52; week++) {
    const weekDate = addWeeks(yearStart, week);
    
    // Skip future weeks
    if (weekDate > currentDate) {
      break;
    }
    
    console.log(`  Generating weekly data for week of ${format(weekDate, 'yyyy-MM-dd')}...`);
    
    // Generate purchase orders (1-2 per week)
    const purchaseOrdersCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < purchaseOrdersCount; i++) {
      const supplier = faker.helpers.arrayElement(suppliers);
      const createdBy = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
      
      // Create purchase order
      const orderNumber = `PO-${currentYear}-W${String(week + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const orderDate = faker.date.between({
        from: startOfWeek(weekDate),
        to: endOfWeek(weekDate)
      });
      
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: supplier.id,
          status: faker.helpers.arrayElement(['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']),
          totalAmount: 0,
          orderDate,
          expectedDate: addDays(orderDate, Math.floor(Math.random() * 14) + 1),
          receivedDate: Math.random() > 0.5 ? addDays(orderDate, Math.floor(Math.random() * 21) + 1) : null,
          notes: faker.helpers.arrayElement([
            'Weekly supply order',
            'Emergency restock',
            'Project specific purchase',
            null
          ]),
          createdById: createdBy.id,
        }
      });
      
      // Add order items (2-8 items per order)
      const itemsCount = Math.floor(Math.random() * 7) + 2;
      let orderTotal = 0;
      
      for (let j = 0; j < itemsCount; j++) {
        const item = faker.helpers.arrayElement(items);
        const quantity = Math.floor(Math.random() * 20) + 1;
        const unitPrice = item.price;
        const totalPrice = quantity * unitPrice;
        orderTotal += totalPrice;
        
        // Check if this item is already in the order
        const existingOrderItem = await prisma.orderItem.findUnique({
          where: {
            purchaseOrderId_itemId: {
              purchaseOrderId: purchaseOrder.id,
              itemId: item.id
            }
          }
        });
        
        // Only create if it doesn't already exist
        if (!existingOrderItem) {
          await prisma.orderItem.create({
            data: {
              purchaseOrderId: purchaseOrder.id,
              itemId: item.id,
              quantity,
              unitPrice,
              totalPrice,
              receivedQuantity: Math.random() > 0.3 ? quantity : Math.floor(Math.random() * quantity)
            }
          });
        } else {
          // Update the existing item's quantity and total price
          const newQuantity = existingOrderItem.quantity + quantity;
          const newTotalPrice = existingOrderItem.unitPrice * newQuantity;
          const newReceivedQuantity = existingOrderItem.receivedQuantity + (Math.random() > 0.3 ? quantity : Math.floor(Math.random() * quantity));
          await prisma.orderItem.update({
            where: {
              purchaseOrderId_itemId: {
                purchaseOrderId: purchaseOrder.id,
                itemId: item.id
              }
            },
            data: {
              quantity: newQuantity,
              totalPrice: newTotalPrice,
              receivedQuantity: newReceivedQuantity
            }
          });
        }
        
        // Create stock movements for received items
        if (Math.random() > 0.6) {
          await prisma.stockMovement.create({
            data: {
              itemId: item.id,
              type: 'IN',
              quantity: quantity,
              reason: 'Purchase order fulfillment',
              reference: orderNumber,
              userId: createdBy.id,
              createdAt: orderDate,
            }
          });
        }
      }
      
      // Update purchase order total
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { totalAmount: orderTotal }
      });
      
      totalPurchaseOrders++;
    }
    
    // Generate requests (5-15 per week)
    const requestsCount = Math.floor(Math.random() * 11) + 5;
    for (let i = 0; i < requestsCount; i++) {
      const requester = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
      const requestDate = faker.date.between({
        from: startOfWeek(weekDate),
        to: endOfWeek(weekDate)
      });
      
      const request = await prisma.request.create({
        data: {
          title: faker.helpers.arrayElement([
            'Weekly supplies needed',
            'Equipment replacement',
            'Emergency supply request',
            'Project specific supplies',
            'Department budget allocation'
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
            notes: Math.random() > 0.8 ? faker.lorem.sentence() : null
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
              'Weekly order approved',
              'Budget constraints - please resubmit next week',
              'Urgent request - approved immediately',
              null
            ]),
            level: 1,
            createdAt: addDays(requestDate, Math.floor(Math.random() * 2) + 1),
          }
        });
      }
      
      totalRequests++;
    }
    
    // Generate stock movements (10-30 per week)
    const movementsCount = Math.floor(Math.random() * 21) + 10;
    for (let i = 0; i < movementsCount; i++) {
      const item = faker.helpers.arrayElement(items);
      const user = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
      const movementDate = faker.date.between({
        from: startOfWeek(weekDate),
        to: endOfWeek(weekDate)
      });
      
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: faker.helpers.arrayElement(['IN', 'OUT']),
          quantity: Math.floor(Math.random() * 40) + 1,
          reason: faker.helpers.arrayElement([
            'Approved request fulfillment',
            'New stock delivery',
            'Printer maintenance',
            'Department transfer',
            'Damaged items disposal',
            null
          ]),
          reference: faker.helpers.arrayElement([
            `REQ-W${String(week + 1).padStart(2, '0')}-${Math.floor(Math.random() * 100)}`,
            `PO-W${String(week + 1).padStart(2, '0')}-${Math.floor(Math.random() * 100)}`,
            null
          ]),
          userId: user.id,
          createdAt: movementDate,
        }
      });
      
      totalStockMovements++;
    }
  }
  
  // Generate current month data with daily granularity
  console.log('Generating current month data with daily granularity...');
  const currentMonth = currentDate.getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1);
  
  // Generate daily data for each day of the current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    // Skip future days
    if (day > currentDate.getDate()) {
      break;
    }
    
    const dayDate = new Date(currentYear, currentMonth, day);
    console.log(`  Generating daily data for ${format(dayDate, 'yyyy-MM-dd')}...`);
    
    // Generate purchase orders (0-2 per day)
    const purchaseOrdersCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < purchaseOrdersCount; i++) {
      const supplier = faker.helpers.arrayElement(suppliers);
      const createdBy = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
      
      // Create purchase order
      const orderNumber = `PO-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const orderDate = dayDate;
      
      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: supplier.id,
          status: faker.helpers.arrayElement(['DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']),
          totalAmount: 0,
          orderDate,
          expectedDate: addDays(orderDate, Math.floor(Math.random() * 7) + 1),
          receivedDate: Math.random() > 0.7 ? addDays(orderDate, Math.floor(Math.random() * 14) + 1) : null,
          notes: faker.helpers.arrayElement([
            'Daily supply order',
            'Emergency restock',
            'Urgent purchase',
            null
          ]),
          createdById: createdBy.id,
        }
      });
      
      // Add order items (1-4 items per order)
      const itemsCount = Math.floor(Math.random() * 4) + 1;
      let orderTotal = 0;
      
      for (let j = 0; j < itemsCount; j++) {
        const item = faker.helpers.arrayElement(items);
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = item.price;
        const totalPrice = quantity * unitPrice;
        orderTotal += totalPrice;
        
        // Check if this item is already in the order
        const existingOrderItem = await prisma.orderItem.findUnique({
          where: {
            purchaseOrderId_itemId: {
              purchaseOrderId: purchaseOrder.id,
              itemId: item.id
            }
          }
        });
        
        // Only create if it doesn't already exist
        if (!existingOrderItem) {
          await prisma.orderItem.create({
            data: {
              purchaseOrderId: purchaseOrder.id,
              itemId: item.id,
              quantity,
              unitPrice,
              totalPrice,
              receivedQuantity: Math.random() > 0.4 ? quantity : Math.floor(Math.random() * quantity)
            }
          });
        } else {
          // Update the existing item's quantity and total price
          const newQuantity = existingOrderItem.quantity + quantity;
          const newTotalPrice = existingOrderItem.unitPrice * newQuantity;
          const newReceivedQuantity = existingOrderItem.receivedQuantity + (Math.random() > 0.4 ? quantity : Math.floor(Math.random() * quantity));
          await prisma.orderItem.update({
            where: {
              purchaseOrderId_itemId: {
                purchaseOrderId: purchaseOrder.id,
                itemId: item.id
              }
            },
            data: {
              quantity: newQuantity,
              totalPrice: newTotalPrice,
              receivedQuantity: newReceivedQuantity
            }
          });
        }
        
        // Create stock movements for received items
        if (Math.random() > 0.7) {
          await prisma.stockMovement.create({
            data: {
              itemId: item.id,
              type: 'IN',
              quantity: quantity,
              reason: 'Purchase order fulfillment',
              reference: orderNumber,
              userId: createdBy.id,
              createdAt: orderDate,
            }
          });
        }
      }
      
      // Update purchase order total
      await prisma.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: { totalAmount: orderTotal }
      });
      
      totalPurchaseOrders++;
    }
    
    // Generate requests (2-8 per day)
    const requestsCount = Math.floor(Math.random() * 7) + 2;
    for (let i = 0; i < requestsCount; i++) {
      const requester = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
      const requestDate = dayDate;
      
      const request = await prisma.request.create({
        data: {
          title: faker.helpers.arrayElement([
            'Daily supplies needed',
            'Urgent equipment replacement',
            'Emergency supply request',
            'Immediate restock'
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
      
      // Add request items (1-3 items per request)
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      let requestTotal = 0;
      
      for (let j = 0; j < itemsCount; j++) {
        const item = faker.helpers.arrayElement(items);
        const quantity = Math.floor(Math.random() * 5) + 1;
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
            notes: Math.random() > 0.9 ? faker.lorem.sentence() : null
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
              'Daily order approved',
              'Urgent request - approved immediately',
              null
            ]),
            level: 1,
            createdAt: addDays(requestDate, Math.floor(Math.random() * 1) + 1),
          }
        });
      }
      
      totalRequests++;
    }
    
    // Generate stock movements (5-20 per day)
    const movementsCount = Math.floor(Math.random() * 16) + 5;
    for (let i = 0; i < movementsCount; i++) {
      const item = faker.helpers.arrayElement(items);
      const user = faker.helpers.arrayElement([...managerUsers, ...employeeUsers]);
      const movementDate = dayDate;
      
      await prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: faker.helpers.arrayElement(['IN', 'OUT']),
          quantity: Math.floor(Math.random() * 30) + 1,
          reason: faker.helpers.arrayElement([
            'Approved request fulfillment',
            'New stock delivery',
            'Printer maintenance',
            'Department transfer',
            'Damaged items disposal',
            null
          ]),
          reference: faker.helpers.arrayElement([
            `REQ-${currentYear}${String(currentMonth + 1).padStart(2, '0')}${String(day).padStart(2, '0')}-${Math.floor(Math.random() * 100)}`,
            `PO-${currentYear}${String(currentMonth + 1).padStart(2, '0')}${String(day).padStart(2, '0')}-${Math.floor(Math.random() * 100)}`,
            null
          ]),
          userId: user.id,
          createdAt: movementDate,
        }
      });
      
      totalStockMovements++;
    }
  }
  
  console.log('✅ Comprehensive data generation completed successfully!');
  console.log('📊 Summary:');
  console.log(`  - 10 years of historical data generated (monthly granularity)`);
  console.log(`  - Current year data generated (weekly granularity)`);
  console.log(`  - Current month data generated (daily granularity)`);
  console.log(`  - ${totalPurchaseOrders} purchase orders created`);
  console.log(`  - ${totalRequests} requests created`);
  console.log(`  - ${totalStockMovements} stock movements created`);
  console.log(`  - ${suppliers.length} suppliers`);
  console.log(`  - ${categories.length} categories`);
  console.log(`  - ${items.length} items`);
  console.log(`  - ${managerUsers.length} managers`);
  console.log(`  - ${employeeUsers.length} employees`);
  
  // Generate detailed metrics and trends report
  console.log('📈 Generating detailed metrics and trends report...');
  
  // Calculate spending by department
  const departmentSpending: Record<string, number> = {};
  for (const department of DEPARTMENTS) {
    departmentSpending[department] = 0;
  }
  
  // Get all requests with their total amounts
  const allRequests = await prisma.request.findMany({
    select: {
      department: true,
      totalAmount: true,
    }
  });
  
  for (const request of allRequests) {
    if (request.department && request.totalAmount) {
      departmentSpending[request.department] = (departmentSpending[request.department] || 0) + request.totalAmount;
    }
  }
  
  console.log('🏢 Department Spending Summary:');
  for (const [department, spending] of Object.entries(departmentSpending)) {
    console.log(`  - ${department}: $${spending.toFixed(2)}`);
  }
  
  // Calculate item popularity
  const itemPopularity: Record<string, { name: string; count: number; totalSpent: number }> = {};
  
  // Get all request items
  const allRequestItems = await prisma.requestItem.findMany({
    include: {
      item: true
    }
  });
  
  for (const requestItem of allRequestItems) {
    const itemId = requestItem.itemId;
    if (!itemPopularity[itemId]) {
      itemPopularity[itemId] = {
        name: requestItem.item.name,
        count: 0,
        totalSpent: 0
      };
    }
    itemPopularity[itemId].count += requestItem.quantity;
    itemPopularity[itemId].totalSpent += requestItem.totalPrice;
  }
  
  // Sort items by popularity
  const sortedItems = Object.entries(itemPopularity)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10);
  
  console.log('🛍️ Top 10 Most Requested Items:');
  for (const [, data] of sortedItems) {
    console.log(`  - ${data.name}: ${data.count} units requested ($${data.totalSpent.toFixed(2)} total)`);
  }
  
  // Calculate monthly spending trends
  console.log('📈 Monthly Spending Trends (Last 12 Months):');
  const monthlySpending: Record<string, number> = {};
  
  // Get requests from the last 12 months
  const twelveMonthsAgo = subMonths(new Date(), 12);
  const recentRequests = await prisma.request.findMany({
    where: {
      createdAt: {
        gte: twelveMonthsAgo
      }
    },
    select: {
      createdAt: true,
      totalAmount: true,
    }
  });
  
  for (const request of recentRequests) {
    const monthKey = format(request.createdAt, 'yyyy-MM');
    monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + request.totalAmount;
  }
  
  // Sort and display monthly spending
  const sortedMonths = Object.entries(monthlySpending)
    .sort(([a], [b]) => a.localeCompare(b));
  
  for (const [month, spending] of sortedMonths) {
    console.log(`  - ${month}: $${spending.toFixed(2)}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });