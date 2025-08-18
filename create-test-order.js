// Create a test order for tomorrow to test auto-receive functionality
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestOrder() {
  console.log('🧪 Creating Test Order for Auto-Receive...\n');
  
  try {
    await prisma.$connect();
    
    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' },
      select: { id: true, name: true }
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    // Get a supplier and item
    const supplier = await prisma.supplier.findFirst();
    const item = await prisma.item.findFirst({
      where: {
        currentStock: {
          lt: 50 // Find an item with low stock
        }
      }
    });
    
    if (!supplier || !item) {
      console.log('❌ No supplier or item found');
      return;
    }
    
    console.log(`Using supplier: ${supplier.name}`);
    console.log(`Using item: ${item.name} (current stock: ${item.currentStock})`);
    console.log(`Using admin: ${adminUser.name}`);
    
    // Create tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    console.log(`\nCreating order with expected delivery: ${tomorrow.toISOString().split('T')[0]}`);
    
    // Create test order
    const testOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `TEST-AUTO-${Date.now()}`,
        supplierId: supplier.id,
        status: 'SENT',
        totalAmount: 250.00,
        orderDate: new Date(),
        expectedDate: tomorrow,
        notes: 'Test order for auto-receive functionality - delivery tomorrow',
        createdById: adminUser.id,
        items: {
          create: [
            {
              itemId: item.id,
              quantity: 10,
              unitPrice: 25.00,
              totalPrice: 250.00
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
    
    console.log(`✅ Created test order: ${testOrder.orderNumber}`);
    console.log(`   Status: ${testOrder.status}`);
    console.log(`   Expected delivery: ${testOrder.expectedDate?.toISOString().split('T')[0]}`);
    console.log(`   Supplier: ${testOrder.supplier.name}`);
    console.log(`   Items:`);
    testOrder.items.forEach(orderItem => {
      console.log(`     - ${orderItem.item.name}: ${orderItem.quantity} units @ $${orderItem.unitPrice}`);
      console.log(`       Current stock: ${orderItem.item.currentStock}`);
      console.log(`       Will become: ${orderItem.item.currentStock + orderItem.quantity} after auto-receive`);
    });
    
    console.log(`\n💡 This order will be automatically received tomorrow when the auto-receive process runs.`);
    console.log(`💡 To test now, you can manually change the expectedDate to today and run the auto-receive API.`);
    
    return testOrder;
    
  } catch (error) {
    console.error('❌ Error creating test order:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the creation
createTestOrder().catch(console.error);
