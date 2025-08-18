// Test script to verify authentication credentials
const bcrypt = require('bcryptjs');

const testCredentials = [
  { email: 'admin@company.com', password: 'admin123', role: 'ADMIN' },
  { email: 'manager@company.com', password: 'manager123', role: 'MANAGER' },
  { email: 'employee@company.com', password: 'employee123', role: 'EMPLOYEE' }
];

async function testPasswordHashing() {
  console.log('Testing password hashing...\n');
  
  for (const cred of testCredentials) {
    const hashedPassword = await bcrypt.hash(cred.password, 12);
    const isValid = await bcrypt.compare(cred.password, hashedPassword);
    
    console.log(`${cred.role} (${cred.email}):`);
    console.log(`  Password: ${cred.password}`);
    console.log(`  Hash: ${hashedPassword.substring(0, 30)}...`);
    console.log(`  Validation: ${isValid ? 'PASS' : 'FAIL'}\n`);
  }
}

testPasswordHashing().catch(console.error);
