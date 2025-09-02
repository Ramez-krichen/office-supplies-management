const { PrismaClient } = require('@prisma/client');

async function testDbConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    console.log('\n=== Testing User Count ===');
    const userCount = await prisma.user.count();
    console.log('Total users:', userCount);
    
    if (userCount > 0) {
      console.log('\n=== Current Users ===');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          status: true
        }
      });
      
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Status: ${user.status} - Dept: ${user.department || 'None'}`);
      });
      
      console.log('\n=== Admin Users ===');
      const adminUsers = users.filter(u => u.role === 'ADMIN');
      console.log('Admin users found:', adminUsers.length);
      adminUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
    }
    
    console.log('\n=== Testing Supplier Count ===');
    const supplierCount = await prisma.supplier.count();
    console.log('Total suppliers:', supplierCount);
    
  } catch (error) {
    console.error('❌ Database error:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.meta) {
      console.error('Error meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

testDbConnection();