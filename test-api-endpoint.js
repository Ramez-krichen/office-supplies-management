const fetch = require('node-fetch')

async function testApprovalEndpoint() {
  try {
    console.log('🔍 Testing Approval API Endpoint...\n')

    // Test data from our previous test
    const requestId = 'cmdwuttmh004sfcdgmifo0sxx'
    const testUrl = `http://localhost:3001/api/requests/${requestId}/approve`
    
    console.log(`📡 Testing URL: ${testUrl}`)
    
    // Test payload
    const payload = {
      status: 'APPROVED',
      comments: 'Test approval from API test script'
    }
    
    console.log(`📦 Payload:`, payload)
    
    // Make the API call
    console.log(`\n🚀 Making API call...`)
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real scenario, we'd need proper authentication headers
        // For testing, we'll see what happens without auth
      },
      body: JSON.stringify(payload)
    })
    
    console.log(`📡 Response status: ${response.status}`)
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()))
    
    // Try to get response body
    const responseText = await response.text()
    console.log(`📄 Raw response text: "${responseText}"`)
    
    // Try to parse as JSON
    try {
      const responseData = JSON.parse(responseText)
      console.log(`📊 Parsed response data:`, responseData)
    } catch (parseError) {
      console.log(`❌ Failed to parse response as JSON:`, parseError.message)
    }
    
    // Test if server is running
    console.log(`\n🔍 Testing if server is accessible...`)
    try {
      const healthResponse = await fetch('http://localhost:3001/api/health', {
        method: 'GET'
      })
      console.log(`🏥 Health check status: ${healthResponse.status}`)
    } catch (healthError) {
      console.log(`❌ Health check failed:`, healthError.message)
      console.log(`💡 Server might not be running on port 3001`)
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error)
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`💡 Connection refused - make sure the development server is running:`)
      console.log(`   npm run dev`)
    }
  }
}

testApprovalEndpoint()
