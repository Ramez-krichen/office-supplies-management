// Test script to debug quick reports API
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

// Test quick reports API
async function testQuickReportsAPI() {
  console.log('📊 Testing Quick Reports API...');
  
  // Test without period parameter
  const result1 = await makeRequest('/api/reports/quick');
  console.log(`   Quick Reports (no period): ${result1.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${result1.status})`);
  
  if (!result1.ok) {
    console.log('   Error details:', result1.data);
  } else {
    console.log('   Response keys:', Object.keys(result1.data));
  }
  
  // Test with period parameter
  const result2 = await makeRequest('/api/reports/quick?period=30');
  console.log(`   Quick Reports (30 days): ${result2.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${result2.status})`);
  
  if (!result2.ok) {
    console.log('   Error details:', result2.data);
  } else {
    console.log('   Response keys:', Object.keys(result2.data));
  }
  
  return { result1, result2 };
}

// Test session to check authentication
async function testSession() {
  console.log('\n👤 Testing Session...');
  
  const result = await makeRequest('/api/auth/session');
  console.log(`   Session API: ${result.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (result.ok) {
    console.log('   User authenticated:', !!result.data.user);
    if (result.data.user) {
      console.log('   User role:', result.data.user.role);
    }
  }
  
  return result;
}

// Test other report endpoints
async function testOtherReports() {
  console.log('\n📈 Testing Other Report Endpoints...');
  
  const analyticsResult = await makeRequest('/api/reports/analytics');
  console.log(`   Analytics Reports: ${analyticsResult.status !== 0 ? '✅ PASS' : '❌ FAIL'} (Status: ${analyticsResult.status})`);
  
  if (!analyticsResult.ok) {
    console.log('   Analytics error:', analyticsResult.data);
  }
  
  return { analyticsResult };
}

// Main test runner
async function runQuickReportsTests() {
  console.log('🧪 Testing Quick Reports Functionality');
  console.log('=' .repeat(50));
  
  try {
    await testSession();
    await testQuickReportsAPI();
    await testOtherReports();
    
    console.log('\n✅ Quick reports testing completed!');
    
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

// Run the tests
runQuickReportsTests();
