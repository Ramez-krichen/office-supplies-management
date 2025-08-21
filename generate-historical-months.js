const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomAmount(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

async function generateHistoricalMonths() {
  try {
    console.log('🗓️ Generating historical data for past 6 months...\n');

    // Get existing data
    const users = await prisma.user.findMany();
    const departments = await prisma.department.findMany();
    const items = await prisma.item.findMany();
    const suppliers = await prisma.supplier.findMany();

    console.log(`Found ${users.length} users, ${departments.length} departments, ${items.length} items, ${suppliers.length} suppliers`);

    if (items.length === 0 || suppliers.length === 0) {
      console.log('❌ Need items and suppliers first.');
      return;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const statuses = ['APPROVED', 'COMPLETED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED'];

    // Generate data for past 6 months (excluding current month)
    for (let monthsBack = 1; monthsBack <= 6; monthsBack++) {
      const targetMonth = currentMonth - monthsBack;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth;

      const monthStart = new Date(targetYear, adjustedMonth, 1);
      const monthEnd = new Date(targetYear, adjustedMonth + 1, 0);
      const monthName = monthStart.toLocaleString('default', { month: 'long' });

      console.log(`📊 Generating data for ${monthName} ${targetYear}...`);

      // Check existing data for this month
      const existingRequests = await prisma.request.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      });

      const existingPOs = await prisma.purchaseOrder.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      });

      console.log(`  Found ${existingRequests} existing requests and ${existingPOs} existing POs`);

      // Generate requests for this month
      const targetRequests = 60 + Math.floor(Math.random() * 40); // 60-100 requests
      const additionalRequests = Math.max(0, targetRequests - existingRequests);

      for (let i = 0; i < additionalRequests; i++) {
        const randomUser = getRandomElement(users);
        const userDept = departments.find(d => d.id === randomUser.departmentId) || getRandomElement(departments);
        const status = getRandomElement(statuses);
        const priority = getRandomElement(priorities);
        
        const requestDate = randomDate(monthStart, monthEnd);

        const request = await prisma.request.create({
          data: {
            title: `${userDept.name} ${monthName} Request ${existingRequests + i + 1}`,
            description: `${monthName} procurement for ${userDept.name} department`,
            priority: priority,
            status: status,
            requesterId: randomUser.id,
            department: userDept.name,
            totalAmount: 0,
            createdAt: requestDate,
            updatedAt: requestDate
          }
        });

        // Add items to request
        const itemsCount = Math.floor(Math.random() * 4) + 2; // 2-5 items
        const selectedItems = getRandomElements(items, itemsCount);
        let totalAmount = 0;

        for (const selectedItem of selectedItems) {
          const quantity = Math.floor(Math.random() * 6) + 1;
          const unitPrice = randomAmount(selectedItem.price * 0.9, selectedItem.price * 1.1);
          const itemTotal = quantity * unitPrice;
          totalAmount += itemTotal;

          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: selectedItem.id,
              quantity,
              unitPrice,
              totalPrice: itemTotal,
              notes: `${monthName} procurement - ${userDept.name}`
            }
          });
        }

        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount }
        });
      }

      // Generate purchase orders for this month
      const targetPOs = 25 + Math.floor(Math.random() * 20); // 25-45 POs
      const additionalPOs = Math.max(0, targetPOs - existingPOs);

      // Get the highest existing order number to avoid conflicts
      const lastPO = await prisma.purchaseOrder.findFirst({
        where: {
          orderNumber: {
            startsWith: `PO-${targetYear}-${String(adjustedMonth + 1).padStart(2, '0')}-`
          }
        },
        orderBy: { orderNumber: 'desc' }
      });

      let startingNumber = 1;
      if (lastPO) {
        const lastNumber = parseInt(lastPO.orderNumber.split('-').pop());
        startingNumber = lastNumber + 1;
      }

      for (let i = 0; i < additionalPOs; i++) {
        const randomUser = getRandomElement(users);
        const randomSupplier = getRandomElement(suppliers);
        const status = getRandomElement(poStatuses);
        
        const orderDate = randomDate(monthStart, monthEnd);
        const totalAmount = randomAmount(800, 5000); // Slightly lower amounts for historical data

        const orderNumber = `PO-${targetYear}-${String(adjustedMonth + 1).padStart(2, '0')}-${String(startingNumber + i).padStart(3, '0')}`;

        const po = await prisma.purchaseOrder.create({
          data: {
            orderNumber,
            supplierId: randomSupplier.id,
            status: status,
            totalAmount,
            orderDate,
            createdById: randomUser.id,
            createdAt: orderDate,
            updatedAt: orderDate
          }
        });

        // Add items to purchase order
        const poItemsCount = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const selectedItems = getRandomElements(items, poItemsCount);
        
        for (const selectedItem of selectedItems) {
          const quantity = Math.floor(Math.random() * 8) + 1;
          const unitPrice = randomAmount(selectedItem.price * 0.85, selectedItem.price * 1.15);
          const itemTotal = quantity * unitPrice;

          await prisma.orderItem.create({
            data: {
              purchaseOrderId: po.id,
              itemId: selectedItem.id,
              quantity,
              unitPrice,
              totalPrice: itemTotal
            }
          });
        }
      }

      console.log(`  ✅ Generated ${additionalRequests} requests and ${additionalPOs} POs for ${monthName} ${targetYear}`);
    }

    console.log('\n📊 Historical Data Generation Summary:');
    console.log('  ✅ Generated data for past 6 months');
    console.log('  ✅ Created realistic monthly trends for analytics');
    console.log('  ✅ Enhanced Reports & Analytics with historical data');

    console.log('\n🎉 Historical data generation completed successfully!');

  } catch (error) {
    console.error('❌ Error generating historical data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateHistoricalMonths();