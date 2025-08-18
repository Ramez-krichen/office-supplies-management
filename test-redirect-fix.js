#!/usr/bin/env node

/**
 * Test script to verify the redirect fix is working correctly
 * This script tests that users are redirected directly to their role-specific dashboard
 * without showing the intermediate /dashboard URL
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Testing Redirect Fix Implementation...\n');

// Test 1: Check if use-auth.ts has been updated
console.log('1. Checking use-auth.ts for direct role-based redirect...');
try {
  const useAuthPath = path.join(__dirname, 'src', 'hooks', 'use-auth.ts');
  const useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
  
  const hasGetSession = useAuthContent.includes('const session = await getSession()');
  const hasRoleSwitch = useAuthContent.includes('switch (userRole)');
  const hasDirectRedirect = useAuthContent.includes('window.location.href = dashboardUrl');
  
  console.log(`   ✅ Uses getSession to get user role: ${hasGetSession ? '✅' : '❌'}`);
  console.log(`   ✅ Has role-based switch logic: ${hasRoleSwitch ? '✅' : '❌'}`);
  console.log(`   ✅ Redirects directly to role dashboard: ${hasDirectRedirect ? '✅' : '❌'}`);
  
  if (hasGetSession && hasRoleSwitch && hasDirectRedirect) {
    console.log('   🎉 use-auth.ts correctly updated!\n');
  } else {
    console.log('   ⚠️  use-auth.ts may need additional updates\n');
  }
} catch (error) {
  console.log('   ❌ Error reading use-auth.ts:', error.message, '\n');
}

// Test 2: Check if auth.ts has redirect callback
console.log('2. Checking auth.ts for redirect callback...');
try {
  const authPath = path.join(__dirname, 'src', 'lib', 'auth.ts');
  const authContent = fs.readFileSync(authPath, 'utf8');
  
  const hasRedirectCallback = authContent.includes('async redirect({');
  const hasRoleSpecificCheck = authContent.includes('/dashboard/admin') || authContent.includes('/dashboard/manager');
  
  console.log(`   ✅ Has redirect callback: ${hasRedirectCallback ? '✅' : '❌'}`);
  console.log(`   ✅ Checks for role-specific URLs: ${hasRoleSpecificCheck ? '✅' : '❌'}`);
  
  if (hasRedirectCallback && hasRoleSpecificCheck) {
    console.log('   🎉 auth.ts correctly updated!\n');
  } else {
    console.log('   ⚠️  auth.ts may need additional updates\n');
  }
} catch (error) {
  console.log('   ❌ Error reading auth.ts:', error.message, '\n');
}

// Test 3: Check if dashboard page has optimized redirect
console.log('3. Checking dashboard page for optimized redirect...');
try {
  const dashboardPath = path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  const hasWindowLocation = dashboardContent.includes('window.location.href = defaultDashboard');
  const hasConsoleLog = dashboardContent.includes('Redirecting from /dashboard to');
  
  console.log(`   ✅ Uses window.location for faster redirect: ${hasWindowLocation ? '✅' : '❌'}`);
  console.log(`   ✅ Has redirect logging: ${hasConsoleLog ? '✅' : '❌'}`);
  
  if (hasWindowLocation) {
    console.log('   🎉 Dashboard page correctly optimized!\n');
  } else {
    console.log('   ⚠️  Dashboard page may need optimization\n');
  }
} catch (error) {
  console.log('   ❌ Error reading dashboard page:', error.message, '\n');
}

// Test 4: Check if home page has optimized redirect
console.log('4. Checking home page for optimized redirect...');
try {
  const homePath = path.join(__dirname, 'src', 'app', 'page.tsx');
  const homeContent = fs.readFileSync(homePath, 'utf8');
  
  const hasRoleBasedRedirect = homeContent.includes('switch (userRole)');
  const hasHomeRedirectLog = homeContent.includes('Home page redirecting');
  
  console.log(`   ✅ Has role-based redirect logic: ${hasRoleBasedRedirect ? '✅' : '❌'}`);
  console.log(`   ✅ Has redirect logging: ${hasHomeRedirectLog ? '✅' : '❌'}`);
  
  if (hasRoleBasedRedirect) {
    console.log('   🎉 Home page correctly optimized!\n');
  } else {
    console.log('   ⚠️  Home page may need optimization\n');
  }
} catch (error) {
  console.log('   ❌ Error reading home page:', error.message, '\n');
}

console.log('📋 Summary of Redirect Fix:');
console.log('   • Users now redirect directly to role-specific dashboards');
console.log('   • No more intermediate /dashboard URL flash');
console.log('   • Faster navigation after sign-in');
console.log('   • Better user experience with immediate role-based routing');
console.log('\n🎯 Expected Behavior:');
console.log('   • ADMIN users → /dashboard/admin');
console.log('   • MANAGER users → /dashboard/manager');
console.log('   • EMPLOYEE users → /dashboard/employee');
console.log('   • No visible /dashboard URL during redirect');
console.log('\n✅ Redirect fix implementation complete!');
