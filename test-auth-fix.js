const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testDatabaseAndAuth() {
  try {
    console.log('🔍 Testing database connection and schema...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if users table exists by trying to count users
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists with ${userCount} users`);
    
    // Check if we have any test users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true
      },
      take: 5
    });
    
    if (users.length > 0) {
      console.log('✅ Found test users in database:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.status}`);
      });
      
      // Test password validation for the first user
      const firstUser = await prisma.user.findFirst({
        where: { status: 'ACTIVE' }
      });
      
      if (firstUser) {
        console.log(`\n🔐 Testing password validation for: ${firstUser.email}`);
        
        // Test with default password (usually 'password' for seeded users)
        const testPasswords = ['password123', 'password', 'admin123', 'test123'];
        
        for (const testPassword of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPassword, firstUser.password);
            if (isValid) {
              console.log(`✅ Password validation successful with: "${testPassword}"`);
              break;
            } else {
              console.log(`❌ Password "${testPassword}" is not valid`);
            }
          } catch (error) {
            console.log(`❌ Error testing password "${testPassword}":`, error.message);
          }
        }
      }
    } else {
      console.log('⚠️ No users found in database. Authentication will fail until users are created.');
    }
    
    // Test other important tables
    const tableChecks = [
      { name: 'departments', model: prisma.department },
      { name: 'categories', model: prisma.category },
      { name: 'suppliers', model: prisma.supplier },
      { name: 'items', model: prisma.item }
    ];
    
    console.log('\n📊 Checking other tables:');
    for (const { name, model } of tableChecks) {
      try {
        const count = await model.count();
        console.log(`   - ${name}: ${count} records`);
      } catch (error) {
        console.log(`   - ${name}: Error - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    if (error.message.includes('does not exist')) {
      console.log('\n💡 The database schema appears to be missing. Try running:');
      console.log('   npx prisma db push --force-reset');
      console.log('   npx prisma db seed');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseAndAuth();
