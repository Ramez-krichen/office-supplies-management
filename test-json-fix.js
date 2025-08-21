// Test script to verify the JSON parsing fix
async function testAPI() {
  const ports = [3000, 3001, 54112];
  
  const testEndpoints = [
    '/api/test',
    '/api/items',
    '/api/requests',
  ];
  
  console.log('🧪 Testing API endpoints for JSON parsing issues...\n');
  
  for (const port of ports) {
    console.log(`\n🔗 Testing on port ${port}:`);
    const baseUrl = `http://localhost:${port}`;
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`  Testing ${endpoint}...`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        console.log(`    Content-Type: ${contentType}`);
        console.log(`    Status: ${response.status}`);
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const data = await response.json();
            console.log(`    ✅ Valid JSON response`);
            if (data.error) {
              console.log(`    📝 Error message: ${data.error}`);
            } else if (data.status) {
              console.log(`    📝 Status: ${data.status}`);
            }
          } catch (jsonError) {
            console.log(`    ❌ JSON parsing failed: ${jsonError.message}`);
          }
        } else {
          const text = await response.text();
          if (text.includes('Internal Server Error')) {
            console.log(`    ❌ HTML error page returned`);
          } else {
            console.log(`    ⚠️  Non-JSON response: ${text.substring(0, 100)}...`);
          }
        }
        
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.log(`    💤 Server not responding on port ${port}`);
        } else {
          console.log(`    💥 Network error: ${error.message}`);
        }
      }
      
      console.log(''); // Empty line
    }
  }
}

// Run the test
testAPI().catch(console.error);
