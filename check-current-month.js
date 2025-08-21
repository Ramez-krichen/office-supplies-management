const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCurrentMonthData() {
  try {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    console.log('📅 Checking current month data for:', currentMonth.toLocaleDateString());
    
    // Check requests this month
    const requests = await prisma.request.findMany({
      where: {
        createdAt: { gte: currentMonth },
        status: { in: ['APPROVED', 'COMPLETED'] }
      },
      include: {
        requester: { 
          select: { 
            department: true, 
            departmentRef: { select: { name: true } } 
          } 
        },
        items: { include: { item: true } }
      }
    });
    
    console.log('📋 Current month requests:', requests.length);
    
    // Check spending by department
    const deptSpending = {};
    requests.forEach(req => {
      const dept = req.requester?.departmentRef?.name || req.requester?.department || 'Unknown';
      const spending = req.items.reduce((sum, item) => sum + (item.totalPrice || item.item.price * item.quantity), 0);
      deptSpending[dept] = (deptSpending[dept] || 0) + spending;
    });
    
    console.log('💰 Department spending this month:');
    Object.entries(deptSpending).forEach(([dept, amount]) => {
      console.log('  ', dept + ':', '$' + amount.toFixed(2));
    });
    
    // Check purchase orders this month
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: currentMonth },
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
      }
    });
    
    console.log('🛒 Current month purchase orders:', pos.length);
    const poSpending = pos.reduce((sum, po) => sum + po.totalAmount, 0);
    console.log('💰 PO spending this month: $' + poSpending.toFixed(2));
    
    console.log('💰 Total spending this month: $' + (Object.values(deptSpending).reduce((a, b) => a + b, 0) + poSpending).toFixed(2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentMonthData();