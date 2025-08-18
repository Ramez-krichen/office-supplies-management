// Test script to simulate receiving a purchase order and verify inventory update
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testReceiveOrder() {
  console.log('🧪 Testing Purchase Order Receive Process...\n');
  
  try {
    await prisma.$connect();
    
    // 1. Find a SENT order to test with
    const sentOrder = await prisma.purchaseOrder.findFirst({
      where: { status: 'SENT' },
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                reference: true,
                currentStock: true,
                unit: true
              }
            }
          }
        },
        supplier: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (!sentOrder) {
      console.log('❌ No SENT orders found for testing');
      return;
    }
    
    console.log(`Found SENT order: ${sentOrder.orderNumber}`);
    console.log(`Supplier: ${sentOrder.supplier.name}`);
    console.log('Items before receiving:');
    
    const beforeStocks = {};
    sentOrder.items.forEach(item => {
      beforeStocks[item.itemId] = item.item.currentStock;
      console.log(`  - ${item.item.name}: ${item.item.currentStock} ${item.item.unit} (will add ${item.quantity})`);
    });
    
    // 2. Simulate the receive process manually (same logic as the API)
    console.log('\n🔄 Simulating receive process...');
    
    // Update order status to RECEIVED
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: sentOrder.id },
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
    
    console.log('✅ Order status updated to RECEIVED');
    
    // Update inventory quantities for received items
    console.log('📦 Updating inventory...');
    for (const orderItem of updatedOrder.items) {
      console.log(`Updating ${orderItem.item.name}: adding ${orderItem.quantity} to current stock`);
      
      const updatedItem = await prisma.item.update({
        where: { id: orderItem.itemId },
        data: {
          currentStock: {
            increment: orderItem.quantity
          }
        }
      });
      
      console.log(`  ✅ ${orderItem.item.name}: ${beforeStocks[orderItem.itemId]} → ${updatedItem.currentStock}`);
      
      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          itemId: orderItem.itemId,
          type: 'INBOUND',
          quantity: orderItem.quantity,
          reason: 'Purchase Order Received',
          reference: updatedOrder.orderNumber,
          userId: 'clzh8x9y40000356c8qg5r2ks' // Using a known user ID from the system
        }
      });
      
      console.log(`  ✅ Stock movement recorded`);
    }
    
    // 3. Verify the changes
    console.log('\n✅ Verification:');
    const verifyItems = await prisma.item.findMany({
      where: {
        id: {
          in: sentOrder.items.map(item => item.itemId)
        }
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
        unit: true
      }
    });
    
    verifyItems.forEach(item => {
      const orderItem = sentOrder.items.find(oi => oi.itemId === item.id);
      const expectedStock = beforeStocks[item.id] + orderItem.quantity;
      const isCorrect = item.currentStock === expectedStock;
      
      console.log(`  ${item.name}: ${item.currentStock} ${item.unit} ${isCorrect ? '✅' : '❌'} (expected: ${expectedStock})`);
    });
    
    console.log('\n🎉 Test completed! Check the inventory page to see the updated quantities.');
    console.log('💡 Tip: Use the Refresh button on the inventory page if the changes are not visible immediately.');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testReceiveOrder();
