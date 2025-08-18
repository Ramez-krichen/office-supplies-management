import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function quickFix() {
  try {
    let output = '🔧 Quick Fix Report\n\n'

    // Get all users
    const users = await prisma.user.findMany()
    output += `Total users: ${users.length}\n\n`

    // Get all departments
    const departments = await prisma.department.findMany()
    const deptMap = new Map()
    departments.forEach(d => deptMap.set(d.name, d.id))

    // Find problematic users
    const problematicUsers = users.filter(u => u.department && !u.departmentId)
    output += `Users with department but no departmentId: ${problematicUsers.length}\n`

    for (const user of problematicUsers) {
      output += `- ${user.name} (${user.email}) - Dept: ${user.department}\n`
    }

    // Fix them
    let fixedCount = 0
    for (const user of problematicUsers) {
      const deptId = deptMap.get(user.department)
      if (deptId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { departmentId: deptId }
        })
        fixedCount++
        output += `Fixed: ${user.name} -> ${user.department} (${deptId})\n`
      }
    }

    output += `\nFixed ${fixedCount} users\n`

    // Write to file
    fs.writeFileSync('fix-report.txt', output)
    console.log('Fix completed! Check fix-report.txt for details.')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickFix()
