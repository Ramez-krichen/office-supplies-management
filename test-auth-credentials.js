// Test script to verify database connection and user credentials
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function testUserCredentials(email, password) {
  try {
    console.log(`Testing credentials for user: ${email}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return false;
    }
    
    console.log(`✅ User found: ${email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Department: ${user.department}`);
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      console.log(`✅ Password is valid for user: ${email}`);
      return true;
    } else {
      console.error(`❌ Password is invalid for user: ${email}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error testing credentials for ${email}:`, error);
    return false;
  }
}

async function main() {
  try {
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      console.error('❌ Cannot proceed with credential testing due to database connection failure');
      return;
    }
    
    // Test demo accounts
    const demoAccounts = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'manager@example.com', password: 'manager123' },
      { email: 'employee@example.com', password: 'employee123' }
    ];
    
    console.log('\n🔑 Testing demo account credentials:');
    console.log('=====================================');
    
    for (const account of demoAccounts) {
      const result = await testUserCredentials(account.email, account.password);
      console.log(`${result ? '✅' : '❌'} ${account.email}: ${result ? 'PASSED' : 'FAILED'}\n`);
    }
    
    // List all users
    console.log('\n👥 All users in database:');
    console.log('========================');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        department: true
      },
      take: 10
    });
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - ${user.name || 'No name'}`);
      console.log(`   Status: ${user.status}, Department: ${user.department || 'None'}`);
    });
    
    if (users.length > 10) {
      console.log(`... and ${users.length - 10} more users`);
    }
    
  } catch (error) {
    console.error('❌ Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();