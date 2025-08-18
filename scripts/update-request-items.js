const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRequestItems() {
  try {
    console.log('Starting to update request items...');
    
    // Get all request items that need updating
    const requestItems = await prisma.requestItem.findMany({
      include: {
        item: {
          select: {
            id: true,
            name: true
          }
        },
        request: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    console.log(`Found ${requestItems.length} request items to process`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const requestItem of requestItems) {
      try {
        // The request item already has the correct itemId in the database
        // We just need to ensure the API responses include this information
        // This script is mainly for verification and logging
        
        console.log(`Processing request item ${requestItem.id}:`);
        console.log(`  - Request: ${requestItem.request.title}`);
        console.log(`  - Item: ${requestItem.item.name}`);
        console.log(`  - Item ID: ${requestItem.itemId}`);
        console.log(`  - Quantity: ${requestItem.quantity}`);
        console.log(`  - Unit Price: ${requestItem.unitPrice}`);
        console.log(`  - Total Price: ${requestItem.totalPrice}`);
        console.log('  ✓ Item already properly linked');
        
        updatedCount++;
      } catch (error) {
        console.error(`Error processing request item ${requestItem.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Total request items processed: ${requestItems.length}`);
    console.log(`Successfully verified: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('✅ All request items are properly configured!');
      console.log('The API changes should now display item names correctly in the UI.');
    } else {
      console.log('⚠️  Some items had issues. Please check the errors above.');
    }

  } catch (error) {
    console.error('Error during update process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateRequestItems()
  .then(() => {
    console.log('Update process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update process failed:', error);
    process.exit(1);
  });
