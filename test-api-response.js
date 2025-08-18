// Simple test to verify the API response structure
const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/reports/quick?period=30',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Add a simple cookie to simulate authentication
      'Cookie': 'next-auth.session-token=test'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nResponse body:');
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ Valid JSON response');
        console.log('Structure:');
        console.log('- consumption:', Object.keys(jsonData.consumption || {}));
        console.log('- costAnalysis:', Object.keys(jsonData.costAnalysis || {}));
        console.log('- forecast:', Object.keys(jsonData.forecast || {}));
        
        if (jsonData.consumption) {
          console.log('\nConsumption data:');
          console.log('- totalItems:', jsonData.consumption.totalItems);
          console.log('- periodTotalCost:', jsonData.consumption.periodTotalCost);
          console.log('- topDepartments count:', jsonData.consumption.topDepartments?.length || 0);
          console.log('- topItems count:', jsonData.consumption.topItems?.length || 0);
        }
        
        if (jsonData.costAnalysis) {
          console.log('\nCost Analysis data:');
          console.log('- topCategories count:', jsonData.costAnalysis.topCategories?.length || 0);
          console.log('- topDepartments count:', jsonData.costAnalysis.topDepartments?.length || 0);
        }
        
        if (jsonData.forecast) {
          console.log('\nForecast data:');
          console.log('- items count:', jsonData.forecast.items?.length || 0);
          console.log('- lowStockItems count:', jsonData.forecast.lowStockItems?.length || 0);
        }
        
      } catch (e) {
        console.log('❌ Invalid JSON response');
        console.log('Raw response:', data.substring(0, 500));
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

console.log('Testing Quick Reports API...');
testAPI();