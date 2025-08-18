import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDepartments() {
  try {
    console.log('📁 Checking departments in database...\n')

    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    })

    console.log(`Found ${departments.length} departments:\n`)

    departments.forEach(dept => {
      console.log(`- Name: "${dept.name}" | Code: "${dept.code}" | ID: ${dept.id}`)
    })

    console.log('\n🔍 Checking users and their department assignments...\n')

    const users = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: {
        name: true,
        department: true,
        departmentId: true,
        role: true
      },
      orderBy: { name: 'asc' }
    })

    console.log(`Found ${users.length} managers:\n`)

    users.forEach(user => {
      console.log(`- ${user.name} | Department: "${user.department}" | DeptID: ${user.departmentId}`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDepartments()
