'use client'

import { useState, useEffect } from 'react'
import { Play, Trash2, RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface TestResult {
  success: boolean
  message: string
  results?: any[]
  error?: string
}

interface SystemStatus {
  summary: {
    totalDepartments: number
    departmentsWithManagers: number
    departmentsWithoutManagers: number
    managerAssignmentNotifications: number
  }
  departments: Array<{
    id: string
    name: string
    code: string
    hasManager: boolean
    managerName?: string
    availableManagers: number
  }>
  recentNotifications: any[]
}

export default function TestManagerAssignmentPage() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/test-manager-assignment')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      }
    } catch (error) {
      console.error('Error fetching system status:', error)
    }
  }

  const runTest = async (action: string) => {
    setLoading(true)
    setTestResults(null)

    try {
      const response = await fetch('/api/admin/test-manager-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const result = await response.json()
      setTestResults(result)
      
      // Refresh system status after test
      await fetchSystemStatus()
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Failed to run test',
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manager Assignment System Test</h1>
          <p className="mt-2 text-gray-600">
            Test the automatic manager assignment functionality and notification system.
          </p>
        </div>

        {/* System Status */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current System Status</h2>
            <button
              onClick={fetchSystemStatus}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {systemStatus && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{systemStatus.summary.totalDepartments}</div>
                <div className="text-sm text-blue-800">Total Departments</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{systemStatus.summary.departmentsWithManagers}</div>
                <div className="text-sm text-green-800">With Managers</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{systemStatus.summary.departmentsWithoutManagers}</div>
                <div className="text-sm text-yellow-800">Without Managers</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{systemStatus.summary.managerAssignmentNotifications}</div>
                <div className="text-sm text-red-800">Pending Notifications</div>
              </div>
            </div>
          )}

          {systemStatus && systemStatus.departments.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Department Status</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Managers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {systemStatus.departments.map((dept) => (
                      <tr key={dept.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                          <div className="text-sm text-gray-500">{dept.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept.managerName || 'No manager assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dept.availableManagers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            dept.hasManager 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {dept.hasManager ? 'Assigned' : 'Unassigned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => runTest('create-test-scenario')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Play className="h-4 w-4" />
              Create Test Scenario
            </button>
            <button
              onClick={() => runTest('test-assignment')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
            >
              <RefreshCw className="h-4 w-4" />
              Test Assignment Logic
            </button>
            <button
              onClick={() => runTest('cleanup-test-data')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              <Trash2 className="h-4 w-4" />
              Cleanup Test Data
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Create Test Scenario:</strong> Creates test departments and managers to demonstrate the system</p>
            <p><strong>Test Assignment Logic:</strong> Runs the automatic assignment logic on test departments</p>
            <p><strong>Cleanup Test Data:</strong> Removes all test data from the system</p>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              {getStatusIcon(testResults.success)}
              <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
            </div>
            
            <div className={`p-4 rounded-lg mb-4 ${
              testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResults.message}
              </p>
              {testResults.error && (
                <p className="text-red-600 text-sm mt-2">{testResults.error}</p>
              )}
            </div>

            {testResults.results && testResults.results.length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">Detailed Results</h3>
                <div className="space-y-2">
                  {testResults.results.map((result, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                <span>Running test...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
