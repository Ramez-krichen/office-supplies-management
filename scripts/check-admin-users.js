const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking for admin users...')
    
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { 
        email: true, 
        name: true, 
        status: true,
        department: true
      }
    })
    
    console.log(`\n📊 Found ${adminUsers.length} admin users:`)
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Status: ${user.status} - Dept: ${user.department || 'N/A'}`)
    })
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  No admin users found. You may need to create one or seed the database.')
      console.log('You can run: npm run db:seed')
    } else {
      console.log('\n✅ Admin users are available for testing the dashboard.')
      console.log('You can sign in with any of the above admin accounts.')
    }
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminUsers()
