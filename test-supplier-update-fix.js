const baseUrl = 'http://localhost:3000';

// Test credentials - replace with actual test user credentials
const testCredentials = {
  email: 'admin@company.com',
  password: 'admin123'
};

let sessionCookie = '';

async function login() {
  try {
    console.log('🔐 Attempting login with session-based authentication...');
    
    // Get the session first
    const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
      credentials: 'include'
    });

    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      if (sessionData.user) {
        console.log('✅ Already logged in as:', sessionData.user.email);
        const cookies = sessionResponse.headers.get('set-cookie');
        if (cookies) {
          sessionCookie = cookies;
        }
        return true;
      }
    }

    console.log('❌ Not logged in or session expired. Manual testing required.');
    console.log('Please log in manually through the web interface first.');
    return false;
  } catch (error) {
    console.error('❌ Session check error:', error.message);
    return false;
  }
}

async function getSuppliers() {
  try {
    console.log('\n📋 Fetching suppliers...');
    const response = await fetch(`${baseUrl}/api/suppliers`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cookie': sessionCookie
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    const suppliers = data.suppliers;
    console.log(`✅ Found ${suppliers.length} suppliers`);
    
    if (suppliers.length > 0) {
      const testSupplier = suppliers[0];
      console.log(`📝 Using supplier for test: ${testSupplier.name} (ID: ${testSupplier.id})`);
      return testSupplier;
    } else {
      console.log('❌ No suppliers found for testing');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching suppliers:', error.message);
    return null;
  }
}

async function updateSupplier(supplierId, originalData) {
  try {
    console.log('\n🔄 Testing supplier update...');
    
    const updateData = {
      name: originalData.name + ' (Updated)',
      email: originalData.email,
      phone: originalData.phone,
      address: originalData.address,
      contactPerson: originalData.contactPerson
    };

    console.log('📤 Sending update request...');
    const response = await fetch(`${baseUrl}/api/suppliers/${supplierId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Supplier updated successfully!');
      console.log('📄 Updated data:', {
        id: data.id,
        name: data.name,
        email: data.email,
        contactPerson: data.contactPerson
      });
      return data;
    } else {
      const errorData = await response.json();
      console.log('❌ Update failed:', errorData.error);
      
      if (response.status === 500) {
        console.log('💥 Server error detected - checking if it\'s the foreign key issue...');
        const errorMsg = errorData.error || '';
        if (errorMsg.includes('foreign key') || errorMsg.includes('Database error')) {
          console.log('🚨 FOREIGN KEY CONSTRAINT ERROR DETECTED!');
          return 'FOREIGN_KEY_ERROR';
        }
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Error updating supplier:', error.message);
    return null;
  }
}

async function restoreSupplier(supplierId, originalData) {
  try {
    console.log('\n🔄 Restoring original supplier data...');
    
    const response = await fetch(`${baseUrl}/api/suppliers/${supplierId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(originalData)
    });

    if (response.ok) {
      console.log('✅ Supplier restored successfully!');
      return true;
    } else {
      const errorData = await response.json();
      console.log('❌ Error restoring supplier:', errorData.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error restoring supplier:', error.message);
    return false;
  }
}

async function testCategoryDetection(supplierId) {
  try {
    console.log('\n🔍 Testing category detection...');
    
    const response = await fetch(`${baseUrl}/api/suppliers/${supplierId}/detect-categories`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({ enhanced: true })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Category detection completed successfully!');
      console.log('📊 Detection result:', {
        success: data.success,
        categories: data.categories,
        confidence: data.confidence
      });
      return true;
    } else {
      const errorData = await response.json();
      console.log('❌ Category detection failed:', errorData.error);
      
      if (response.status === 500) {
        const errorMsg = errorData.error || '';
        if (errorMsg.includes('foreign key') || errorMsg.includes('Database error')) {
          console.log('🚨 FOREIGN KEY CONSTRAINT ERROR IN CATEGORY DETECTION!');
          return 'FOREIGN_KEY_ERROR';
        }
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Error in category detection:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Starting Supplier Update Fix Tests');
  console.log('=====================================');

  // Step 1: Check session/login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    console.log('💡 Please ensure you are logged in through the web interface first.');
    console.log('💡 Open http://localhost:3000 in your browser and log in as an admin.');
    return;
  }

  // Step 2: Get a supplier to test with
  const testSupplier = await getSuppliers();
  if (!testSupplier) {
    console.log('❌ Cannot proceed without a test supplier');
    return;
  }

  // Store original data for restoration
  const originalData = {
    name: testSupplier.name.replace(' (Updated)', ''), // Remove any previous test updates
    email: testSupplier.email,
    phone: testSupplier.phone,
    address: testSupplier.address,
    contactPerson: testSupplier.contactPerson
  };

  // Step 3: Test supplier update
  const updateResult = await updateSupplier(testSupplier.id, originalData);
  
  if (updateResult === 'FOREIGN_KEY_ERROR') {
    console.log('\n❌ FOREIGN KEY ERROR STILL EXISTS!');
    console.log('The fix did not resolve the issue completely.');
    return;
  } else if (!updateResult) {
    console.log('\n❌ Update failed for other reasons');
    return;
  }

  // Step 4: Test category detection
  const categoryResult = await testCategoryDetection(testSupplier.id);
  
  if (categoryResult === 'FOREIGN_KEY_ERROR') {
    console.log('\n❌ FOREIGN KEY ERROR IN CATEGORY DETECTION!');
    console.log('The category detection fix did not work.');
  } else if (categoryResult) {
    console.log('✅ Category detection working properly');
  }

  // Step 5: Restore original data
  await restoreSupplier(testSupplier.id, originalData);

  // Final summary
  console.log('\n📋 TEST SUMMARY');
  console.log('================');
  console.log('✅ Supplier update: WORKING');
  console.log(categoryResult === true ? '✅ Category detection: WORKING' : 
              categoryResult === 'FOREIGN_KEY_ERROR' ? '❌ Category detection: FOREIGN KEY ERROR' :
              '⚠️  Category detection: OTHER ISSUES');
  
  if (updateResult && categoryResult === true) {
    console.log('\n🎉 ALL TESTS PASSED! The foreign key constraint issue has been resolved.');
  } else if (updateResult) {
    console.log('\n✅ SUPPLIER UPDATE FIXED! Some category detection issues may remain.');
  } else {
    console.log('\n⚠️  Some issues remain. Check the logs above for details.');
  }
}

// Run the tests
runTests().catch(console.error);
