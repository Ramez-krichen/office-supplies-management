const fetch = require('node-fetch');

async function testPurchaseOrderAPI() {
  try {
    console.log('Testing purchase order API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/dashboard/system/purchase-orders', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test' // This would need a real session token
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('API Response structure:');
    console.log('- summary keys:', Object.keys(data.summary || {}));
    console.log('- orders keys:', Object.keys(data.orders || {}));
    console.log('- total orders:', data.summary?.total || 0);
    console.log('- recent orders:', data.summary?.recent || 0);
    
    // Check if we have the expected data structure
    const hasExpectedStructure = data.summary && data.orders;
    console.log('Has expected structure:', hasExpectedStructure);
    
    return hasExpectedStructure;
    
  } catch (error) {
    console.error('Test error:', error.message);
    return false;
  }
}

// Run the test
testPurchaseOrderAPI().then(success => {
  console.log('\n=== TEST RESULT ===');
  console.log(success ? '✅ API endpoint is working correctly!' : '❌ API endpoint still has issues');
  process.exit(success ? 0 : 1);
});