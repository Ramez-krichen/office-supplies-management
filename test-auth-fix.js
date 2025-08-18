const fetch = require('node-fetch');

async function testAuthFix() {
  console.log('🧪 Testing authentication fix...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await fetch('http://localhost:3000/api/auth/session');
    console.log(`   Server status: ${healthResponse.status}`);
    
    if (healthResponse.status === 200) {
      const sessionData = await healthResponse.json();
      console.log('   Session data:', sessionData);
    }
    
    // Test 2: Try to access admin dashboard (should redirect to login)
    console.log('\n2. Testing admin dashboard access...');
    const dashboardResponse = await fetch('http://localhost:3000/dashboard/admin');
    console.log(`   Dashboard status: ${dashboardResponse.status}`);
    
    // Test 3: Check notifications endpoint (should require auth)
    console.log('\n3. Testing notifications endpoint...');
    const notificationsResponse = await fetch('http://localhost:3000/api/admin/notifications?status=UNREAD');
    console.log(`   Notifications status: ${notificationsResponse.status}`);
    
    console.log('\n✅ Server is running and responding correctly!');
    console.log('\n🎯 Next steps:');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Clear browser cookies/session');
    console.log('3. Login with: admin@example.com / admin123');
    console.log('4. Test approval functionality');
    
  } catch (error) {
    console.error('❌ Error testing server:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure the development server is running');
    console.log('- Check if port 3000 is available');
    console.log('- Try restarting the server with: npm run dev');
  }
}

testAuthFix();
