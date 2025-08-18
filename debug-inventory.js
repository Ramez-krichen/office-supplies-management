// Debug script to check inventory update directly in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugInventory() {
  console.log('🔍 Debugging Inventory Update Issue...\n');
  
  try {
    // 1. Check if we can connect to database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // 2. Get some sample items and their current stock
    console.log('\n2. Checking current inventory...');
    const items = await prisma.item.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        reference: true,
        currentStock: true,
        unit: true
      }
    });
    
    console.log(`Found ${items.length} items:`);
    items.forEach(item => {
      console.log(`  - ${item.name} (${item.reference}): ${item.currentStock} ${item.unit}`);
    });
    
    // 3. Check purchase orders
    console.log('\n3. Checking purchase orders...');
    const orders = await prisma.purchaseOrder.findMany({
      take: 5,
      include: {
        items: {
          include: {
            item: {
              select: {
                name: true,
                reference: true,
                currentStock: true
              }
            }
          }
        },
        supplier: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${orders.length} orders:`);
    orders.forEach(order => {
      console.log(`  - ${order.orderNumber}: ${order.status} (${order.supplier.name})`);
      order.items.forEach(item => {
        console.log(`    * ${item.item.name}: ${item.quantity} units (current stock: ${item.item.currentStock})`);
      });
    });
    
    // 4. Find a SENT order to test with
    const sentOrder = orders.find(order => order.status === 'SENT');
    
    if (sentOrder) {
      console.log(`\n4. Found SENT order for testing: ${sentOrder.orderNumber}`);
      console.log('Items in this order:');
      sentOrder.items.forEach(item => {
        console.log(`  - ${item.item.name}: ${item.quantity} units to add to current ${item.item.currentStock}`);
      });
      
      // 5. Test manual inventory update
      console.log('\n5. Testing manual inventory update...');
      const firstItem = sentOrder.items[0];
      if (firstItem) {
        const originalStock = firstItem.item.currentStock;
        const quantityToAdd = firstItem.quantity;
        
        console.log(`Testing with item: ${firstItem.item.name}`);
        console.log(`Original stock: ${originalStock}`);
        console.log(`Quantity to add: ${quantityToAdd}`);
        
        // Update the stock
        const updatedItem = await prisma.item.update({
          where: { id: firstItem.itemId },
          data: {
            currentStock: {
              increment: quantityToAdd
            }
          }
        });
        
        console.log(`Updated stock: ${updatedItem.currentStock}`);
        console.log(`Expected: ${originalStock + quantityToAdd}`);
        console.log(`✅ Manual update ${updatedItem.currentStock === originalStock + quantityToAdd ? 'SUCCESSFUL' : 'FAILED'}`);
        
        // Revert the change
        await prisma.item.update({
          where: { id: firstItem.itemId },
          data: {
            currentStock: originalStock
          }
        });
        console.log('✅ Reverted change for testing');
      }
    } else {
      console.log('\n4. No SENT orders found for testing');
    }
    
    // 6. Check stock movements
    console.log('\n6. Checking recent stock movements...');
    const movements = await prisma.stockMovement.findMany({
      take: 5,
      include: {
        item: {
          select: {
            name: true,
            reference: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${movements.length} recent stock movements:`);
    movements.forEach(movement => {
      console.log(`  - ${movement.item.name}: ${movement.type} ${movement.quantity} (${movement.reason || 'No reason'}) by ${movement.user.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugInventory();
