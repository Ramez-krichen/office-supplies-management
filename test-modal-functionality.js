// Test script to verify the modal fix works correctly
// This simulates the modal's fetch behavior with proper credentials

const testModalFetch = async () => {
  console.log('🧪 Testing Modal Fetch Functionality\n');
  
  // Simulate the modal's fetch request with the fix applied
  const testFetch = async (endpoint) => {
    console.log(`Testing endpoint: ${endpoint}`);
    
    try {
      // This simulates the fixed fetch request from the modal
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This is the key fix - includes cookies
      });
      
      const data = await response.text();
      
      if (response.ok) {
        console.log(`✅ SUCCESS: ${response.status}`);
        console.log(`Response length: ${data.length} characters`);
        
        // Try to parse as JSON to verify structure
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.summary) {
            console.log(`📊 Summary data found with ${Object.keys(jsonData.summary).length} properties`);
          }
          if (jsonData.users) {
            console.log(`👥 Users data found`);
          }
          if (jsonData.requests) {
            console.log(`📋 Requests data found`);
          }
          if (jsonData.orders) {
            console.log(`📦 Orders data found`);
          }
        } catch (parseError) {
          console.log(`⚠️  Response is not JSON format`);
        }
      } else {
        console.log(`❌ ERROR: ${response.status} - ${response.statusText}`);
        console.log(`Response: ${data}`);
      }
      
    } catch (error) {
      console.log(`🚫 NETWORK ERROR: ${error.message}`);
    }
    
    console.log('---\n');
  };
  
  // Test all the endpoints that the modal uses
  const endpoints = [
    '/api/dashboard/system/users',
    '/api/dashboard/system/requests', 
    '/api/dashboard/system/purchase-orders'
  ];
  
  for (const endpoint of endpoints) {
    await testFetch(endpoint);
  }
  
  console.log('🏁 Modal fetch testing completed!');
  console.log('\n📝 Summary:');
  console.log('- Added credentials: "include" to fetch requests');
  console.log('- This ensures session cookies are sent with API requests');
  console.log('- Should resolve "Unauthorized - No session" errors');
  console.log('- Modal should now display detailed data instead of error message');
};

// Run the test
testModalFetch().catch(console.error);