// Simple test to verify auto-receive functionality with correct user ID
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAutoReceiveSimple() {
  console.log('🧪 Testing Auto-Receive Functionality (Simple)...\n');
  
  try {
    await prisma.$connect();
    
    // Get the admin user ID
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' },
      select: { id: true, name: true }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log(`Using admin user: ${adminUser.name} (${adminUser.id})`);
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    console.log(`\nLooking for orders due today: ${today.toISOString().split('T')[0]}`);
    
    // Find orders that are SENT or CONFIRMED and have expected delivery date of today
    const ordersToReceive = await prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ['SENT', 'CONFIRMED']
        },
        expectedDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            item: true
          }
        }
      },
      take: 2 // Only process first 2 orders for testing
    });
    
    console.log(`Found ${ordersToReceive.length} orders to auto-receive (processing first 2)`);
    
    if (ordersToReceive.length === 0) {
      console.log('❌ No orders found for auto-receive today');
      return;
    }
    
    // Process each order
    for (const order of ordersToReceive) {
      console.log(`\n🔄 Processing order: ${order.orderNumber}`);
      console.log(`   Supplier: ${order.supplier.name}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Expected: ${order.expectedDate?.toISOString().split('T')[0]}`);
      
      // Store before values
      const beforeStocks = {};
      for (const orderItem of order.items) {
        beforeStocks[orderItem.itemId] = orderItem.item.currentStock;
        console.log(`   Item: ${orderItem.item.name} - Current: ${orderItem.item.currentStock}, Adding: ${orderItem.quantity}`);
      }
      
      try {
        // Update order status to RECEIVED
        const updatedOrder = await prisma.purchaseOrder.update({
          where: { id: order.id },
          data: {
            status: 'RECEIVED',
            receivedDate: new Date(),
            updatedAt: new Date()
          },
          include: {
            items: {
              include: {
                item: true
              }
            }
          }
        });
        
        console.log('   ✅ Order status updated to RECEIVED');
        
        // Update inventory quantities
        for (const orderItem of updatedOrder.items) {
          const updatedItem = await prisma.item.update({
            where: { id: orderItem.itemId },
            data: {
              currentStock: {
                increment: orderItem.quantity
              }
            }
          });
          
          console.log(`   ✅ ${orderItem.item.name}: ${beforeStocks[orderItem.itemId]} → ${updatedItem.currentStock} (+${orderItem.quantity})`);
          
          // Create stock movement record
          await prisma.stockMovement.create({
            data: {
              itemId: orderItem.itemId,
              type: 'INBOUND',
              quantity: orderItem.quantity,
              reason: 'Purchase Order Auto-Received (Test)',
              reference: updatedOrder.orderNumber,
              userId: adminUser.id
            }
          });
          
          console.log(`   ✅ Stock movement recorded`);
        }
        
        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: 'AUTO_RECEIVE_ORDER',
            entity: 'PURCHASE_ORDER',
            entityId: order.id,
            performedBy: adminUser.id,
            details: `Auto-received purchase order: ${updatedOrder.orderNumber} from supplier: ${order.supplier.name} - Amount: $${order.totalAmount.toFixed(2)} - Items automatically received and added to inventory on delivery date`
          }
        });
        
        console.log(`   ✅ Audit log created`);
        console.log(`   🎉 Successfully processed order: ${order.orderNumber}`);
        
      } catch (error) {
        console.error(`   ❌ Error processing order ${order.orderNumber}:`, error.message);
      }
    }
    
    console.log('\n✅ Auto-receive test completed!');
    
    // Verify the changes
    console.log('\n📊 Verification - checking updated inventory:');
    for (const order of ordersToReceive) {
      for (const orderItem of order.items) {
        const currentItem = await prisma.item.findUnique({
          where: { id: orderItem.itemId },
          select: { name: true, currentStock: true }
        });
        console.log(`   ${currentItem?.name}: ${currentItem?.currentStock} units`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during auto-receive test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAutoReceiveSimple().catch(console.error);
