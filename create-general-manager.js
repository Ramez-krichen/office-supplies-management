const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createGeneralManager() {
  try {
    console.log('🔐 Creating General Manager user...')
    
    // Check if a General Manager already exists
    const existingGM = await prisma.user.findFirst({
      where: { role: 'GENERAL_MANAGER' }
    })
    
    if (existingGM) {
      console.log('⚠️  General Manager already exists:')
      console.log(`   Email: ${existingGM.email}`)
      console.log(`   Name: ${existingGM.name}`)
      console.log(`   Status: ${existingGM.status}`)
      return {
        email: existingGM.email,
        password: 'Use existing password',
        name: existingGM.name,
        role: existingGM.role
      }
    }
    
    // Create new General Manager
    const email = 'gm@company.com'
    const password = 'GeneralManager123!'
    const name = 'General Manager'
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create the user
    const generalManager = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'GENERAL_MANAGER',
        department: 'Executive', // General Managers typically belong to executive department
        status: 'ACTIVE'
      }
    })
    
    console.log('✅ General Manager created successfully!')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Name: ${name}`)
    console.log(`   Role: ${generalManager.role}`)
    console.log(`   Department: ${generalManager.department}`)
    console.log(`   Status: ${generalManager.status}`)
    
    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_GENERAL_MANAGER',
        entity: 'User',
        entityId: generalManager.id,
        performedBy: generalManager.id, // Self-created for this script
        details: `General Manager account created: ${email}`
      }
    })
    
    console.log('📝 Audit log entry created')
    
    return {
      email,
      password,
      name,
      role: generalManager.role,
      department: generalManager.department,
      id: generalManager.id
    }
    
  } catch (error) {
    console.error('❌ Error creating General Manager:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the function
createGeneralManager()
  .then((credentials) => {
    console.log('\n🎯 GENERAL MANAGER CREDENTIALS:')
    console.log('================================')
    console.log(`Email: ${credentials.email}`)
    console.log(`Password: ${credentials.password}`)
    console.log(`Name: ${credentials.name}`)
    console.log(`Role: ${credentials.role}`)
    console.log(`Department: ${credentials.department || 'Executive'}`)
    console.log('================================')
    console.log('\n💡 Use these credentials to login at /auth/signin')
    console.log('🔒 The General Manager can ONLY approve/reject requests - no other system access')
  })
  .catch((error) => {
    console.error('Failed to create General Manager:', error)
    process.exit(1)
  })