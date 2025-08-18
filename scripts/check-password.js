const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');


const prisma = new PrismaClient();

async function checkPassword() {
  try {
    // Get admin user
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@example.com'
      }
    });

    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      department: adminUser.department,
      passwordHash: adminUser.password.substring(0, 10) + '...' // Only show part of the hash for security
    });

    // Test password
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);

    console.log(`Password '${testPassword}' is ${isPasswordValid ? 'valid' : 'invalid'}`);

    // If invalid, let's create a new hash and update the user
    if (!isPasswordValid) {
      console.log('Updating password hash to use 12 rounds...');
      const newHash = await bcrypt.hash(testPassword, 12);

      await prisma.user.update({
        where: { email: 'admin@example.com' },
        data: { password: newHash }
      });

      console.log('✅ Password updated successfully!');
      console.log('New hash generated:', newHash.substring(0, 10) + '...');
      console.log('Old hash was:', adminUser.password.substring(0, 10) + '...');

      // Test the new password
      const retestValid = await bcrypt.compare(testPassword, newHash);
      console.log(`Password verification after update: ${retestValid ? 'SUCCESS' : 'FAILED'}`);
    }
  } catch (error) {
    console.error('Error checking password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();