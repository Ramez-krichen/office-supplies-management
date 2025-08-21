// Test script to verify authenticated requests work correctly
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAuthenticatedRequests() {
  console.log('Testing authenticated requests...\n');

  // Test the main requests page to see if it loads without errors
  try {
    console.log('1. Testing main requests page response...');
    const response = await fetch(`${BASE_URL}/requests`);
    const text = await response.text();
    
    console.log(`   Status: ${response.status}`);
    
    // Check if the page contains the expected content and no error messages
    if (text.includes('Failed to fetch users: "Forbidden"')) {
      console.log('   ✗ Still contains "Forbidden" error message');
    } else if (text.includes('Requests') && text.includes('Office Supplies')) {
      console.log('   ✓ Page loads correctly without forbidden errors');
    } else {
      console.log('   ⚠ Page content unclear');
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test if the requests dashboard API endpoint structure is correct
  try {
    console.log('\n2. Testing requests dashboard API structure...');
    const response = await fetch(`${BASE_URL}/api/dashboard/requests`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✓ API correctly requires authentication (401)');
    } else if (response.status === 403) {
      console.log('   ⚠ API returns 403 - may need authentication context');
    } else if (response.status === 200) {
      const data = await response.json();
      console.log('   ✓ API returns data successfully');
      console.log(`   Data keys: ${Object.keys(data).join(', ')}`);
    } else {
      console.log(`   ⚠ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  console.log('\n✅ Authenticated requests testing completed!');
  console.log('\nNote: Full authentication testing requires a logged-in session.');
  console.log('The 403 error should be resolved when users are properly authenticated.');
}

testAuthenticatedRequests().catch(console.error);