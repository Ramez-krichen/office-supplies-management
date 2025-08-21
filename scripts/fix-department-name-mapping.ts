import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDepartmentNameMapping() {
  try {
    console.log('🔧 Fixing Department Name Mapping...\n')

    // Create a mapping from old department names to new department names
    const departmentMapping = new Map([
      ['IT', 'Information Technology'],
      ['HR', 'Human Resources'],
      ['Finance', 'Finance'],
      ['Operations', 'Operations'],
      ['Marketing', 'Marketing'],
      ['Sales', 'Sales'],
      ['Legal', 'Legal'],
      ['Procurement', 'Procurement']
    ])

    // Get all departments for ID mapping
    const departments = await prisma.department.findMany()
    const deptNameToId = new Map()
    departments.forEach(dept => {
      deptNameToId.set(dept.name, dept.id)
    })

    console.log('🏢 Available departments:')
    departments.forEach(dept => {
      console.log(`   ${dept.name} (${dept.code}) -> ${dept.id}`)
    })

    // Find users with unmapped departments
    const usersWithUnmappedDepts = await prisma.user.findMany({
      where: {
        department: { not: null },
        departmentId: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentId: true
      }
    })

    console.log(`\n❌ Users with unmapped departments: ${usersWithUnmappedDepts.length}`)

    if (usersWithUnmappedDepts.length > 0) {
      console.log('\n🔧 Fixing department mappings:')
      
      for (const user of usersWithUnmappedDepts) {
        const correctDeptName = departmentMapping.get(user.department!)
        
        if (correctDeptName) {
          const departmentId = deptNameToId.get(correctDeptName)
          
          if (departmentId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { 
                department: correctDeptName,
                departmentId 
              }
            })
            console.log(`   ✅ Fixed ${user.name} - "${user.department}" -> "${correctDeptName}" (${departmentId})`)
          } else {
            console.log(`   ❌ Could not find department ID for ${correctDeptName}`)
          }
        } else {
          console.log(`   ⚠️ No mapping found for ${user.name} - department: "${user.department}"`)
        }
      }
    }

    // Final verification
    console.log('\n📊 Final verification:')
    const stillUnmapped = await prisma.user.count({
      where: {
        department: { not: null },
        departmentId: null
      }
    })

    console.log(`   Users still unmapped: ${stillUnmapped}`)

    if (stillUnmapped === 0) {
      console.log('   ✅ All users properly mapped!')
    }

    // Show final user count per department
    console.log('\n📊 Final users per department:')
    for (const dept of departments) {
      const userCount = await prisma.user.count({
        where: { departmentId: dept.id }
      })
      console.log(`   ${dept.name}: ${userCount} users`)
    }

    console.log('\n🎉 Department name mapping fix completed!')

  } catch (error) {
    console.error('❌ Error fixing department name mapping:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDepartmentNameMapping()