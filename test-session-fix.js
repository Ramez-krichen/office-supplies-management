const { PrismaClient } = require('@prisma/client');

async function testSessionFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing session fix...\n');
    
    // Get the admin user from database
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found in database');
      return;
    }
    
    console.log('✅ Admin user found in database:');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Role: ${adminUser.role}\n`);
    
    // Check if there are any pending requests
    const pendingRequests = await prisma.request.findMany({
      where: { status: 'PENDING' },
      include: { approvals: true },
      take: 3
    });
    
    console.log(`📋 Found ${pendingRequests.length} pending requests\n`);
    
    if (pendingRequests.length > 0) {
      console.log('Sample pending request:');
      const request = pendingRequests[0];
      console.log(`   ID: ${request.id}`);
      console.log(`   Title: ${request.title}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Approvals: ${request.approvals.length}`);
      
      if (request.approvals.length > 0) {
        console.log('   Approval details:');
        request.approvals.forEach((approval, index) => {
          console.log(`     ${index + 1}. Approver ID: ${approval.approverId}`);
          console.log(`        Status: ${approval.status}`);
          console.log(`        Level: ${approval.level}`);
        });
      }
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Clear your browser cookies/session');
    console.log('2. Go to http://localhost:3001');
    console.log('3. Sign in with admin credentials');
    console.log('4. Try approving/rejecting a request');
    console.log('\nThe session should now use the correct user ID from the database.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionFix();
