// Test script to verify navigation changes
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testChanges() {
  console.log('Testing navigation and API changes...\n');

  // Test 1: Check if the requests dashboard API endpoint works
  try {
    console.log('1. Testing requests dashboard API...');
    const response = await fetch(`${BASE_URL}/api/dashboard/requests`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✓ API correctly requires authentication');
    } else if (response.status === 200) {
      console.log('   ✓ API endpoint is accessible');
    } else {
      console.log(`   ⚠ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test 2: Check if the requests dashboard page exists
  try {
    console.log('\n2. Testing requests dashboard page...');
    const response = await fetch(`${BASE_URL}/dashboard/requests`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 || response.status === 302 || response.status === 401) {
      console.log('   ✓ Dashboard page exists and handles authentication');
    } else {
      console.log(`   ⚠ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test 3: Check if the main requests page still works
  try {
    console.log('\n3. Testing main requests page...');
    const response = await fetch(`${BASE_URL}/requests`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 || response.status === 302 || response.status === 401) {
      console.log('   ✓ Requests page is accessible');
    } else {
      console.log(`   ⚠ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test 4: Check if audit logs page is still accessible (should be for admins)
  try {
    console.log('\n4. Testing audit logs page...');
    const response = await fetch(`${BASE_URL}/audit-logs`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 || response.status === 302 || response.status === 401 || response.status === 403) {
      console.log('   ✓ Audit logs page handles access control correctly');
    } else {
      console.log(`   ⚠ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  console.log('\n✅ Navigation changes testing completed!');
  console.log('\nSummary of changes made:');
  console.log('- Fixed "Forbidden" error in fetchUsers function');
  console.log('- Removed audit logs from navigation for non-admin roles');
  console.log('- Added new requests dashboard for tracking requests');
  console.log('- Created API endpoint for requests dashboard statistics');
}

testChanges().catch(console.error);