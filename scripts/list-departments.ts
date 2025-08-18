import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listDepartments() {
  try {
    console.log('🏢 Current Departments in Database:\n')

    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            users: true,
            children: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    if (departments.length === 0) {
      console.log('❌ No departments found in database')
      return
    }

    departments.forEach(dept => {
      console.log(`📊 ${dept.name} (${dept.code})`)
      console.log(`   Description: ${dept.description || 'N/A'}`)
      console.log(`   Budget: $${dept.budget?.toLocaleString() || 'N/A'}`)
      console.log(`   Manager: ${dept.manager?.name || 'Not assigned'}`)
      console.log(`   Users: ${dept._count.users}`)
      console.log(`   Status: ${dept.status}`)
      console.log('')
    })

    console.log(`✅ Total departments: ${departments.length}`)

  } catch (error) {
    console.error('❌ Error listing departments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listDepartments()
