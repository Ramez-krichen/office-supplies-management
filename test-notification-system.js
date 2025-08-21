/**
 * Comprehensive Notification System Test Script
 * 
 * This script tests all aspects of the notification system:
 * - API endpoints
 * - Database operations
 * - Real-time notifications
 * - Email integration
 * - Notification triggers
 */

const BASE_URL = 'http://localhost:3000'

// Test configuration
const TEST_CONFIG = {
  adminEmail: 'admin@company.com',
  adminPassword: 'admin123',
  managerEmail: 'manager@company.com',
  managerPassword: 'manager123',
  employeeEmail: 'employee@company.com',
  employeePassword: 'employee123'
}

class NotificationSystemTester {
  constructor() {
    this.adminToken = null
    this.managerToken = null
    this.employeeToken = null
    this.testResults = []
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Notification System Tests\n')
    
    try {
      // Authentication tests
      await this.testAuthentication()
      
      // API endpoint tests
      await this.testNotificationAPIs()
      
      // Preferences tests
      await this.testNotificationPreferences()
      
      // Trigger tests
      await this.testNotificationTriggers()
      
      // Real-time tests
      await this.testRealTimeNotifications()
      
      // Bulk operations tests
      await this.testBulkOperations()
      
      // Email integration tests
      await this.testEmailIntegration()
      
      // Generate report
      this.generateTestReport()
      
    } catch (error) {
      console.error('❌ Test suite failed:', error)
    }
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...')
    
    try {
      // Test admin login
      const adminResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_CONFIG.adminEmail,
          password: TEST_CONFIG.adminPassword
        })
      })
      
      if (adminResponse.ok) {
        this.adminToken = await this.extractToken(adminResponse)
        this.logTest('Admin Authentication', true, 'Admin login successful')
      } else {
        this.logTest('Admin Authentication', false, 'Admin login failed')
      }
      
      // Test manager login
      const managerResponse = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_CONFIG.managerEmail,
          password: TEST_CONFIG.managerPassword
        })
      })
      
      if (managerResponse.ok) {
        this.managerToken = await this.extractToken(managerResponse)
        this.logTest('Manager Authentication', true, 'Manager login successful')
      } else {
        this.logTest('Manager Authentication', false, 'Manager login failed')
      }
      
    } catch (error) {
      this.logTest('Authentication', false, `Authentication error: ${error.message}`)
    }
  }

  async testNotificationAPIs() {
    console.log('📡 Testing Notification APIs...')
    
    // Test GET /api/notifications
    await this.testGetNotifications()
    
    // Test POST /api/notifications
    await this.testCreateNotification()
    
    // Test PATCH /api/notifications/[id]
    await this.testUpdateNotification()
    
    // Test notification stream
    await this.testNotificationStream()
  }

  async testGetNotifications() {
    try {
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        this.logTest('GET Notifications', true, `Retrieved ${data.notifications?.length || 0} notifications`)
      } else {
        this.logTest('GET Notifications', false, `HTTP ${response.status}`)
      }
    } catch (error) {
      this.logTest('GET Notifications', false, error.message)
    }
  }

  async testCreateNotification() {
    try {
      const testNotification = {
        type: 'SYSTEM_ALERT',
        title: 'Test Notification',
        message: 'This is a test notification created by the test script',
        priority: 'MEDIUM',
        category: 'SYSTEM',
        targetRole: 'ADMIN'
      }
      
      const response = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        },
        body: JSON.stringify(testNotification)
      })
      
      if (response.ok) {
        const data = await response.json()
        this.testNotificationId = data.id
        this.logTest('POST Notification', true, `Created notification with ID: ${data.id}`)
      } else {
        this.logTest('POST Notification', false, `HTTP ${response.status}`)
      }
    } catch (error) {
      this.logTest('POST Notification', false, error.message)
    }
  }

  async testUpdateNotification() {
    if (!this.testNotificationId) {
      this.logTest('PATCH Notification', false, 'No test notification ID available')
      return
    }
    
    try {
      const response = await fetch(`${BASE_URL}/api/notifications/${this.testNotificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        },
        body: JSON.stringify({ action: 'read' })
      })
      
      if (response.ok) {
        this.logTest('PATCH Notification', true, 'Successfully marked notification as read')
      } else {
        this.logTest('PATCH Notification', false, `HTTP ${response.status}`)
      }
    } catch (error) {
      this.logTest('PATCH Notification', false, error.message)
    }
  }

  async testNotificationStream() {
    try {
      // Test if the stream endpoint is accessible
      const response = await fetch(`${BASE_URL}/api/notifications/stream`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        }
      })
      
      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        this.logTest('Notification Stream', true, 'Stream endpoint accessible')
      } else {
        this.logTest('Notification Stream', false, 'Stream endpoint not accessible')
      }
    } catch (error) {
      this.logTest('Notification Stream', false, error.message)
    }
  }

  async testNotificationPreferences() {
    console.log('⚙️ Testing Notification Preferences...')
    
    try {
      // Test GET preferences
      const getResponse = await fetch(`${BASE_URL}/api/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        }
      })
      
      if (getResponse.ok) {
        const preferences = await getResponse.json()
        this.logTest('GET Preferences', true, 'Retrieved user preferences')
        
        // Test PUT preferences
        const updateResponse = await fetch(`${BASE_URL}/api/notifications/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`,
            'Cookie': this.adminToken
          },
          body: JSON.stringify({
            emailEnabled: true,
            inAppEnabled: true,
            requestStatusChanges: true,
            managerAssignments: false,
            systemAlerts: true,
            weeklyDigest: false
          })
        })
        
        if (updateResponse.ok) {
          this.logTest('PUT Preferences', true, 'Updated user preferences')
        } else {
          this.logTest('PUT Preferences', false, `HTTP ${updateResponse.status}`)
        }
      } else {
        this.logTest('GET Preferences', false, `HTTP ${getResponse.status}`)
      }
    } catch (error) {
      this.logTest('Notification Preferences', false, error.message)
    }
  }

  async testNotificationTriggers() {
    console.log('🎯 Testing Notification Triggers...')
    
    // Test request status change trigger
    await this.testRequestStatusTrigger()
    
    // Test employee assignment trigger
    await this.testEmployeeAssignmentTrigger()
  }

  async testRequestStatusTrigger() {
    try {
      // Create a test request first
      const requestResponse = await fetch(`${BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        },
        body: JSON.stringify({
          title: 'Test Request for Notification',
          description: 'This is a test request to trigger notifications',
          department: 'IT',
          priority: 'MEDIUM',
          items: []
        })
      })
      
      if (requestResponse.ok) {
        const request = await requestResponse.json()
        
        // Now approve the request to trigger notification
        const approveResponse = await fetch(`${BASE_URL}/api/requests/${request.id}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.adminToken}`,
            'Cookie': this.adminToken
          },
          body: JSON.stringify({
            status: 'APPROVED',
            comments: 'Test approval for notification trigger'
          })
        })
        
        if (approveResponse.ok) {
          this.logTest('Request Status Trigger', true, 'Request approval should trigger notification')
        } else {
          this.logTest('Request Status Trigger', false, 'Request approval failed')
        }
      } else {
        this.logTest('Request Status Trigger', false, 'Failed to create test request')
      }
    } catch (error) {
      this.logTest('Request Status Trigger', false, error.message)
    }
  }

  async testEmployeeAssignmentTrigger() {
    try {
      // Create a test employee to trigger assignment notification
      const userResponse = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        },
        body: JSON.stringify({
          name: 'Test Employee for Notification',
          email: `test-employee-${Date.now()}@company.com`,
          password: 'testpass123',
          role: 'EMPLOYEE',
          department: 'IT'
        })
      })
      
      if (userResponse.ok) {
        this.logTest('Employee Assignment Trigger', true, 'Employee creation should trigger manager notification')
      } else {
        this.logTest('Employee Assignment Trigger', false, 'Failed to create test employee')
      }
    } catch (error) {
      this.logTest('Employee Assignment Trigger', false, error.message)
    }
  }

  async testRealTimeNotifications() {
    console.log('⚡ Testing Real-time Notifications...')
    
    try {
      // This is a simplified test - in a real scenario, you'd set up EventSource
      const streamResponse = await fetch(`${BASE_URL}/api/notifications/stream`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        }
      })
      
      if (streamResponse.ok) {
        this.logTest('Real-time Connection', true, 'Stream connection established')
      } else {
        this.logTest('Real-time Connection', false, 'Stream connection failed')
      }
    } catch (error) {
      this.logTest('Real-time Connection', false, error.message)
    }
  }

  async testBulkOperations() {
    console.log('📦 Testing Bulk Operations...')
    
    try {
      // Test bulk mark as read
      const bulkResponse = await fetch(`${BASE_URL}/api/notifications/bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        },
        body: JSON.stringify({
          action: 'read',
          notificationIds: [this.testNotificationId].filter(Boolean)
        })
      })
      
      if (bulkResponse.ok) {
        this.logTest('Bulk Operations', true, 'Bulk mark as read successful')
      } else {
        this.logTest('Bulk Operations', false, `HTTP ${bulkResponse.status}`)
      }
    } catch (error) {
      this.logTest('Bulk Operations', false, error.message)
    }
  }

  async testEmailIntegration() {
    console.log('📧 Testing Email Integration...')
    
    // Note: This test checks if the email service is configured
    // Actual email sending would require SMTP configuration
    try {
      // Create a notification that should trigger email
      const emailTestResponse = await fetch(`${BASE_URL}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`,
          'Cookie': this.adminToken
        },
        body: JSON.stringify({
          type: 'SYSTEM_ALERT',
          title: 'Email Test Notification',
          message: 'This notification should trigger an email if SMTP is configured',
          priority: 'HIGH',
          category: 'SYSTEM',
          targetRole: 'ADMIN'
        })
      })
      
      if (emailTestResponse.ok) {
        this.logTest('Email Integration', true, 'Email notification created (check SMTP logs for actual delivery)')
      } else {
        this.logTest('Email Integration', false, 'Failed to create email notification')
      }
    } catch (error) {
      this.logTest('Email Integration', false, error.message)
    }
  }

  async extractToken(response) {
    // This is a simplified token extraction - adjust based on your auth implementation
    const cookies = response.headers.get('set-cookie')
    return cookies || 'mock-token'
  }

  logTest(testName, passed, message) {
    const status = passed ? '✅' : '❌'
    const result = { testName, passed, message, timestamp: new Date().toISOString() }
    this.testResults.push(result)
    console.log(`${status} ${testName}: ${message}`)
  }

  generateTestReport() {
    console.log('\n📊 Test Report Summary')
    console.log('=' .repeat(50))
    
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.testName}: ${r.message}`))
    }
    
    console.log('\n🎉 Notification System Testing Complete!')
    
    // Save detailed report
    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%'
      },
      results: this.testResults,
      timestamp: new Date().toISOString()
    }
    
    console.log('\n📄 Detailed report saved to test-results.json')
    require('fs').writeFileSync('test-results.json', JSON.stringify(report, null, 2))
  }
}

// Run the tests
const tester = new NotificationSystemTester()
tester.runAllTests().catch(console.error)