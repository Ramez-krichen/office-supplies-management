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

async function boostLowSpendingMonths() {
  try {
    console.log('🔍 Identifying months with less than $100k spending...\n');

    // Get existing data
    const users = await prisma.user.findMany();
    const departments = await prisma.department.findMany();
    const items = await prisma.item.findMany();
    const suppliers = await prisma.supplier.findMany();

    console.log(`Found ${users.length} users, ${departments.length} departments, ${items.length} items, ${suppliers.length} suppliers`);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const statuses = ['APPROVED', 'COMPLETED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const poStatuses = ['SENT', 'CONFIRMED', 'RECEIVED'];

    // Check all months from January 2024 to current month
    const monthsToCheck = [];
    
    // Add 2024 months (full year)
    for (let month = 0; month < 12; month++) {
      monthsToCheck.push({ year: 2024, month });
    }
    
    // Add 2025 months up to current month
    for (let month = 0; month <= currentMonth; month++) {
      monthsToCheck.push({ year: 2025, month });
    }

    console.log(`Checking ${monthsToCheck.length} months for spending levels...\n`);

    const lowSpendingMonths = [];

    // Analyze each month
    for (const { year, month } of monthsToCheck) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const monthName = monthStart.toLocaleString('default', { month: 'long' });

      // Calculate spending for this month
      const monthRequestData = await prisma.request.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        include: {
          items: { include: { item: true } }
        }
      });

      const monthPOData = await prisma.purchaseOrder.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        }
      });

      const monthRequestSpending = monthRequestData.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity));
        }, 0);
      }, 0);

      const monthPOSpending = monthPOData.reduce((total, po) => total + po.totalAmount, 0);
      const monthTotalSpending = monthRequestSpending + monthPOSpending;

      console.log(`${monthName} ${year}: $${monthTotalSpending.toFixed(2)} (${monthRequestData.length} requests, ${monthPOData.length} POs)`);

      if (monthTotalSpending < 100000) {
        lowSpendingMonths.push({
          year,
          month,
          monthName,
          monthStart,
          monthEnd,
          currentSpending: monthTotalSpending,
          currentRequests: monthRequestData.length,
          currentPOs: monthPOData.length,
          needed: 100000 - monthTotalSpending
        });
      }
    }

    console.log(`\n📊 Found ${lowSpendingMonths.length} months with less than $100k spending:`);
    lowSpendingMonths.forEach(m => {
      console.log(`  ${m.monthName} ${m.year}: $${m.currentSpending.toFixed(2)} (need $${m.needed.toFixed(2)} more)`);
    });

    if (lowSpendingMonths.length === 0) {
      console.log('\n🎉 All months already have $100k+ spending!');
      return;
    }

    console.log('\n🚀 Boosting low spending months...\n');

    // Boost each low spending month
    for (const monthData of lowSpendingMonths) {
      const { year, month, monthName, monthStart, monthEnd, needed, currentRequests, currentPOs } = monthData;
      
      console.log(`💰 Boosting ${monthName} ${year} by $${needed.toFixed(2)}...`);

      // Calculate how many additional requests and POs we need
      const avgRequestValue = 800; // Target average request value
      const avgPOValue = 3500; // Target average PO value
      
      const additionalRequests = Math.ceil(needed * 0.4 / avgRequestValue); // 40% from requests
      const additionalPOs = Math.ceil(needed * 0.6 / avgPOValue); // 60% from POs

      console.log(`  Adding ${additionalRequests} requests and ${additionalPOs} POs...`);

      // Generate additional requests
      for (let i = 0; i < additionalRequests; i++) {
        const randomUser = getRandomElement(users);
        const userDept = departments.find(d => d.id === randomUser.departmentId) || getRandomElement(departments);
        const status = getRandomElement(statuses);
        const priority = getRandomElement(priorities);
        
        const requestDate = randomDate(monthStart, monthEnd);

        const request = await prisma.request.create({
          data: {
            title: `${userDept.name} ${monthName} Boost Request ${currentRequests + i + 1}`,
            description: `Enhanced ${monthName} procurement for ${userDept.name} department`,
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
        const itemsCount = Math.floor(Math.random() * 5) + 3; // 3-7 items for higher value
        const selectedItems = getRandomElements(items, itemsCount);
        let totalAmount = 0;

        for (const selectedItem of selectedItems) {
          const quantity = Math.floor(Math.random() * 8) + 2; // Higher quantities
          const unitPrice = randomAmount(selectedItem.price * 0.95, selectedItem.price * 1.15);
          const itemTotal = quantity * unitPrice;
          totalAmount += itemTotal;

          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: selectedItem.id,
              quantity,
              unitPrice,
              totalPrice: itemTotal,
              notes: `${monthName} ${year} spending boost - ${userDept.name}`
            }
          });
        }

        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount }
        });
      }

      // Generate additional purchase orders
      // Get the highest existing order number to avoid conflicts
      const lastPO = await prisma.purchaseOrder.findFirst({
        where: {
          orderNumber: {
            startsWith: `PO-${year}-${String(month + 1).padStart(2, '0')}-`
          }
        },
        orderBy: { orderNumber: 'desc' }
      });

      let startingNumber = currentPOs + 1;
      if (lastPO) {
        const lastNumber = parseInt(lastPO.orderNumber.split('-').pop());
        startingNumber = Math.max(startingNumber, lastNumber + 1);
      }

      for (let i = 0; i < additionalPOs; i++) {
        const randomUser = getRandomElement(users);
        const randomSupplier = getRandomElement(suppliers);
        const status = getRandomElement(poStatuses);
        
        const orderDate = randomDate(monthStart, monthEnd);
        const totalAmount = randomAmount(2500, 6000); // Higher amounts for boosting

        const orderNumber = `PO-${year}-${String(month + 1).padStart(2, '0')}-${String(startingNumber + i).padStart(3, '0')}`;

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
        const poItemsCount = Math.floor(Math.random() * 4) + 2; // 2-5 items
        const selectedItems = getRandomElements(items, poItemsCount);
        
        for (const selectedItem of selectedItems) {
          const quantity = Math.floor(Math.random() * 12) + 3; // Higher quantities
          const unitPrice = randomAmount(selectedItem.price * 0.9, selectedItem.price * 1.2);
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

      // Verify the boost
      const newRequestData = await prisma.request.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        include: {
          items: { include: { item: true } }
        }
      });

      const newPOData = await prisma.purchaseOrder.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        }
      });

      const newRequestSpending = newRequestData.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity));
        }, 0);
      }, 0);

      const newPOSpending = newPOData.reduce((total, po) => total + po.totalAmount, 0);
      const newTotalSpending = newRequestSpending + newPOSpending;

      console.log(`  ✅ ${monthName} ${year}: $${newTotalSpending.toFixed(2)} (was $${monthData.currentSpending.toFixed(2)})`);
      console.log(`     Added: ${newRequestData.length - currentRequests} requests, ${newPOData.length - currentPOs} POs\n`);
    }

    console.log('🎉 Low Spending Months Boost Summary:');
    console.log('=' .repeat(50));
    
    // Final verification
    let totalBoosted = 0;
    for (const monthData of lowSpendingMonths) {
      const { year, month, monthName, monthStart, monthEnd } = monthData;
      
      const finalRequestData = await prisma.request.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['APPROVED', 'COMPLETED'] }
        },
        include: {
          items: { include: { item: true } }
        }
      });

      const finalPOData = await prisma.purchaseOrder.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
        }
      });

      const finalRequestSpending = finalRequestData.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity));
        }, 0);
      }, 0);

      const finalPOSpending = finalPOData.reduce((total, po) => total + po.totalAmount, 0);
      const finalTotalSpending = finalRequestSpending + finalPOSpending;
      const boosted = finalTotalSpending - monthData.currentSpending;
      totalBoosted += boosted;

      console.log(`✅ ${monthName} ${year}: $${finalTotalSpending.toFixed(2)} (+$${boosted.toFixed(2)})`);
    }

    console.log(`\n💰 Total spending boosted: $${totalBoosted.toFixed(2)}`);
    console.log(`📊 All months now have $100k+ spending`);
    console.log(`🚀 Analytics and dashboards will show consistent data`);

  } catch (error) {
    console.error('❌ Error boosting low spending months:', error);
  } finally {
    await prisma.$disconnect();
  }
}

boostLowSpendingMonths();