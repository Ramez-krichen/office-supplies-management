const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function refreshAllRequests() {
  try {
    console.log('🚀 Starting to refresh all requests...');
    console.log('📊 Connecting to database...');

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Get all requests with their items
    console.log('🔍 Fetching all requests...');
    const requests = await prisma.request.findMany({
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                price: true,
                unit: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${requests.length} requests to refresh`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const request of requests) {
      try {
        console.log(`\nProcessing request: ${request.title} (ID: ${request.id})`);
        
        if (request.items.length === 0) {
          console.log('  ⚠️  Skipping - No items in this request');
          skippedCount++;
          continue;
        }

        // Prepare the items data for recreation
        const itemsData = request.items.map(requestItem => ({
          itemId: requestItem.itemId, // This should already be correct
          quantity: requestItem.quantity,
          unitPrice: requestItem.unitPrice,
          totalPrice: requestItem.totalPrice,
          notes: requestItem.notes
        }));

        console.log(`  📝 Found ${itemsData.length} items to refresh`);

        // Delete existing request items
        await prisma.requestItem.deleteMany({
          where: { requestId: request.id }
        });

        // Recreate request items with proper structure
        await Promise.all(
          itemsData.map(async (itemData) => {
            return prisma.requestItem.create({
              data: {
                requestId: request.id,
                itemId: itemData.itemId,
                quantity: itemData.quantity,
                unitPrice: itemData.unitPrice,
                totalPrice: itemData.totalPrice,
                notes: itemData.notes
              }
            });
          })
        );

        // Recalculate total amount
        const newTotalAmount = itemsData.reduce(
          (sum, item) => sum + (item.quantity * item.unitPrice),
          0
        );

        // Update the request with recalculated total
        await prisma.request.update({
          where: { id: request.id },
          data: {
            totalAmount: newTotalAmount,
            updatedAt: new Date()
          }
        });

        console.log(`  ✅ Successfully refreshed - Total: $${newTotalAmount.toFixed(2)}`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error processing request ${request.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Refresh Summary ===');
    console.log(`Total requests found: ${requests.length}`);
    console.log(`Successfully refreshed: ${successCount}`);
    console.log(`Skipped (no items): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('🎉 All requests have been successfully refreshed!');
      console.log('The UI should now display all item names correctly.');
    } else {
      console.log('⚠️  Some requests had issues. Please check the errors above.');
    }

  } catch (error) {
    console.error('Error during refresh process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the refresh
refreshAllRequests()
  .then(() => {
    console.log('\nRefresh process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Refresh process failed:', error);
    process.exit(1);
  });
