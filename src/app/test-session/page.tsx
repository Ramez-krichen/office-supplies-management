'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function TestSession() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testAPI = async () => {
    setIsLoading(true)
    setTestResult('Testing...')
    
    try {
      // Test 1: Get requests
      console.log('Testing GET /api/requests')
      const getResponse = await fetch('/api/requests?limit=10000')
      const getResult = await getResponse.json()
      
      if (!getResponse.ok) {
        setTestResult(`❌ GET failed: ${getResult.error}`)
        return
      }
      
      console.log('GET successful, found', getResult.requests?.length, 'requests')
      
      if (!getResult.requests || getResult.requests.length === 0) {
        setTestResult('❌ No requests found')
        return
      }
      
      // Test 2: Update a request
      const sampleRequest = getResult.requests[0]
      console.log('Testing PUT for request:', sampleRequest.id)
      
      const updateData = {
        title: sampleRequest.title + ' (Test Update)',
        description: sampleRequest.description || 'Test description',
        department: sampleRequest.department,
        priority: sampleRequest.priority,
        items: sampleRequest.items.map((item: any) => ({
          itemId: item.itemId || item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          notes: item.notes
        }))
      }
      
      console.log('Update data:', updateData)
      
      const updateResponse = await fetch(`/api/requests/${sampleRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      
      const updateResult = await updateResponse.json()
      
      if (updateResponse.ok) {
        setTestResult(`✅ Update successful! Response: ${JSON.stringify(updateResult, null, 2)}`)
      } else {
        setTestResult(`❌ Update failed: ${updateResult.error}`)
      }
      
    } catch (error) {
      console.error('Test error:', error)
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="p-8">Loading session...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Session & API Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg font-semibold mb-2">Session Status</h2>
        <p><strong>Status:</strong> {status}</p>
        {session ? (
          <div>
            <p><strong>User ID:</strong> {session.user?.id}</p>
            <p><strong>Name:</strong> {session.user?.name}</p>
            <p><strong>Email:</strong> {session.user?.email}</p>
            <p><strong>Role:</strong> {session.user?.role}</p>
            <p><strong>Department:</strong> {session.user?.department}</p>
          </div>
        ) : (
          <p className="text-red-600">No session found</p>
        )}
      </div>
      
      <div className="mb-6">
        <button
          onClick={testAPI}
          disabled={isLoading || !session}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Testing...' : 'Test API Update'}
        </button>
      </div>
      
      {testResult && (
        <div className="bg-white border p-4 rounded">
          <h3 className="font-semibold mb-2">Test Result:</h3>
          <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p>This page tests the session and API functionality.</p>
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  )
}
