const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createDemoAccounts() {
  try {
    console.log('🔧 Creating original demo accounts...')
    
    // Define the demo accounts you want
    const demoAccounts = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'admin123',
        role: 'ADMIN',
        department: 'IT'
      },
      {
        email: 'manager@example.com',
        name: 'Manager User',
        password: 'manager123',
        role: 'MANAGER',
        department: 'Operations'
      },
      {
        email: 'employee@example.com',
        name: 'Employee User',
        password: 'employee123',
        role: 'EMPLOYEE',
        department: 'Sales'
      }
    ]
    
    for (const account of demoAccounts) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      })
      
      if (existingUser) {
        console.log(`   ⚠️  User ${account.email} already exists, updating password...`)
        
        // Update existing user with new password
        const hashedPassword = await bcrypt.hash(account.password, 10)
        await prisma.user.update({
          where: { email: account.email },
          data: {
            password: hashedPassword,
            name: account.name,
            role: account.role,
            department: account.department,
            status: 'ACTIVE'
          }
        })
        
        console.log(`   ✅ Updated ${account.email} with new password`)
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(account.password, 10)
        await prisma.user.create({
          data: {
            email: account.email,
            name: account.name,
            password: hashedPassword,
            role: account.role,
            department: account.department,
            status: 'ACTIVE',
            lastSignIn: new Date()
          }
        })
        
        console.log(`   ✅ Created ${account.email}`)
      }
    }
    
    console.log('\n🎯 Demo accounts ready!')
    console.log('=' .repeat(50))
    
    // Verify the accounts
    for (const account of demoAccounts) {
      const user = await prisma.user.findUnique({
        where: { email: account.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          department: true,
          status: true
        }
      })
      
      if (user) {
        console.log(`✅ ${user.email} (${user.role}) - ${user.name}`)
        console.log(`   Department: ${user.department}`)
        console.log(`   Status: ${user.status}`)
        console.log(`   Password: ${account.password}`)
        console.log('')
      }
    }
    
    console.log('🚀 You can now login with these accounts!')
    
  } catch (error) {
    console.error('❌ Error creating demo accounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createDemoAccounts()
