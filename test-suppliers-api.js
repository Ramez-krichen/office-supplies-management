async function testSuppliersAPI() {
  try {
    console.log('Testing suppliers API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/suppliers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.status === 200) {
      try {
        const json = JSON.parse(data);
        console.log('Parsed JSON:', JSON.stringify(json, null, 2));
      } catch (parseError) {
        console.log('Failed to parse as JSON:', parseError.message);
      }
    } else if (response.status === 401 || response.status === 403) {
      console.log('Access denied as expected - user needs to be authenticated with proper role');
      try {
        const json = JSON.parse(data);
        console.log('Error details:', json);
      } catch (parseError) {
        console.log('Error response is not JSON:', data);
      }
    }
    
  } catch (error) {
    console.error('Error testing suppliers API:', error.message);
    console.error('Full error:', error);
  }
}

testSuppliersAPI();