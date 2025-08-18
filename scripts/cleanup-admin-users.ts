import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up admin users...')

  try {
    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    console.log(`Found ${adminUsers.length} admin users:`)
    adminUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name})`)
    })

    // Check if main admin exists
    const mainAdmin = adminUsers.find(user => user.email === 'admin@example.com')

    if (!mainAdmin) {
      console.log('\n❌ Main admin (admin@example.com) not found!')
      
      // Create the main admin if it doesn't exist
      const adminPassword = await bcrypt.hash('admin123', 12)
      const newMainAdmin = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Main Admin',
          password: adminPassword,
          role: 'ADMIN',
          department: 'IT',
          status: 'ACTIVE'
        },
      })
      
      console.log('✅ Created main admin user:', newMainAdmin.email)
    } else {
      console.log('\n✅ Main admin found:', mainAdmin.email)
    }

    // Remove all other admin users (keep only admin@example.com)
    const otherAdmins = adminUsers.filter(user => user.email !== 'admin@example.com')
    
    if (otherAdmins.length > 0) {
      console.log(`\n🗑️  Removing ${otherAdmins.length} other admin users...`)
      
      for (const admin of otherAdmins) {
        // Change their role to MANAGER instead of deleting
        await prisma.user.update({
          where: { id: admin.id },
          data: { role: 'MANAGER' }
        })
        console.log(`- Changed ${admin.email} from ADMIN to MANAGER`)
      }
    } else {
      console.log('\n✅ No other admin users found to remove')
    }

    // Verify final state
    const finalAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    const finalMainAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      select: { email: true, role: true, name: true }
    })

    console.log('\n📊 Final state:')
    console.log(`- Total admin users: ${finalAdminCount}`)
    if (finalMainAdmin) {
      console.log(`- Main admin: ${finalMainAdmin.email} (${finalMainAdmin.name}) - Role: ${finalMainAdmin.role}`)
    }

    if (finalAdminCount === 1 && finalMainAdmin && finalMainAdmin.role === 'ADMIN') {
      console.log('\n✅ Admin cleanup completed successfully!')
      console.log('Only one admin user remains: admin@example.com')
    } else {
      console.log('\n❌ Admin cleanup failed - unexpected final state')
    }

  } catch (error) {
    console.error('Error during admin cleanup:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
