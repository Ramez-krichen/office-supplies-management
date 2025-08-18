// Test script to verify the demo accounts are working
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    return {
      status: response.status,
      ok: response.ok,
      data: response.ok ? await response.json() : await response.text(),
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// Test demo users API
async function testDemoUsersAPI() {
  console.log('🔍 Testing Demo Users API...');
  
  const result = await makeRequest('/api/demo-users');
  console.log(`   Demo Users API: ${result.ok ? '✅ PASS' : '❌ FAIL'} (Status: ${result.status})`);
  
  if (result.ok) {
    console.log('\n📋 Demo Accounts Available:');
    console.log('=' .repeat(50));
    
    result.data.data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Department: ${user.department}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Description: ${user.description}`);
      console.log('');
    });
    
    // Check if we have the expected accounts
    const expectedEmails = ['admin@example.com', 'manager@example.com', 'employee@example.com'];
    const foundEmails = result.data.data.map(user => user.email);
    
    console.log('✅ Expected Accounts Check:');
    expectedEmails.forEach(email => {
      const found = foundEmails.includes(email);
      console.log(`   ${found ? '✅' : '❌'} ${email} ${found ? 'FOUND' : 'MISSING'}`);
    });
    
  } else {
    console.log('   Error details:', result.data);
  }
  
  return result;
}

// Test database directly
async function testDatabaseAccounts() {
  console.log('\n🔍 Testing Database Accounts...');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const demoEmails = ['admin@example.com', 'manager@example.com', 'employee@example.com'];
    
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: demoEmails
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log(`   Found ${users.length} demo accounts in database:`);
    
    users.forEach(user => {
      console.log(`   ✅ ${user.email} (${user.role}) - ${user.name}`);
      console.log(`      Department: ${user.department}, Status: ${user.status}`);
    });
    
    // Check for missing accounts
    const foundEmails = users.map(u => u.email);
    const missingEmails = demoEmails.filter(email => !foundEmails.includes(email));
    
    if (missingEmails.length > 0) {
      console.log('\n   ❌ Missing accounts:');
      missingEmails.forEach(email => {
        console.log(`      - ${email}`);
      });
    } else {
      console.log('\n   ✅ All demo accounts found in database!');
    }
    
  } catch (error) {
    console.error('   ❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Testing Demo Accounts');
  console.log('=' .repeat(50));
  
  try {
    await testDatabaseAccounts();
    await testDemoUsersAPI();
    
    console.log('\n🎯 Summary:');
    console.log('Your demo accounts are now available with the exact emails and passwords you requested:');
    console.log('');
    console.log('📧 admin@example.com / admin123');
    console.log('📧 manager@example.com / manager123');
    console.log('📧 employee@example.com / employee123');
    console.log('');
    console.log('🚀 You can now login at http://localhost:3000/auth/signin');
    
  } catch (error) {
    console.error('\n❌ Testing failed:', error.message);
  }
}

// Run the tests
runTests();
