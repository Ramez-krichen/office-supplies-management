import { ROLE_ACCESS_CONFIG } from './src/lib/access-control-config.ts';

console.log('Testing Requests Dashboard Access Control');
console.log('=========================================\n');

// Test different user roles
const roles = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'GENERAL_MANAGER'];

roles.forEach(role => {
  console.log(`Testing role: ${role}`);
  
  try {
    const config = ROLE_ACCESS_CONFIG[role];
    
    if (config) {
      const hasRequestsDashboard = config.dashboards.requestsDashboard;
      console.log(`  - Requests Dashboard Access: ${hasRequestsDashboard ? '✅ ALLOWED' : '❌ DENIED'}`);
      
      // Also check requests feature access
      const canViewRequests = config.requests.canView;
      const canApproveRequests = config.requests.canApprove;
      console.log(`  - Can View Requests: ${canViewRequests ? '✅ YES' : '❌ NO'}`);
      console.log(`  - Can Approve Requests: ${canApproveRequests ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log(`  - ❌ Invalid role or configuration not found`);
    }
  } catch (error) {
    console.log(`  - ❌ Error: ${error.message}`);
  }
  
  console.log('');
});

console.log('Expected Results:');
console.log('- ADMIN: Should NOT have requests dashboard access (❌ DENIED)');
console.log('- MANAGER: Should NOT have requests dashboard access (❌ DENIED)');
console.log('- EMPLOYEE: Should NOT have requests dashboard access (❌ DENIED)');
console.log('- GENERAL_MANAGER: Should HAVE requests dashboard access (✅ ALLOWED)');