// Test script to check API accessibility
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAPIAccess() {
  console.log('🔍 Testing API Access...\n');
  
  try {
    // Test basic connectivity
    console.log('1. Testing basic connectivity...');
    const homeResponse = await fetch(BASE_URL);
    console.log(`Home page: ${homeResponse.status} ${homeResponse.statusText}`);
    
    // Test API endpoints without authentication
    console.log('\n2. Testing API endpoints...');
    
    const endpoints = [
      '/api/auth/session',
      '/api/items',
      '/api/purchase-orders',
      '/api/suppliers',
      '/api/categories'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const statusText = response.status === 401 ? 'Unauthorized (expected)' : response.statusText;
        console.log(`${endpoint}: ${response.status} ${statusText}`);
        
        if (response.status === 200) {
          const data = await response.json();
          console.log(`  ✅ Success: ${JSON.stringify(data).substring(0, 100)}...`);
        } else if (response.status === 401) {
          console.log(`  ⚠️  Authentication required (this is normal)`);
        } else {
          const errorText = await response.text();
          console.log(`  ❌ Error: ${errorText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`${endpoint}: ❌ Connection error - ${error.message}`);
      }
    }
    
    console.log('\n3. Summary:');
    console.log('If you see "401 Unauthorized" for API endpoints, that\'s normal.');
    console.log('The issue might be that you need to sign in first.');
    console.log('\nTo fix the loading issue:');
    console.log('1. Go to http://localhost:3000/auth/signin');
    console.log('2. Sign in with your credentials');
    console.log('3. Then navigate to the inventory page');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

testAPIAccess();
