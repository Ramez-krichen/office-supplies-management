// Test script to verify auto-receive functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAutoReceive() {
  console.log('🧪 Testing Auto-Receive Functionality...\n');
  
  try {
    await prisma.$connect();
    
    // 1. Check current orders that are SENT or CONFIRMED
    console.log('1. Checking current SENT/CONFIRMED orders...');
    const currentOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ['SENT', 'CONFIRMED']
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
        expectedDate: 'asc'
      }
    });
    
    console.log(`Found ${currentOrders.length} SENT/CONFIRMED orders:`);
    currentOrders.forEach(order => {
      const expectedDate = order.expectedDate ? order.expectedDate.toISOString().split('T')[0] : 'No date';
      console.log(`  - ${order.orderNumber}: ${order.status} (Expected: ${expectedDate}) - ${order.supplier.name}`);
      order.items.forEach(item => {
        console.log(`    * ${item.item.name}: ${item.quantity} units (current stock: ${item.item.currentStock})`);
      });
    });
    
    if (currentOrders.length === 0) {
      console.log('\n❌ No SENT/CONFIRMED orders found. Creating a test order...');
      
      // Create a test order with today's expected delivery date
      const today = new Date();
      const supplier = await prisma.supplier.findFirst();
      const item = await prisma.item.findFirst();
      
      if (!supplier || !item) {
        console.log('❌ No suppliers or items found. Please run the seed script first.');
        return;
      }
      
      const testOrder = await prisma.purchaseOrder.create({
        data: {
          orderNumber: `TEST-AUTO-${Date.now()}`,
          supplierId: supplier.id,
          status: 'SENT',
          totalAmount: 100.00,
          orderDate: new Date(),
          expectedDate: today, // Set to today for testing
          notes: 'Test order for auto-receive functionality',
          createdById: 'clzh8x9y40000356c8qg5r2ks', // Using a known user ID
          items: {
            create: [
              {
                itemId: item.id,
                quantity: 5,
                unitPrice: 20.00,
                totalPrice: 100.00
              }
            ]
          }
        },
        include: {
          supplier: true,
          items: {
            include: {
              item: true
            }
          }
        }
      });
      
      console.log(`✅ Created test order: ${testOrder.orderNumber} with expected delivery today`);
      console.log(`   Supplier: ${testOrder.supplier.name}`);
      console.log(`   Items: ${testOrder.items[0].item.name} (${testOrder.items[0].quantity} units)`);
      console.log(`   Current stock before: ${testOrder.items[0].item.currentStock}`);
    }
    
    // 2. Check what orders would be auto-received today
    console.log('\n2. Checking orders due for auto-receive today...');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
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
      }
    });
    
    console.log(`Found ${ordersToReceive.length} orders due for auto-receive today:`);
    ordersToReceive.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.status} - ${order.supplier.name}`);
      order.items.forEach(item => {
        console.log(`    * ${item.item.name}: ${item.quantity} units (current: ${item.item.currentStock}, will become: ${item.item.currentStock + item.quantity})`);
      });
    });
    
    if (ordersToReceive.length === 0) {
      console.log('❌ No orders due for auto-receive today. The auto-receive functionality would not process anything.');
      return;
    }
    
    // 3. Simulate the auto-receive process
    console.log('\n3. Simulating auto-receive process...');
    
    for (const order of ordersToReceive) {
      console.log(`\n🔄 Processing order: ${order.orderNumber}`);
      
      // Store before values
      const beforeStocks = {};
      for (const orderItem of order.items) {
        beforeStocks[orderItem.itemId] = orderItem.item.currentStock;
      }
      
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
      
      console.log('✅ Order status updated to RECEIVED');
      
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
        
        console.log(`  ✅ ${orderItem.item.name}: ${beforeStocks[orderItem.itemId]} → ${updatedItem.currentStock} (+${orderItem.quantity})`);
        
        // Create stock movement record
        await prisma.stockMovement.create({
          data: {
            itemId: orderItem.itemId,
            type: 'INBOUND',
            quantity: orderItem.quantity,
            reason: 'Purchase Order Auto-Received (Test)',
            reference: updatedOrder.orderNumber,
            userId: 'clzh8x9y40000356c8qg5r2ks'
          }
        });
        
        console.log(`  ✅ Stock movement recorded`);
      }
    }
    
    console.log('\n✅ Auto-receive simulation completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Orders processed: ${ordersToReceive.length}`);
    console.log(`   - Inventory updated for all items`);
    console.log(`   - Stock movements recorded`);
    console.log(`   - Orders marked as RECEIVED`);
    
  } catch (error) {
    console.error('❌ Error during auto-receive test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAutoReceive().catch(console.error);
