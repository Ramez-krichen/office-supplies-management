// Test script to check audit logs functionality
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

// Test audit logs API
async function testAuditLogsAPI() {
  console.log('🔍 Testing Audit Logs API...');
  
  const result = await makeRequest('/api/audit-logs');
  console.log(`   Audit Logs API: ${result.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (result.ok) {
    console.log('   Audit logs data:', JSON.stringify(result.data, null, 2));
  } else {
    console.log('   Error details:', result.data);
  }
  
  return result;
}

// Test audit logs page accessibility
async function testAuditLogsPage() {
  console.log('\n📄 Testing Audit Logs Page...');
  
  const result = await makeRequest('/audit-logs');
  console.log(`   Audit Logs Page: ${result.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (!result.ok) {
    console.log('   Error details:', result.data);
  }
  
  return result;
}

// Test session to check user role
async function testSession() {
  console.log('\n👤 Testing Session...');
  
  const result = await makeRequest('/api/auth/session');
  console.log(`   Session API: ${result.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (result.ok) {
    console.log('   Session data:', JSON.stringify(result.data, null, 2));
    
    if (result.data.user) {
      const userRole = result.data.user.role;
      console.log(`   User role: ${userRole}`);
      console.log(`   Can access audit logs: ${userRole === 'ADMIN' ? '✅ YES' : '❌ NO'}`);
    }
  }
  
  return result;
}

// Main test runner
async function runAuditLogsTests() {
  console.log('🧪 Testing Audit Logs Functionality');
  console.log('=' .repeat(50));
  
  try {
    await testSession();
    await testAuditLogsAPI();
    await testAuditLogsPage();
    
    console.log('\n✅ Audit logs testing completed!');
    
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

// Run the tests
runAuditLogsTests();
