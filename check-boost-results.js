const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBoostResults() {
  try {
    console.log('🔍 Checking boost results for all months...\n');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

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

    console.log('📊 Monthly Spending Summary:');
    console.log('=' .repeat(60));

    let totalSpending = 0;
    let monthsAbove100k = 0;
    let monthsBelow100k = 0;

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

      totalSpending += monthTotalSpending;

      const status = monthTotalSpending >= 100000 ? '✅' : '❌';
      const statusText = monthTotalSpending >= 100000 ? 'GOOD' : 'LOW';
      
      if (monthTotalSpending >= 100000) {
        monthsAbove100k++;
      } else {
        monthsBelow100k++;
      }

      console.log(`${status} ${monthName} ${year}: $${monthTotalSpending.toFixed(2).padStart(12)} (${monthRequestData.length.toString().padStart(3)} req, ${monthPOData.length.toString().padStart(3)} POs) ${statusText}`);
    }

    console.log('=' .repeat(60));
    console.log(`📈 Total Spending Across All Months: $${totalSpending.toFixed(2)}`);
    console.log(`✅ Months with $100k+ spending: ${monthsAbove100k}`);
    console.log(`❌ Months with <$100k spending: ${monthsBelow100k}`);
    
    if (monthsBelow100k === 0) {
      console.log('\n🎉 SUCCESS: All months now have $100k+ spending!');
      console.log('🚀 Analytics and dashboards will show consistent data');
    } else {
      console.log(`\n⚠️  Still ${monthsBelow100k} months below $100k threshold`);
      console.log('💡 Run boost-low-spending-months.js again if needed');
    }

    // Summary statistics
    const avgSpending = totalSpending / monthsToCheck.length;
    console.log(`\n📊 Average Monthly Spending: $${avgSpending.toFixed(2)}`);
    
    const totalRequests = await prisma.request.count();
    const totalPOs = await prisma.purchaseOrder.count();
    console.log(`📋 Total Requests in System: ${totalRequests}`);
    console.log(`🛒 Total Purchase Orders in System: ${totalPOs}`);

  } catch (error) {
    console.error('❌ Error checking boost results:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBoostResults();