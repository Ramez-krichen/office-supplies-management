const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAdminPasswordReset() {
  console.log('🔐 Testing Admin Password Reset Functionality\n');

  try {
    // First, let's get a list of users to find a test user
    console.log('1. Fetching users list...');
    const usersResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need to include proper authentication headers
        // This is just for demonstration purposes
      }
    });

    if (!usersResponse.ok) {
      console.log('❌ Failed to fetch users. Make sure you have admin authentication.');
      return;
    }

    const users = await usersResponse.json();
    console.log(`✅ Found ${users.length} users`);

    // Find a non-admin user to test password reset on
    const testUser = users.find(user => user.role !== 'ADMIN');
    if (!testUser) {
      console.log('❌ No non-admin users found for testing');
      return;
    }

    console.log(`📝 Testing password reset for user: ${testUser.email} (${testUser.name})`);

    // Test 1: Reset password with valid data
    console.log('\n2. Testing password reset with valid data...');
    const resetResponse = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newPassword: 'newSecurePassword123'
      })
    });

    if (resetResponse.ok) {
      const resetResult = await resetResponse.json();
      console.log('✅ Password reset successful:', resetResult.message);
      console.log('📋 User info returned:', resetResult.user);
    } else {
      const error = await resetResponse.json();
      console.log('❌ Password reset failed:', error.error);
    }

    // Test 2: Try with invalid password (too short)
    console.log('\n3. Testing password reset with invalid data (too short)...');
    const invalidResetResponse = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newPassword: '123'
      })
    });

    if (!invalidResetResponse.ok) {
      const error = await invalidResetResponse.json();
      console.log('✅ Correctly rejected short password:', error.error);
    } else {
      console.log('❌ Should have rejected short password');
    }

    // Test 3: Verify user data doesn't expose password
    console.log('\n4. Verifying user GET endpoint doesn\'t expose password...');
    const userResponse = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData.password) {
        console.log('❌ SECURITY ISSUE: Password field is exposed in user data!');
      } else {
        console.log('✅ Password field correctly hidden from user data');
      }
      console.log('📋 User data fields:', Object.keys(userData));
    }

    // Test 4: Check audit logs
    console.log('\n5. Checking if audit logs were created...');
    const auditResponse = await fetch(`${BASE_URL}/api/audit-logs?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (auditResponse.ok) {
      const auditLogs = await auditResponse.json();
      const passwordResetLog = auditLogs.find(log => 
        log.action === 'PASSWORD_RESET' && log.entityId === testUser.id
      );
      
      if (passwordResetLog) {
        console.log('✅ Password reset audit log found:', passwordResetLog.details);
      } else {
        console.log('❌ Password reset audit log not found');
      }
    }

    console.log('\n🎉 Admin password reset testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAdminPasswordReset();