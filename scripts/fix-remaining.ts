import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixRemaining() {
  try {
    console.log('🔧 Fixing remaining users...\n')

    // Get all departments
    const departments = await prisma.department.findMany()
    console.log('Available departments:')
    departments.forEach(d => console.log(`  ${d.name} (${d.code})`))

    // Create mapping for common variations
    const deptMapping = new Map()
    departments.forEach(d => {
      deptMapping.set(d.name, d.id)
      deptMapping.set(d.code, d.id)
    })
    
    // Add common variations
    deptMapping.set('IT', departments.find(d => d.code === 'IT')?.id)
    deptMapping.set('Information Technology', departments.find(d => d.code === 'IT')?.id)
    deptMapping.set('HR', departments.find(d => d.code === 'HR')?.id)
    deptMapping.set('Human Resources', departments.find(d => d.code === 'HR')?.id)

    // Get users still needing fixes
    const problematicUsers = await prisma.user.findMany({
      where: {
        department: { not: null },
        departmentId: null
      }
    })

    console.log(`\nUsers still needing fixes: ${problematicUsers.length}`)

    for (const user of problematicUsers) {
      console.log(`- ${user.name} (${user.email}) - Dept: "${user.department}"`)
      
      const deptId = deptMapping.get(user.department)
      if (deptId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { departmentId: deptId }
        })
        console.log(`  ✅ Fixed: ${user.department} -> ${deptId}`)
      } else {
        console.log(`  ❌ No mapping found for: "${user.department}"`)
      }
    }

    // Final check
    const stillProblematic = await prisma.user.count({
      where: {
        department: { not: null },
        departmentId: null
      }
    })

    console.log(`\nRemaining problematic users: ${stillProblematic}`)

    if (stillProblematic === 0) {
      console.log('🎉 All users fixed!')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixRemaining()
