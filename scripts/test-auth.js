const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthentication() {
  try {
    console.log('🔐 Testing Authentication Flow...\n');

    const testCredentials = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'manager@example.com', password: 'manager123' },
      { email: 'employee@example.com', password: 'employee123' }
    ];

    for (const creds of testCredentials) {
      console.log(`Testing ${creds.email}...`);
      
      // Step 1: Find user
      const user = await prisma.user.findUnique({
        where: { email: creds.email }
      });

      if (!user) {
        console.log(`❌ User not found: ${creds.email}`);
        continue;
      }

      console.log(`✅ User found: ${user.name} (${user.role})`);

      // Step 2: Verify password
      const isPasswordValid = await bcrypt.compare(creds.password, user.password);
      
      if (isPasswordValid) {
        console.log(`✅ Password verification: SUCCESS`);
        
        // Step 3: Simulate what NextAuth would return
        const authResult = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          lastSignIn: new Date(),
        };
        
        console.log(`✅ Auth result:`, authResult);
      } else {
        console.log(`❌ Password verification: FAILED`);
        console.log(`   Stored hash: ${user.password.substring(0, 15)}...`);
        
        // Test if it's a hash format issue
        const testHash = await bcrypt.hash(creds.password, 12);
        console.log(`   Test hash: ${testHash.substring(0, 15)}...`);
      }
      
      console.log('');
    }

    // Test invalid credentials
    console.log('Testing invalid credentials...');
    const invalidUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (invalidUser) {
      const invalidPassword = await bcrypt.compare('wrongpassword', invalidUser.password);
      console.log(`❌ Invalid password test: ${invalidPassword ? 'FAILED (should be false)' : 'SUCCESS (correctly rejected)'}`);
    }

    console.log('\n🎉 Authentication test completed!');
    
  } catch (error) {
    console.error('❌ Error during authentication test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthentication();
