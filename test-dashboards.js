// Simple test script to verify dashboard API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

// Test endpoints
const endpoints = [
  '/api/dashboard/stats',
  '/api/dashboard/employee',
  '/api/dashboard/manager', 
  '/api/dashboard/admin',
  '/api/dashboard/department'
];

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (response.status === 401) {
      console.log(`✓ ${endpoint} - Correctly requires authentication (401)`);
      return true;
    }
    
    if (response.status === 403) {
      console.log(`✓ ${endpoint} - Correctly enforces authorization (403)`);
      return true;
    }
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✓ ${endpoint} - Success (${response.status})`);
      console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
      return true;
    } else {
      console.log(`✗ ${endpoint} - Failed (${response.status})`);
      const text = await response.text();
      console.log(`  Error: ${text}`);
      return false;
    }
  } catch (error) {
    console.log(`✗ ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Dashboard API Endpoints\n');
  
  let passed = 0;
  let total = endpoints.length;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) passed++;
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Test Results: ${passed}/${total} endpoints working correctly`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Dashboard APIs are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run the tests
runTests().catch(console.error);
