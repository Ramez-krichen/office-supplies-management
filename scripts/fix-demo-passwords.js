const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDemoPasswords() {
  try {
    console.log('🔧 Fixing demo account passwords...\n');

    const demoAccounts = [
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'manager@example.com', password: 'manager123' },
      { email: 'employee@example.com', password: 'employee123' }
    ];

    for (const account of demoAccounts) {
      console.log(`Checking ${account.email}...`);
      
      const user = await prisma.user.findUnique({
        where: { email: account.email }
      });

      if (!user) {
        console.log(`❌ User ${account.email} not found`);
        continue;
      }

      // Test current password
      const isCurrentValid = await bcrypt.compare(account.password, user.password);
      
      if (isCurrentValid) {
        console.log(`✅ ${account.email} password is already valid`);
      } else {
        console.log(`🔄 Updating password for ${account.email}...`);
        
        // Generate new hash with 12 rounds
        const newHash = await bcrypt.hash(account.password, 12);
        
        await prisma.user.update({
          where: { email: account.email },
          data: { password: newHash }
        });
        
        // Verify the update
        const isNewValid = await bcrypt.compare(account.password, newHash);
        console.log(`✅ ${account.email} password updated: ${isNewValid ? 'SUCCESS' : 'FAILED'}`);
      }
      console.log('');
    }

    console.log('🎉 Demo password fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDemoPasswords();
