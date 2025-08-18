// Quick script to get admin user ID
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAdminId() {
  try {
    await prisma.$connect();
    
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    if (admin) {
      console.log(`Admin ID: ${admin.id}`);
      console.log(`Name: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
    } else {
      console.log('Admin user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAdminId().catch(console.error);
