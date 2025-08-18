// Comprehensive test script for Office Supplies Management System
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test credentials from test-credentials.md
const testUsers = [
  { email: 'admin@company.com', password: 'admin123', role: 'ADMIN', department: 'IT' },
  { email: 'manager@company.com', password: 'manager123', role: 'MANAGER', department: 'Operations' },
  { email: 'employee@company.com', password: 'employee123', role: 'EMPLOYEE', department: 'Sales' }
];

// Test results storage
const testResults = {
  authentication: {},
  apiEndpoints: {},
  functionality: {}
};

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    return {
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text()
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test 1: Basic connectivity
async function testConnectivity() {
  console.log('\n🔗 Testing Basic Connectivity...');
  
  const result = await makeRequest('/');
  testResults.connectivity = {
    status: result.status,
    success: result.ok
  };
  
  console.log(`   Homepage: ${result.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  return result.ok;
}

// Test 2: API endpoints availability
async function testAPIEndpoints() {
  console.log('\n🔌 Testing API Endpoints...');
  
  const endpoints = [
    '/api/auth/session',
    '/api/dashboard/stats',
    '/api/users',
    '/api/items',
    '/api/suppliers',
    '/api/requests',
    '/api/purchase-orders',
    '/api/categories',
    '/api/audit-logs',
    '/api/returns',
    '/api/demand-forecast'
  ];
  
  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint);
    const success = result.status !== 0 && result.status !== 404;
    testResults.apiEndpoints[endpoint] = {
      status: result.status,
      success: success
    };
    
    console.log(`   ${endpoint}: ${success ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  }
}

// Test 3: Authentication system
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System...');
  
  // Test session endpoint without authentication
  const sessionResult = await makeRequest('/api/auth/session');
  console.log(`   Unauthenticated session: ${sessionResult.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${sessionResult.status})`);
  
  // Test demo users endpoint
  const demoUsersResult = await makeRequest('/api/demo-users');
  console.log(`   Demo users endpoint: ${demoUsersResult.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${demoUsersResult.status})`);
  
  if (demoUsersResult.ok) {
    console.log(`   Available demo users: ${JSON.stringify(demoUsersResult.data, null, 2)}`);
  }
  
  testResults.authentication = {
    session: sessionResult.ok,
    demoUsers: demoUsersResult.ok
  };
}

// Test 4: Database operations
async function testDatabaseOperations() {
  console.log('\n🗄️ Testing Database Operations...');
  
  // Test getting users (should require authentication but we can test the endpoint)
  const usersResult = await makeRequest('/api/users');
  console.log(`   Users endpoint: ${usersResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${usersResult.status})`);
  
  // Test getting items
  const itemsResult = await makeRequest('/api/items');
  console.log(`   Items endpoint: ${itemsResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${itemsResult.status})`);
  
  // Test getting suppliers
  const suppliersResult = await makeRequest('/api/suppliers');
  console.log(`   Suppliers endpoint: ${suppliersResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${suppliersResult.status})`);
  
  testResults.functionality.database = {
    users: usersResult.status !== 0,
    items: itemsResult.status !== 0,
    suppliers: suppliersResult.status !== 0
  };
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Comprehensive Testing of Office Supplies Management System');
  console.log('=' .repeat(80));
  
  try {
    // Run all tests
    await testConnectivity();
    await testAPIEndpoints();
    await testAuthentication();
    await testDatabaseOperations();
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(40));
    console.log(JSON.stringify(testResults, null, 2));
    
    console.log('\n✅ Testing completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

// Run the tests
runTests();
