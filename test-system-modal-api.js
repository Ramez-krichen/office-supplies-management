import fetch from 'node-fetch';

async function testSystemModalAPI() {
  console.log('Testing System Modal API endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  const endpoints = [
    '/api/dashboard/system',
    '/api/dashboard/system/users',
    '/api/dashboard/system/requests',
    '/api/dashboard/system/purchase-orders'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.text();
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
      console.log('---\n');
      
    } catch (error) {
      console.error(`Error testing ${endpoint}:`, error.message);
      console.log('---\n');
    }
  }
}

testSystemModalAPI().catch(console.error);