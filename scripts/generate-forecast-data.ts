import { PrismaClient, PeriodType, MovementType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  NUM_ITEMS: 50, // Increased from 30
  NUM_CATEGORIES: 8, // Increased from 5
  NUM_SUPPLIERS: 15, // Increased from 10
  NUM_STOCK_MOVEMENTS_PER_ITEM: 200, // Increased from 100
  MONTHS_OF_HISTORY: 36, // Increased from 24 (3 years of history)
  START_DATE: new Date(new Date().getFullYear() - 3, 0, 1), // 3 years ago
  END_DATE: new Date(), // Current date
  SEASONAL_PATTERNS: true, // Enable seasonal patterns in stock movements
  TREND_PATTERNS: true, // Enable trend patterns (increasing/decreasing demand over time)
  GENERATE_FORECASTS: true, // Generate initial forecasts
  GENERATE_PYTHON_FORECASTS: true, // Generate forecasts using Python
  GENERATE_R_FORECASTS: true, // Generate forecasts using R
};

// Helper function to generate a random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate a period key based on date and period type
function generatePeriodKey(date: Date, periodType: PeriodType): string {
  switch (periodType) {
    case 'WEEKLY':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split('T')[0];
    case 'QUARTERLY':
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    case 'YEARLY':
      return date.getFullYear().toString();
    default: // MONTHLY
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

// Generate categories
async function generateCategories() {
  console.log('Generating categories...');
  const categories = [];
  
  const officeSupplyCategories = [
    'Paper Products',
    'Writing Instruments',
    'Organization',
    'Desk Accessories',
    'Technology Accessories',
    'Binding & Presentation',
    'Mailing & Shipping',
    'Furniture',
    'Cleaning Supplies',
    'Break Room Supplies'
  ];
  
  for (let i = 0; i < CONFIG.NUM_CATEGORIES; i++) {
    categories.push({
      name: i < officeSupplyCategories.length 
        ? officeSupplyCategories[i] 
        : faker.commerce.department(),
      description: faker.commerce.productDescription(),
    });
  }
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }
  
  return await prisma.category.findMany();
}

// Generate suppliers
async function generateSuppliers() {
  console.log('Generating suppliers...');
  const suppliers = [];
  
  const officeSuppliers = [
    'Office Depot',
    'Staples',
    'Amazon Business',
    'Quill',
    'W.B. Mason',
    'Uline',
    'Global Industrial',
    'Grainger',
    'CDW',
    'Costco Business Center'
  ];
  
  for (let i = 0; i < CONFIG.NUM_SUPPLIERS; i++) {
    suppliers.push({
      name: i < officeSuppliers.length 
        ? officeSuppliers[i] 
        : faker.company.name(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      contactPerson: faker.person.fullName(),
    });
  }
  
  for (const supplier of suppliers) {
    await prisma.supplier.create({
      data: supplier,
    });
  }
  
  return await prisma.supplier.findMany();
}

// Generate items
async function generateItems(categories: any[], suppliers: any[]) {
  console.log('Generating items...');
  const items = [];
  
  const officeItems = [
    { name: 'Copy Paper', unit: 'ream', minStock: 20, price: 4.99 },
    { name: 'Ballpoint Pens', unit: 'box', minStock: 5, price: 7.99 },
    { name: 'Sticky Notes', unit: 'pack', minStock: 10, price: 3.49 },
    { name: 'Stapler', unit: 'piece', minStock: 2, price: 8.99 },
    { name: 'Staples', unit: 'box', minStock: 5, price: 2.49 },
    { name: 'File Folders', unit: 'box', minStock: 3, price: 9.99 },
    { name: 'Binder Clips', unit: 'pack', minStock: 4, price: 3.99 },
    { name: 'Highlighters', unit: 'pack', minStock: 3, price: 5.99 },
    { name: 'Notebooks', unit: 'piece', minStock: 10, price: 2.99 },
    { name: 'Desk Organizer', unit: 'piece', minStock: 2, price: 14.99 },
    { name: 'Scissors', unit: 'piece', minStock: 3, price: 4.99 },
    { name: 'Tape Dispenser', unit: 'piece', minStock: 2, price: 6.99 },
    { name: 'Tape Rolls', unit: 'pack', minStock: 5, price: 7.99 },
    { name: 'Paper Clips', unit: 'box', minStock: 5, price: 1.99 },
    { name: 'Envelopes', unit: 'box', minStock: 3, price: 8.99 },
    { name: 'Printer Ink', unit: 'cartridge', minStock: 2, price: 29.99 },
    { name: 'Whiteboard Markers', unit: 'pack', minStock: 2, price: 6.99 },
    { name: 'Whiteboard Eraser', unit: 'piece', minStock: 1, price: 4.99 },
    { name: 'Mouse Pad', unit: 'piece', minStock: 2, price: 7.99 },
    { name: 'USB Flash Drive', unit: 'piece', minStock: 3, price: 12.99 },
  ];
  
  for (let i = 0; i < CONFIG.NUM_ITEMS; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    
    let itemData: any = {
      reference: `ITEM-${faker.string.alphanumeric(6).toUpperCase()}`,
      description: faker.commerce.productDescription(),
      isActive: true,
      isEcoFriendly: faker.helpers.arrayElement([true, false]),
      ecoRating: faker.number.int({ min: 1, max: 5 }),
      carbonFootprint: parseFloat(faker.number.float({ min: 0.1, max: 10 }).toFixed(1)),
      recyclable: faker.helpers.arrayElement([true, false]),
      categoryId: category.id,
      supplierId: supplier.id,
    };
    
    // Use predefined items if available
    if (i < officeItems.length) {
      const officeItem = officeItems[i];
      itemData = {
        ...itemData,
        name: officeItem.name,
        unit: officeItem.unit,
        minStock: officeItem.minStock,
        price: officeItem.price,
        currentStock: faker.number.int({ min: officeItem.minStock, max: officeItem.minStock * 3 }),
      };
    } else {
      // Generate random item data
      itemData = {
        ...itemData,
        name: faker.commerce.productName(),
        unit: faker.helpers.arrayElement(['piece', 'box', 'kg', 'liter', 'pack']),
        price: parseFloat(faker.commerce.price({ min: 5, max: 200 })),
        minStock: faker.number.int({ min: 10, max: 50 }),
        currentStock: faker.number.int({ min: 20, max: 200 }),
      };
    }
    
    items.push(itemData);
  }
  
  for (const item of items) {
    await prisma.item.create({
      data: item,
    });
  }
  
  return await prisma.item.findMany();
}
  
// Function to generate stock movements for items
async function generateStockMovements(items: any[], userId: string) {
  console.log('Generating stock movements...');
  const startDate = CONFIG.START_DATE;
  const endDate = CONFIG.END_DATE;
  
  // Create a date range for each month between start and end dates
  const months = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    months.push(new Date(currentDate));
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  for (const item of items) {
    // Create a seasonal pattern with higher demand in certain months
    const baseQuantity = faker.number.int({ min: 5, max: 20 });
    
    // Assign seasonal pattern to this item
    const seasonalPattern = CONFIG.SEASONAL_PATTERNS ? generateSeasonalPattern() : new Array(12).fill(1.0);
    
    // Assign trend pattern (increasing or decreasing demand over time)
    let trendFactor = 1.0;
    const hasTrend = CONFIG.TREND_PATTERNS && faker.helpers.arrayElement([true, false]);
    const trendDirection = faker.helpers.arrayElement([true, false]) ? 1 : -1; // 1 = increasing, -1 = decreasing
    const trendStrength = faker.number.float({ min: 0.01, max: 0.05 }); // Monthly change factor
    
    // For each month in our date range
    for (let i = 0; i < months.length; i++) {
      const month = months[i];
      const monthIndex = month.getMonth(); // 0-11
      
      // Update trend factor if trends are enabled
      if (hasTrend) {
        trendFactor = Math.max(0.5, Math.min(2.0, 1.0 + (trendDirection * trendStrength * i)));
      }
      
      // Determine number of movements in this month
      let movementsThisMonth = faker.number.int({ min: 2, max: 8 });
      
      // Apply recency bias (more movements in recent months)
      const recencyFactor = 1 + (i / months.length); // Increases from 1 to 2 over time
      movementsThisMonth = Math.round(movementsThisMonth * recencyFactor);
      
      // Create movements for this month
      for (let j = 0; j < movementsThisMonth; j++) {
        // Generate a random date within this month
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const movementDate = randomDate(startOfMonth, endOfMonth);
        
        // Apply seasonal factor to quantity
        const seasonalFactor = seasonalPattern[monthIndex];
        
        // Add some randomness to the pattern
        const randomFactor = faker.number.float({ min: 0.8, max: 1.2 });
        
        // Calculate final quantity with all factors
        const quantity = Math.max(1, Math.round(baseQuantity * seasonalFactor * trendFactor * randomFactor));
        
        // Create the stock movement
        await prisma.stockMovement.create({
          data: {
            itemId: item.id,
            type: MovementType.OUT,
            quantity,
            reason: 'Regular consumption',
            reference: `REF-${faker.string.alphanumeric(8).toUpperCase()}`,
            userId: userId,
            createdAt: movementDate,
          },
        });
      }
      
      // Occasionally add an IN movement (restocking)
      if (faker.number.int({ min: 1, max: 3 }) === 1) {
        const restockDate = randomDate(
          new Date(month.getFullYear(), month.getMonth(), 15),
          new Date(month.getFullYear(), month.getMonth() + 1, 0)
        );
        
        const restockQuantity = faker.number.int({ min: 20, max: 100 });
        
        await prisma.stockMovement.create({
          data: {
            itemId: item.id,
            type: MovementType.IN,
            quantity: restockQuantity,
            reason: 'Restock',
            reference: `RESTOCK-${faker.string.alphanumeric(8).toUpperCase()}`,
            userId: userId,
            createdAt: restockDate,
          },
        });
      }
    }
  }
}

// Function to generate a seasonal pattern (monthly factors)
function generateSeasonalPattern() {
  // Different seasonal patterns:
  // 1. Summer peak (higher in summer months)
  // 2. Winter peak (higher in winter months)
  // 3. Quarterly peak (higher at end of each quarter)
  // 4. Biannual peak (higher twice a year)
  // 5. Steady increase (gradually increasing throughout the year)
  
  const patternType = faker.number.int({ min: 1, max: 5 });
  
  // Create an array of 12 factors (one per month)
  const seasonalFactors = new Array(12).fill(1.0); // Default is no seasonality
  
  switch (patternType) {
    case 1: // Summer peak
      // Higher in June, July, August
      seasonalFactors[5] = 1.5; // June
      seasonalFactors[6] = 1.8; // July
      seasonalFactors[7] = 1.6; // August
      break;
      
    case 2: // Winter peak
      // Higher in November, December, January
      seasonalFactors[10] = 1.5; // November
      seasonalFactors[11] = 1.9; // December
      seasonalFactors[0] = 1.4;  // January
      break;
      
    case 3: // Quarterly peak
      // Higher in March, June, September, December
      seasonalFactors[2] = 1.6;  // March
      seasonalFactors[5] = 1.6;  // June
      seasonalFactors[8] = 1.6;  // September
      seasonalFactors[11] = 1.6; // December
      break;
      
    case 4: // Biannual peak
      // Higher in June and December
      seasonalFactors[5] = 1.7;  // June
      seasonalFactors[11] = 1.7; // December
      break;
      
    case 5: // Steady increase
      // Gradually increasing throughout the year
      for (let i = 0; i < 12; i++) {
        seasonalFactors[i] = 0.8 + (i * 0.04); // From 0.8 to 1.24
      }
      break;
  }
  
  return seasonalFactors;
}

// Removed duplicate code - the full implementation is at line 199

// Generate initial forecasts based on historical data
async function generateForecasts(items: any[]) {
  if (!CONFIG.GENERATE_FORECASTS) {
    return;
  }
  
  console.log('Generating initial forecasts...');
  
  for (const item of items) {
    // Get historical stock movements for this item
    const stockMovements = await prisma.stockMovement.findMany({
      where: {
        itemId: item.id,
        type: MovementType.OUT,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    
    if (stockMovements.length < 5) {
      continue; // Skip items with insufficient data
    }
    
    // Generate forecasts for different period types
    for (const periodType of ['MONTHLY', 'QUARTERLY'] as PeriodType[]) {
      // Group movements by period
      const periodData: Record<string, number> = {};
      
      for (const movement of stockMovements) {
        const period = generatePeriodKey(movement.createdAt, periodType);
        if (!periodData[period]) {
          periodData[period] = 0;
        }
        periodData[period] += movement.quantity;
      }
      
      // Convert to array and sort by period
      const timeSeriesData = Object.entries(periodData)
        .map(([period, quantity]) => ({ period, quantity }))
        .sort((a, b) => a.period.localeCompare(b.period));
      
      if (timeSeriesData.length < 3) {
        continue; // Skip if not enough periods
      }
      
      // Generate next period
      const lastPeriod = timeSeriesData[timeSeriesData.length - 1].period;
      let nextPeriod: string;
      
      if (periodType === 'MONTHLY') {
        const [year, month] = lastPeriod.split('-').map(Number);
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        nextPeriod = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      } else if (periodType === 'QUARTERLY') {
        const [year, quarter] = lastPeriod.split('-Q');
        const nextQuarter = Number(quarter) === 4 ? 1 : Number(quarter) + 1;
        const nextYear = Number(quarter) === 4 ? Number(year) + 1 : Number(year);
        nextPeriod = `${nextYear}-Q${nextQuarter}`;
      } else {
        continue; // Skip other period types
      }
      
      // Calculate simple moving average
      const lastValues = timeSeriesData.slice(-3).map(d => d.quantity);
      const movingAverage = Math.round(lastValues.reduce((sum, val) => sum + val, 0) / lastValues.length);
      
      // Add some randomness to the forecast
      const randomFactor = faker.number.float({ min: 0.85, max: 1.15 });
      const predictedDemand = Math.max(1, Math.round(movingAverage * randomFactor));
      
      // Create forecast
      await prisma.demandForecast.create({
        data: {
          id: `fcst${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`,
          itemId: item.id,
          period: nextPeriod,
          periodType,
          predictedDemand,
          confidence: faker.number.float({ min: 0.6, max: 0.9 }),
          algorithm: faker.helpers.arrayElement(['MOVING_AVERAGE', 'LINEAR_TREND']),
          factors: JSON.stringify({
            historicalPeriods: timeSeriesData.length,
            averageDemand: timeSeriesData.reduce((sum, d) => sum + d.quantity, 0) / timeSeriesData.length,
            lastValue: timeSeriesData[timeSeriesData.length - 1].quantity,
            seasonalityDetected: faker.helpers.arrayElement([true, false]),
            trendDirection: faker.helpers.arrayElement(['up', 'down', 'stable']),
          }),
        },
      });
    }
  }
  
  console.log('Forecasts generated successfully!');
}

// Main function to generate all data
async function main() {
  try {
    // Check if we have a user to associate with the data
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No users found in the database. Please create a user first.');
      return;
    }
    
    console.log('Starting data generation with the following configuration:');
    console.log(CONFIG);
    
    const categories = await generateCategories();
    console.log(`Generated ${categories.length} categories`);
    
    const suppliers = await generateSuppliers();
    console.log(`Generated ${suppliers.length} suppliers`);
    
    const items = await generateItems(categories, suppliers);
    console.log(`Generated ${items.length} items`);
    
    await generateStockMovements(items, user.id);
    console.log('Generated stock movements with seasonal patterns');
    
    await generateForecasts(items);
    
    console.log('Data generation completed successfully!');
  } catch (error) {
    console.error('Error generating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();