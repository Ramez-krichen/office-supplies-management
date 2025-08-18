const { PrismaClient } = require('@prisma/client');

async function testQuickReportsAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Testing Quick Reports API Data ===\n');
    
    // Test 1: Check if we have basic data
    console.log('1. Checking basic data availability...');
    
    const itemCount = await prisma.item.count();
    console.log(`   Items in database: ${itemCount}`);
    
    const requestCount = await prisma.request.count({ where: { status: 'APPROVED' } });
    console.log(`   Approved requests: ${requestCount}`);
    
    const poCount = await prisma.purchaseOrder.count();
    console.log(`   Purchase orders: ${poCount}`);
    
    // Test 2: Check low stock items
    console.log('\n2. Checking low stock items...');
    const allItems = await prisma.item.findMany({
      where: { isActive: true },
      include: { category: true },
      take: 5
    });
    
    const lowStockItems = allItems.filter(item => 
      item.currentStock <= item.minStock || item.currentStock <= 5
    );
    
    console.log(`   Total active items: ${allItems.length}`);
    console.log(`   Low stock items: ${lowStockItems.length}`);
    
    if (lowStockItems.length > 0) {
      console.log('   Sample low stock item:');
      const sample = lowStockItems[0];
      console.log(`     - ${sample.name}: ${sample.currentStock}/${sample.minStock} (${sample.unit})`);
    }
    
    // Test 3: Check approved requests with items
    console.log('\n3. Checking approved requests...');
    const approvedRequests = await prisma.request.findMany({
      where: { status: 'APPROVED' },
      include: {
        items: {
          include: {
            item: {
              include: { category: true }
            }
          }
        },
        requester: {
          select: {
            department: true,
            departmentRef: { select: { name: true } }
          }
        }
      },
      take: 3
    });
    
    console.log(`   Approved requests with items: ${approvedRequests.length}`);
    
    if (approvedRequests.length > 0) {
      const sample = approvedRequests[0];
      console.log(`   Sample request: ${sample.title}`);
      console.log(`     - Items: ${sample.items.length}`);
      console.log(`     - Department: ${sample.requester?.departmentRef?.name || sample.requester?.department || 'Unknown'}`);
      
      if (sample.items.length > 0) {
        const sampleItem = sample.items[0];
        console.log(`     - Sample item: ${sampleItem.item.name} (${sampleItem.quantity} ${sampleItem.item.unit})`);
      }
    }
    
    // Test 4: Simulate API response structure
    console.log('\n4. Simulating API response structure...');
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const periodRequests = await prisma.request.findMany({
      where: {
        status: 'APPROVED',
        createdAt: { gte: periodStart }
      },
      include: {
        items: {
          include: {
            item: { include: { category: true } }
          }
        },
        requester: {
          select: {
            department: true,
            departmentRef: { select: { name: true } }
          }
        }
      }
    });
    
    // Calculate totals
    const totalConsumed = periodRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => itemSum + requestItem.quantity, 0);
    }, 0);
    
    const totalCost = periodRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price));
      }, 0);
    }, 0);
    
    console.log(`   Period (30 days) totals:`);
    console.log(`     - Total items consumed: ${totalConsumed}`);
    console.log(`     - Total cost: $${totalCost.toFixed(2)}`);
    
    // Department breakdown
    const departmentConsumption = periodRequests.reduce((acc, request) => {
      const dept = request.requester?.departmentRef?.name || request.requester?.department || 'Unknown';
      const requestTotal = request.items.reduce((sum, item) => sum + item.quantity, 0);
      const requestCost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.quantity * item.item.price));
      }, 0);

      if (!acc[dept]) {
        acc[dept] = { consumed: 0, cost: 0 };
      }
      acc[dept].consumed += requestTotal;
      acc[dept].cost += requestCost;
      return acc;
    }, {});
    
    const topDepartments = Object.entries(departmentConsumption)
      .map(([department, data]) => ({
        department,
        consumed: data.consumed,
        cost: data.cost
      }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5);
    
    console.log(`   Top consuming departments:`);
    topDepartments.forEach((dept, index) => {
      console.log(`     ${index + 1}. ${dept.department}: ${dept.consumed} items, $${dept.cost.toFixed(2)}`);
    });
    
    console.log('\n=== API Test Complete ===');
    console.log('✅ The API should now return proper data for the Quick Reports page');
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuickReportsAPI();