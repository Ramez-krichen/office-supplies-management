const { PrismaClient } = require('@prisma/client');

// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = 'file:./comprehensive.db';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test notification query
    console.log('\nTesting notification query...');
    const notifications = await prisma.notification.findMany({
      where: {
        status: 'UNREAD'
      },
      take: 5
    });
    
    console.log(`✅ Found ${notifications.length} unread notifications`);
    
    if (notifications.length > 0) {
      console.log('\nFirst notification:');
      console.log(JSON.stringify(notifications[0], null, 2));
    }
    
    // Test database tables
    console.log('\nChecking database tables...');
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
    console.log('Tables found:', tables.map(t => t.name).join(', '));
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.meta) console.error('Error meta:', error.meta);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Database disconnected');
  }
}

testConnection();