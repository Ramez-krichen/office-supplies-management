const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper function to generate random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random number within range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateStockMovements() {
  try {
    console.log('🔄 Generating additional stock movements for forecasting...');
    
    // Get all items and a user
    const items = await prisma.item.findMany({ take: 20 }); // Focus on first 20 items
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.error('No user found in database');
      return;
    }
    
    console.log(`Found ${items.length} items to generate movements for`);
    
    // Define date ranges for the last 6 years
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 6);
    
    console.log(`Generating movements from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    for (const item of items) {
      console.log(`Generating movements for: ${item.name}`);
      
      // Generate movements for each month in the date range
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Generate 3-8 OUT movements per month
        const movementsThisMonth = randomInt(3, 8);
        
        for (let i = 0; i < movementsThisMonth; i++) {
          const movementDate = randomDate(monthStart, monthEnd);
          const quantity = randomInt(1, 15);
          
          await prisma.stockMovement.create({
            data: {
              itemId: item.id,
              type: 'OUT',
              quantity: quantity,
              reason: 'Department usage',
              reference: `REQ-${randomInt(1000, 9999)}`,
              userId: user.id,
              createdAt: movementDate
            }
          });
        }
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    console.log('✅ Stock movements generated successfully!');
    
    // Check the results
    const totalMovements = await prisma.stockMovement.count();
    const outMovements = await prisma.stockMovement.count({ where: { type: 'OUT' } });
    
    console.log(`Total stock movements: ${totalMovements}`);
    console.log(`OUT movements: ${outMovements}`);
    
  } catch (error) {
    console.error('Error generating stock movements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateStockMovements();
