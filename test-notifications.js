const { PrismaClient } = require('@prisma/client');

// Test the notification system
// Set the DATABASE_URL environment variable
process.env.DATABASE_URL = 'file:./prisma/dev.db';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testNotifications() {
  console.log('Testing notification functionality...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('='.repeat(50));
  
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');
    
    // Create a test notification
    console.log('Creating a test notification...');
    const newNotification = await prisma.notification.create({
      data: {
        type: 'REQUEST_APPROVAL',
        title: 'Test Notification',
        message: 'This is a test notification to verify the database connection is working',
        status: 'UNREAD',
        priority: 'HIGH',
        targetRole: 'ADMIN'
      }
    });
    console.log('✅ Notification created:', {
      id: newNotification.id,
      title: newNotification.title,
      status: newNotification.status
    });
    console.log();
    
    // Query unread notifications (simulating the API endpoint)
    console.log('Querying UNREAD notifications (simulating API endpoint)...');
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        status: 'UNREAD'
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });
    
    console.log(`✅ Found ${unreadNotifications.length} unread notifications`);
    
    if (unreadNotifications.length > 0) {
      console.log('\nUnread notifications:');
      unreadNotifications.forEach((notif, index) => {
        console.log(`${index + 1}. [${notif.priority}] ${notif.title} - ${notif.status}`);
      });
    }
    
    // Get counts by status
    console.log('\nGetting notification counts by status...');
    const counts = await prisma.notification.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    
    const statusCounts = counts.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {});
    
    console.log('✅ Notification counts:', statusCounts);
    
    // Clean up - mark the test notification as read
    console.log('\nCleaning up test notification...');
    await prisma.notification.update({
      where: { id: newNotification.id },
      data: { status: 'READ' }
    });
    console.log('✅ Test notification marked as READ');
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All notification tests passed successfully!');
    console.log('The database connection is working correctly.');
    console.log('The original error was likely due to Next.js configuration issues.');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
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

testNotifications();