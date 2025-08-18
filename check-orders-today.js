// Quick script to check what orders are due today and their current status
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOrdersToday() {
  console.log('📅 Checking Orders Due Today...\n');
  
  try {
    await prisma.$connect();
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    console.log(`Today: ${today.toISOString().split('T')[0]}`);
    console.log(`Looking for orders with expected delivery between:`);
    console.log(`  Start: ${startOfDay.toISOString()}`);
    console.log(`  End: ${endOfDay.toISOString()}\n`);
    
    // 1. Check all orders with today's expected delivery date
    const allOrdersToday = await prisma.purchaseOrder.findMany({
      where: {
        expectedDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                name: true,
                currentStock: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: {
        orderNumber: 'asc'
      }
    });
    
    console.log(`📦 All orders with expected delivery today: ${allOrdersToday.length}`);
    allOrdersToday.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.status} - ${order.supplier.name} ($${order.totalAmount.toFixed(2)})`);
      order.items.forEach(item => {
        console.log(`    * ${item.item.name}: ${item.quantity} ${item.item.unit} (current stock: ${item.item.currentStock})`);
      });
    });
    
    // 2. Check orders that would be auto-received (SENT or CONFIRMED with today's date)
    const ordersToAutoReceive = allOrdersToday.filter(order => 
      order.status === 'SENT' || order.status === 'CONFIRMED'
    );
    
    console.log(`\n🤖 Orders eligible for auto-receive: ${ordersToAutoReceive.length}`);
    ordersToAutoReceive.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.status} - ${order.supplier.name}`);
      console.log(`    Expected: ${order.expectedDate?.toISOString().split('T')[0]}`);
      order.items.forEach(item => {
        const newStock = item.item.currentStock + item.quantity;
        console.log(`    * ${item.item.name}: ${item.item.currentStock} → ${newStock} (+${item.quantity})`);
      });
    });
    
    // 3. Check orders already received today
    const ordersReceivedToday = allOrdersToday.filter(order => order.status === 'RECEIVED');
    
    console.log(`\n✅ Orders already received today: ${ordersReceivedToday.length}`);
    ordersReceivedToday.forEach(order => {
      const receivedDate = order.receivedDate ? order.receivedDate.toISOString().split('T')[0] : 'Unknown';
      console.log(`  - ${order.orderNumber}: RECEIVED on ${receivedDate} - ${order.supplier.name}`);
    });
    
    // 4. Summary
    console.log(`\n📊 Summary for ${today.toISOString().split('T')[0]}:`);
    console.log(`  Total orders due today: ${allOrdersToday.length}`);
    console.log(`  Ready for auto-receive: ${ordersToAutoReceive.length}`);
    console.log(`  Already received: ${ordersReceivedToday.length}`);
    console.log(`  Other statuses: ${allOrdersToday.length - ordersToAutoReceive.length - ordersReceivedToday.length}`);
    
    if (ordersToAutoReceive.length > 0) {
      console.log(`\n💡 The auto-receive functionality would process ${ordersToAutoReceive.length} order(s) and update inventory.`);
    } else {
      console.log(`\n💡 No orders need auto-receiving today.`);
    }
    
    // 5. Check recent stock movements
    console.log(`\n📈 Recent stock movements (last 24 hours):`);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentMovements = await prisma.stockMovement.findMany({
      where: {
        createdAt: {
          gte: yesterday
        }
      },
      include: {
        item: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    recentMovements.forEach(movement => {
      const date = movement.createdAt.toISOString().split('T')[0];
      const time = movement.createdAt.toTimeString().split(' ')[0];
      console.log(`  - ${date} ${time}: ${movement.type} ${movement.quantity} ${movement.item.name} (${movement.reason})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkOrdersToday().catch(console.error);
