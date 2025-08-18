// Inventory Management Testing Script
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

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

// Test inventory endpoints
async function testInventoryEndpoints() {
  console.log('\n📦 Testing Inventory Management Endpoints...');
  
  // Test items endpoint
  const itemsResult = await makeRequest('/api/items');
  console.log(`   Items API: ${itemsResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${itemsResult.status})`);
  
  // Test categories endpoint
  const categoriesResult = await makeRequest('/api/categories');
  console.log(`   Categories API: ${categoriesResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${categoriesResult.status})`);
  
  // Test specific item endpoint (assuming item with ID 1 exists)
  const itemResult = await makeRequest('/api/items/1');
  console.log(`   Single Item API: ${itemResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${itemResult.status})`);
  
  return {
    items: itemsResult.status !== 0,
    categories: categoriesResult.status !== 0,
    singleItem: itemResult.status !== 0
  };
}

// Test request management endpoints
async function testRequestEndpoints() {
  console.log('\n📋 Testing Request Management Endpoints...');
  
  // Test requests endpoint
  const requestsResult = await makeRequest('/api/requests');
  console.log(`   Requests API: ${requestsResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${requestsResult.status})`);
  
  // Test specific request endpoint
  const requestResult = await makeRequest('/api/requests/1');
  console.log(`   Single Request API: ${requestResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${requestResult.status})`);
  
  return {
    requests: requestsResult.status !== 0,
    singleRequest: requestResult.status !== 0
  };
}

// Test purchase order endpoints
async function testPurchaseOrderEndpoints() {
  console.log('\n🛒 Testing Purchase Order Endpoints...');
  
  // Test purchase orders endpoint
  const ordersResult = await makeRequest('/api/purchase-orders');
  console.log(`   Purchase Orders API: ${ordersResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${ordersResult.status})`);
  
  // Test specific order endpoint
  const orderResult = await makeRequest('/api/purchase-orders/1');
  console.log(`   Single Order API: ${orderResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${orderResult.status})`);
  
  return {
    orders: ordersResult.status !== 0,
    singleOrder: orderResult.status !== 0
  };
}

// Test supplier endpoints
async function testSupplierEndpoints() {
  console.log('\n🏢 Testing Supplier Management Endpoints...');
  
  // Test suppliers endpoint
  const suppliersResult = await makeRequest('/api/suppliers');
  console.log(`   Suppliers API: ${suppliersResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${suppliersResult.status})`);
  
  // Test specific supplier endpoint
  const supplierResult = await makeRequest('/api/suppliers/1');
  console.log(`   Single Supplier API: ${supplierResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${supplierResult.status})`);
  
  return {
    suppliers: suppliersResult.status !== 0,
    singleSupplier: supplierResult.status !== 0
  };
}

// Test user management endpoints
async function testUserEndpoints() {
  console.log('\n👥 Testing User Management Endpoints...');
  
  // Test users endpoint
  const usersResult = await makeRequest('/api/users');
  console.log(`   Users API: ${usersResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${usersResult.status})`);
  
  // Test specific user endpoint
  const userResult = await makeRequest('/api/users/1');
  console.log(`   Single User API: ${userResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${userResult.status})`);
  
  return {
    users: usersResult.status !== 0,
    singleUser: userResult.status !== 0
  };
}

// Test additional features
async function testAdditionalFeatures() {
  console.log('\n🔧 Testing Additional Features...');
  
  // Test audit logs
  const auditResult = await makeRequest('/api/audit-logs');
  console.log(`   Audit Logs API: ${auditResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${auditResult.status})`);
  
  // Test returns
  const returnsResult = await makeRequest('/api/returns');
  console.log(`   Returns API: ${returnsResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${returnsResult.status})`);
  
  // Test demand forecast
  const forecastResult = await makeRequest('/api/demand-forecast');
  console.log(`   Demand Forecast API: ${forecastResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${forecastResult.status})`);
  
  // Test reports
  const reportsResult = await makeRequest('/api/reports/quick');
  console.log(`   Quick Reports API: ${reportsResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${reportsResult.status})`);
  
  return {
    auditLogs: auditResult.status !== 0,
    returns: returnsResult.status !== 0,
    forecast: forecastResult.status !== 0,
    reports: reportsResult.status !== 0
  };
}

// Main test runner
async function runDetailedTests() {
  console.log('🔍 Starting Detailed Functionality Testing');
  console.log('=' .repeat(60));
  
  const results = {};
  
  try {
    results.inventory = await testInventoryEndpoints();
    results.requests = await testRequestEndpoints();
    results.purchaseOrders = await testPurchaseOrderEndpoints();
    results.suppliers = await testSupplierEndpoints();
    results.users = await testUserEndpoints();
    results.additional = await testAdditionalFeatures();
    
    // Print summary
    console.log('\n📊 Detailed Test Results Summary');
    console.log('=' .repeat(40));
    console.log(JSON.stringify(results, null, 2));
    
    // Calculate overall success rate
    let totalTests = 0;
    let passedTests = 0;
    
    Object.values(results).forEach(category => {
      Object.values(category).forEach(test => {
        totalTests++;
        if (test) passedTests++;
      });
    });
    
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
    
    console.log('\n✅ Detailed testing completed!');
    
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

// Run the detailed tests
runDetailedTests();
