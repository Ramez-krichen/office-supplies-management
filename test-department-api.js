const fetch = require('node-fetch');

async function testDepartmentAPI() {
  console.log('=== Testing Department Dashboard API ===\n');
  
  const baseUrl = 'http://localhost:3001'; // Based on your .env.local
  
  try {
    // First, we need to sign in to get a session
    console.log('1. Attempting to sign in...');
    
    // Try with the main admin account
    const signInResponse = await fetch(`${baseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'admin123' // Default password from seed data
      })
    });
    
    if (!signInResponse.ok) {
      console.log('❌ Sign in failed. Trying with csrfToken...');
      
      // Get CSRF token first
      const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
      const csrfData = await csrfResponse.json();
      
      // Try sign in with CSRF token
      const signInWithCsrf = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: 'admin@company.com',
          password: 'admin123',
          csrfToken: csrfData.csrfToken
        })
      });
      
      if (!signInWithCsrf.ok) {
        console.log('❌ Authentication failed. Please ensure the server is running and credentials are correct.');
        return;
      }
    }
    
    console.log('✅ Authentication successful\n');
    
    // Test department dashboard endpoint
    console.log('2. Testing department dashboard endpoint...');
    
    // Test without department parameter (should use user's department)
    console.log('   a. Testing without department parameter...');
    const response1 = await fetch(`${baseUrl}/api/dashboard/department`, {
      credentials: 'include'
    });
    
    console.log(`   Response status: ${response1.status}`);
    
    if (response1.ok) {
      const data = await response1.json();
      console.log('   ✅ Successfully fetched department dashboard data');
      console.log(`   Department: ${data.departmentInfo?.name || 'Unknown'}`);
      console.log(`   Stats count: ${data.stats?.length || 0}`);
      console.log(`   Recent requests: ${data.recentRequests?.length || 0}`);
      console.log(`   Team members: ${data.departmentUsers?.length || 0}`);
    } else {
      const error = await response1.text();
      console.log(`   ❌ Failed to fetch data: ${error}`);
    }
    
    // Test with specific department parameter (for admin users)
    console.log('\n   b. Testing with specific department (IT)...');
    const response2 = await fetch(`${baseUrl}/api/dashboard/department?department=IT`, {
      credentials: 'include'
    });
    
    console.log(`   Response status: ${response2.status}`);
    
    if (response2.ok) {
      const data = await response2.json();
      console.log('   ✅ Successfully fetched IT department data');
      console.log(`   Monthly spending: ${data.departmentInfo?.monthlySpending || 0}`);
      console.log(`   Total spending: ${data.departmentInfo?.totalSpending || 0}`);
    } else {
      const error = await response2.text();
      console.log(`   ❌ Failed to fetch IT data: ${error}`);
    }
    
    console.log('\n=== Summary ===');
    console.log('The department dashboard API should now be working.');
    console.log('If you still see errors, check:');
    console.log('1. The development server is running on port 3001');
    console.log('2. You are logged in with proper credentials');
    console.log('3. The user has the appropriate role (ADMIN or MANAGER)');
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\nMake sure the Next.js development server is running:');
    console.log('npm run dev');
  }
}

// Check if node-fetch is installed
try {
  require.resolve('node-fetch');
  testDepartmentAPI();
} catch(e) {
  console.log('Installing node-fetch...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('node-fetch installed. Please run the script again.');
}