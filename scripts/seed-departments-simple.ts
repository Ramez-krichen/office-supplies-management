import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDepartments() {
  try {
    console.log('🌱 Seeding departments...\n')

    // Check if departments already exist
    const existingDepts = await prisma.department.count()
    if (existingDepts > 0) {
      console.log('✅ Departments already exist, skipping seed')
      return
    }

    // Create departments
    const departmentData = [
      {
        code: 'IT',
        name: 'Information Technology',
        description: 'Manages technology infrastructure, software development, and IT support services',
        budget: 500000
      },
      {
        code: 'HR',
        name: 'Human Resources',
        description: 'Handles recruitment, employee relations, benefits, and organizational development',
        budget: 200000
      },
      {
        code: 'FINANCE',
        name: 'Finance',
        description: 'Manages financial planning, accounting, budgeting, and financial reporting',
        budget: 300000
      },
      {
        code: 'OPS',
        name: 'Operations',
        description: 'Oversees daily business operations, process optimization, and operational efficiency',
        budget: 400000
      },
      {
        code: 'MKT',
        name: 'Marketing',
        description: 'Develops marketing strategies, brand management, and customer acquisition',
        budget: 250000
      },
      {
        code: 'SALES',
        name: 'Sales',
        description: 'Manages sales processes, customer relationships, and revenue generation',
        budget: 350000
      },
      {
        code: 'LEGAL',
        name: 'Legal',
        description: 'Provides legal counsel, contract management, and compliance oversight',
        budget: 150000
      },
      {
        code: 'PROC',
        name: 'Procurement',
        description: 'Manages supplier relationships, purchasing processes, and vendor management',
        budget: 180000
      }
    ]

    console.log('📊 Creating departments...')
    
    for (const dept of departmentData) {
      const department = await prisma.department.create({
        data: dept
      })
      console.log(`   ✅ Created: ${dept.name} (${dept.code})`)
    }

    console.log('\n🎉 Department seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDepartments()
