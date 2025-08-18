// Simple script to check database data
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseData() {
  try {
    console.log('🔍 Checking Database Data...\n');
    
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount} records`);
    
    if (userCount > 0) {
      const sampleUsers = await prisma.user.findMany({
        take: 3,
        select: { name: true, email: true, role: true, department: true }
      });
      console.log('   Sample users:', sampleUsers);
    }
    
    // Check items
    const itemCount = await prisma.item.count();
    console.log(`\n📦 Items: ${itemCount} records`);
    
    if (itemCount > 0) {
      const sampleItems = await prisma.item.findMany({
        take: 3,
        select: { name: true, price: true, currentStock: true, unit: true }
      });
      console.log('   Sample items:', sampleItems);
    }
    
    // Check suppliers
    const supplierCount = await prisma.supplier.count();
    console.log(`\n🏢 Suppliers: ${supplierCount} records`);
    
    if (supplierCount > 0) {
      const sampleSuppliers = await prisma.supplier.findMany({
        take: 3,
        select: { name: true, email: true, phone: true }
      });
      console.log('   Sample suppliers:', sampleSuppliers);
    }
    
    // Check requests
    const requestCount = await prisma.request.count();
    console.log(`\n📋 Requests: ${requestCount} records`);
    
    // Check purchase orders
    const orderCount = await prisma.purchaseOrder.count();
    console.log(`\n🛒 Purchase Orders: ${orderCount} records`);
    
    // Check categories
    const categoryCount = await prisma.category.count();
    console.log(`\n📂 Categories: ${categoryCount} records`);
    
    if (categoryCount > 0) {
      const categories = await prisma.category.findMany({
        select: { name: true, description: true }
      });
      console.log('   Categories:', categories);
    }
    
    // Check audit logs
    const auditCount = await prisma.auditLog.count();
    console.log(`\n📊 Audit Logs: ${auditCount} records`);
    
    // Check returns
    const returnCount = await prisma.return.count();
    console.log(`\n↩️ Returns: ${returnCount} records`);
    
    // Check demand forecasts
    const forecastCount = await prisma.demandForecast.count();
    console.log(`\n📈 Demand Forecasts: ${forecastCount} records`);
    
    console.log('\n✅ Database check completed!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseData();
