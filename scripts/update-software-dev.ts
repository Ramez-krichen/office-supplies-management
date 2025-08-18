import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updateSoftwareDev() {
  try {
    console.log('🔄 Updating Software Development Department...\n')

    // 1. Update Software Development department with budget
    await prisma.department.update({
      where: { code: 'IT_DEV' },
      data: { budget: 600000 }
    })
    console.log('   ✅ Updated IT_DEV budget: $600,000')

    // 2. Create manager for Software Development
    const department = await prisma.department.findUnique({
      where: { code: 'IT_DEV' }
    })

    if (department) {
      const manager = await prisma.user.create({
        data: {
          email: 'alex.johnson@company.com',
          name: 'Alex Johnson',
          password: await bcrypt.hash('manager123', 12),
          role: 'MANAGER',
          department: department.name,
          departmentId: department.id,
          status: 'ACTIVE'
        }
      })
      
      // Update department with manager
      await prisma.department.update({
        where: { id: department.id },
        data: { managerId: manager.id }
      })
      
      console.log(`   ✅ Created manager: Alex Johnson for ${department.name}`)
    }

    console.log('\n🎉 Software Development department update completed!')

  } catch (error) {
    console.error('❌ Error during update:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateSoftwareDev()
