// Test script to debug add supplier functionality
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const testUser = { email: 'admin@example.com', password: 'admin123' };

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
      data: response.ok ? await response.json() : await response.text(),
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test authentication first
async function testAuthentication() {
  console.log('🔐 Testing Authentication...');
  
  // Check session
  const sessionResult = await makeRequest('/api/auth/session');
  console.log(`   Session check: ${sessionResult.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${sessionResult.status})`);
  
  if (sessionResult.ok) {
    console.log('   Session data:', JSON.stringify(sessionResult.data, null, 2));
  }
  
  return sessionResult.ok;
}

// Test getting existing suppliers
async function testGetSuppliers() {
  console.log('\n📋 Testing Get Suppliers...');
  
  const result = await makeRequest('/api/suppliers');
  console.log(`   Get suppliers: ${result.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (result.ok) {
    console.log(`   Found ${result.data.suppliers ? result.data.suppliers.length : 0} suppliers`);
  } else {
    console.log('   Error:', result.data);
  }
  
  return result;
}

// Test creating a new supplier
async function testCreateSupplier() {
  console.log('\n➕ Testing Create Supplier...');
  
  const newSupplier = {
    name: `Test Supplier ${Date.now()}`,
    contactPerson: 'Test Contact Person',
    email: 'test@supplier.com',
    phone: '+1-555-0123',
    address: '123 Test Street, Test City, TC 12345',
    website: 'https://testsupplier.com',
    taxId: 'TAX123456',
    paymentTerms: 'Net 30',
    notes: 'This is a test supplier created by automated testing'
  };
  
  console.log('   Attempting to create supplier:', newSupplier.name);
  
  const result = await makeRequest('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(newSupplier)
  });
  
  console.log(`   Create supplier: ${result.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (result.ok) {
    console.log('   Created supplier:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('   Error details:', result.data);
  }
  
  return result;
}

// Test with minimal required fields only
async function testCreateMinimalSupplier() {
  console.log('\n➕ Testing Create Minimal Supplier...');
  
  const minimalSupplier = {
    name: `Minimal Supplier ${Date.now()}`,
    contactPerson: 'Minimal Contact'
  };
  
  console.log('   Attempting to create minimal supplier:', minimalSupplier.name);
  
  const result = await makeRequest('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(minimalSupplier)
  });
  
  console.log(`   Create minimal supplier: ${result.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (result.ok) {
    console.log('   Created supplier:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('   Error details:', result.data);
  }
  
  return result;
}

// Test with invalid data
async function testCreateInvalidSupplier() {
  console.log('\n❌ Testing Create Invalid Supplier...');
  
  const invalidSupplier = {
    name: '', // Empty name should fail
    contactPerson: ''
  };
  
  const result = await makeRequest('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(invalidSupplier)
  });
  
  console.log(`   Create invalid supplier: ${!result.ok ? '✅ PASS (Expected failure)' : '❌ FAIL (Should have failed)'} (Status: ${result.status})`);
  console.log('   Error details:', result.data);
  
  return result;
}

// Main test runner
async function runSupplierTests() {
  console.log('🧪 Testing Add Supplier Functionality');
  console.log('=' .repeat(50));
  
  try {
    // Test authentication first
    const authOk = await testAuthentication();
    
    // Test getting existing suppliers
    await testGetSuppliers();
    
    // Test creating suppliers
    await testCreateSupplier();
    await testCreateMinimalSupplier();
    await testCreateInvalidSupplier();
    
    console.log('\n✅ Supplier testing completed!');
    
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

// Run the tests
runSupplierTests();
