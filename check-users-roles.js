const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true
      }
    });
    
    console.log('All users in database:');
    console.log('=====================');
    users.forEach(user => {
      console.log(`${user.email} - ${user.role} (${user.name}) - ${user.status}`);
    });
    
    const generalManagers = users.filter(u => u.role === 'GENERAL_MANAGER');
    console.log('\nGeneral Managers found:', generalManagers.length);
    
    if (generalManagers.length === 0) {
      console.log('\n❌ No GENERAL_MANAGER users found!');
      console.log('💡 This explains the 403 error. Need to create a GENERAL_MANAGER user.');
    } else {
      console.log('\n✅ GENERAL_MANAGER users found:');
      generalManagers.forEach(gm => console.log(`  - ${gm.email} (${gm.name})`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();