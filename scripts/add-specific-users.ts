import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function addSpecificUsers() {
  console.log('👥 Adding specific MANAGER and EMPLOYEE users...')

  try {
    // Check if users already exist
    const existingManager = await prisma.user.findUnique({
      where: { email: 'manager@example.com' }
    })

    const existingEmployee = await prisma.user.findUnique({
      where: { email: 'employee@example.com' }
    })

    // Hash passwords
    const managerPassword = await bcrypt.hash('manager123', 12)
    const employeePassword = await bcrypt.hash('employee123', 12)

    // Create manager user if doesn't exist
    if (!existingManager) {
      const managerUser = await prisma.user.create({
        data: {
          email: 'manager@example.com',
          name: 'Manager User',
          password: managerPassword,
          role: 'MANAGER',
          department: 'Operations',
          status: 'ACTIVE',
        },
      })
      console.log('✅ Created MANAGER user:', managerUser.email)
    } else {
      console.log('⚠️ MANAGER user already exists:', existingManager.email)
    }

    // Create employee user if doesn't exist
    if (!existingEmployee) {
      const employeeUser = await prisma.user.create({
        data: {
          email: 'employee@example.com',
          name: 'Employee User',
          password: employeePassword,
          role: 'EMPLOYEE',
          department: 'Operations',
          status: 'ACTIVE',
        },
      })
      console.log('✅ Created EMPLOYEE user:', employeeUser.email)
    } else {
      console.log('⚠️ EMPLOYEE user already exists:', existingEmployee.email)
    }

    // List all current users
    console.log('\n📋 Current users in database:')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        status: true,
        createdAt: true
      },
      orderBy: [
        { role: 'asc' },
        { email: 'asc' }
      ]
    })

    allUsers.forEach(user => {
      console.log(`  ${user.role.padEnd(8)} | ${user.email.padEnd(25)} | ${user.name || 'N/A'} | ${user.status}`)
    })

    console.log(`\n📊 Total users: ${allUsers.length}`)
    
    // Count by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    })
    
    console.log('\n📈 Users by role:')
    roleCounts.forEach(count => {
      console.log(`  ${count.role}: ${count._count.id}`)
    })

  } catch (error) {
    console.error('❌ Error adding users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSpecificUsers()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
