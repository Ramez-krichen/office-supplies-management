const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateSimpleForecasts() {
  try {
    console.log('📈 Generating simple forecasts...');
    
    // Get all items
    const items = await prisma.item.findMany({ take: 20 });
    console.log(`Found ${items.length} items`);
    
    // Get current date for generating future periods
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Generate forecasts for next 3 months
    const nextPeriods = [];
    for (let i = 1; i <= 3; i++) {
      let month = currentMonth + i;
      let year = currentYear;
      
      if (month > 12) {
        month = month - 12;
        year = year + 1;
      }
      
      nextPeriods.push(`${year}-${String(month).padStart(2, '0')}`);
    }
    
    console.log('Next periods:', nextPeriods);
    
    // Generate forecasts for each item
    for (const item of items) {
      console.log(`Generating forecasts for: ${item.name}`);
      
      // Generate forecasts for each period
      for (let i = 0; i < nextPeriods.length; i++) {
        const period = nextPeriods[i];
        
        // Simple forecast: random demand between 5 and 50
        const predictedDemand = Math.floor(Math.random() * 45) + 5;
        const confidence = 0.7 + (Math.random() * 0.2); // 0.7 to 0.9
        
        // Create forecast ID
        const forecastId = `fcst${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Factors JSON
        const factors = JSON.stringify({
          method: 'simple_random',
          baseValue: predictedDemand,
          confidence: confidence,
          generatedAt: new Date().toISOString()
        });
        
        try {
          // Check if forecast already exists
          const existing = await prisma.demandForecast.findFirst({
            where: {
              itemId: item.id,
              period: period,
              periodType: 'MONTHLY'
            }
          });
          
          if (existing) {
            // Update existing
            await prisma.demandForecast.update({
              where: { id: existing.id },
              data: {
                predictedDemand,
                confidence,
                algorithm: 'SIMPLE_RANDOM',
                factors,
                updatedAt: new Date()
              }
            });
          } else {
            // Create new
            await prisma.demandForecast.create({
              data: {
                id: forecastId,
                itemId: item.id,
                period,
                periodType: 'MONTHLY',
                predictedDemand,
                confidence,
                algorithm: 'SIMPLE_RANDOM',
                factors
              }
            });
          }
          
          console.log(`  - ${period}: ${predictedDemand} units (confidence: ${confidence.toFixed(2)})`);
        } catch (error) {
          console.error(`Error creating forecast for ${item.name} - ${period}:`, error.message);
        }
      }
    }
    
    // Check results
    const totalForecasts = await prisma.demandForecast.count();
    console.log(`\n✅ Generated forecasts successfully!`);
    console.log(`Total forecasts in database: ${totalForecasts}`);
    
  } catch (error) {
    console.error('Error generating forecasts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateSimpleForecasts();
