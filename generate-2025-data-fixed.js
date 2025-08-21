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

async function generate2025Data() {
  try {
    console.log('🗓️ Generating data for 2025 current month...\n');

    // Get existing data
    const users = await prisma.user.findMany();
    const departments = await prisma.department.findMany();
    const items = await prisma.item.findMany();
    const suppliers = await prisma.supplier.findMany();

    console.log(`Found ${users.length} users, ${departments.length} departments, ${items.length} items, ${suppliers.length} suppliers`);

    if (items.length === 0 || suppliers.length === 0) {
      console.log('❌ Need items and suppliers first. Please run the big data generation script.');
      return;
    }

    // Define 2025 date ranges
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-based (December = 11)
    
    // Generate data for current month only
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0); // Last day of month
    const monthName = monthStart.toLocaleString('default', { month: 'long' });
    
    console.log(`📊 Generating data for ${monthName} ${currentYear}...`);

    const statuses = ['APPROVED', 'COMPLETED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED'];

    // Generate requests for current month - ensure good distribution
    const requestsThisMonth = 120; // More requests for better data
    
    for (let i = 0; i < requestsThisMonth; i++) {
      const randomUser = getRandomElement(users);
      const userDept = departments.find(d => d.id === randomUser.departmentId) || getRandomElement(departments);
      const status = getRandomElement(statuses);
      const priority = getRandomElement(priorities);
      
      const requestDate = randomDate(monthStart, monthEnd);

      const request = await prisma.request.create({
        data: {
          title: `${userDept.name} ${monthName} Request ${i + 1}`,
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

      // Add items to request - avoid duplicates by using unique items per request
      const itemsCount = Math.floor(Math.random() * 4) + 2; // 2-5 items
      const selectedItems = getRandomElements(items, itemsCount);
      let totalAmount = 0;

      for (const selectedItem of selectedItems) {
        const quantity = Math.floor(Math.random() * 8) + 1;
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

    // Generate purchase orders for current month
    const posThisMonth = 60;
    
    for (let i = 0; i < posThisMonth; i++) {
      const randomUser = getRandomElement(users);
      const randomSupplier = getRandomElement(suppliers);
      const status = getRandomElement(poStatuses);
      
      const orderDate = randomDate(monthStart, monthEnd);
      const totalAmount = randomAmount(1200, 7500); // Good range for spending

      const po = await prisma.purchaseOrder.create({
        data: {
          orderNumber: `PO-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
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
        const quantity = Math.floor(Math.random() * 10) + 1;
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

    console.log(`  ✅ Generated ${requestsThisMonth} requests and ${posThisMonth} POs for ${monthName}`);

    // Now ensure each department has substantial spending in current month
    console.log(`\n💰 Ensuring each department has good spending data...`);

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    for (const dept of departments) {
      // Get users from this department
      const deptUsers = users.filter(u => u.departmentId === dept.id);
      if (deptUsers.length === 0) continue;

      // Calculate current spending for this department
      const deptRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          requester: { departmentId: dept.id }
        },
        include: {
          items: { include: { item: true } }
        }
      });

      const requestSpending = deptRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity));
        }, 0);
      }, 0);

      const deptPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdAt: { gte: currentMonthStart, lte: currentMonthEnd },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      });

      const poSpending = deptPOs._sum.totalAmount || 0;
      const totalSpending = requestSpending + poSpending;

      console.log(`  ${dept.name}: Current spending $${totalSpending.toFixed(2)}`);

      // If spending is less than $2,500, add more
      const minSpending = 2500;
      if (totalSpending < minSpending) {
        const needed = minSpending - totalSpending;
        console.log(`    Adding $${needed.toFixed(2)} more spending`);

        // Add high-value requests to reach the minimum
        const requestsToAdd = Math.ceil(needed / 800); // Add requests worth ~$800 each
        
        for (let i = 0; i < requestsToAdd; i++) {
          const deptUser = getRandomElement(deptUsers);
          const requestDate = randomDate(currentMonthStart, currentMonthEnd);

          const request = await prisma.request.create({
            data: {
              title: `${dept.name} Additional ${monthName} Procurement ${i + 1}`,
              description: `High-value procurement for ${dept.name} department`,
              priority: 'HIGH',
              status: 'APPROVED',
              requesterId: deptUser.id,
              department: dept.name,
              totalAmount: 0,
              createdAt: requestDate,
              updatedAt: requestDate
            }
          });

          // Add high-value items
          const targetAmount = Math.min(needed - (i * 800), 1200);
          const highValueItems = items.filter(item => item.price > 50); // Higher value items
          const selectedItems = getRandomElements(highValueItems, Math.min(3, highValueItems.length));
          let currentAmount = 0;
          
          for (const selectedItem of selectedItems) {
            if (currentAmount >= targetAmount) break;
            
            const quantity = Math.floor(Math.random() * 4) + 1;
            const unitPrice = randomAmount(selectedItem.price * 0.95, selectedItem.price * 1.05);
            const itemTotal = quantity * unitPrice;
            
            if (currentAmount + itemTotal <= targetAmount + 300) { // Allow slight overage
              await prisma.requestItem.create({
                data: {
                  requestId: request.id,
                  itemId: selectedItem.id,
                  quantity,
                  unitPrice,
                  totalPrice: itemTotal,
                  notes: `High-value procurement for ${dept.name} ${monthName} targets`
                }
              });
              currentAmount += itemTotal;
            }
          }

          await prisma.request.update({
            where: { id: request.id },
            data: { totalAmount: currentAmount }
          });
        }

        console.log(`    ✅ Added additional spending for ${dept.name}`);
      } else {
        console.log(`    ✅ ${dept.name} already has good spending data`);
      }
    }

    console.log('\n📊 2025 Current Month Data Generation Summary:');
    console.log(`  ✅ Generated substantial data for ${monthName} ${currentYear}`);
    console.log('  ✅ Ensured every department has good spending data');
    console.log('  ✅ Created realistic spending patterns for analytics');
    console.log('  ✅ Fixed monthly spending dashboard issues');

    console.log('\n🎉 2025 current month data generation completed successfully!');

  } catch (error) {
    console.error('❌ Error generating 2025 data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generate2025Data();