import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function finalCheck() {
  try {
    let output = '📊 Final Department User Count Check\n\n'

    // Get all departments with user counts
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    output += 'Department User Counts:\n'
    for (const dept of departments) {
      output += `${dept.name} (${dept.code}): ${dept._count.users} users\n`
    }

    // Check for users still with issues
    const usersWithIssues = await prisma.user.count({
      where: {
        department: { not: null },
        departmentId: null
      }
    })

    output += `\nUsers with department but no departmentId: ${usersWithIssues}\n`

    // Total users
    const totalUsers = await prisma.user.count()
    output += `Total users in system: ${totalUsers}\n`

    // Users properly assigned
    const properlyAssigned = await prisma.user.count({
      where: {
        departmentId: { not: null }
      }
    })

    output += `Users properly assigned to departments: ${properlyAssigned}\n`
    output += `Assignment rate: ${((properlyAssigned / totalUsers) * 100).toFixed(1)}%\n`

    console.log(output)
    fs.writeFileSync('final-check.txt', output)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalCheck()
