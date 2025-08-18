import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixUserDepartments() {
  try {
    console.log('🔧 Fixing User Department Assignments...\n')

    // 1. First, let's see what we have
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        departmentId: true
      },
      orderBy: { name: 'asc' }
    })

    console.log(`📊 Total users found: ${allUsers.length}`)

    // 2. Get all departments for mapping
    const departments = await prisma.department.findMany()
    console.log(`📊 Total departments found: ${departments.length}`)

    // Create a mapping from department name to department ID
    const deptNameToId = new Map()
    departments.forEach(dept => {
      deptNameToId.set(dept.name, dept.id)
    })

    console.log('\n🏢 Department mapping:')
    departments.forEach(dept => {
      console.log(`   ${dept.name} -> ${dept.id}`)
    })

    // 3. Find users with issues
    const usersWithDeptButNoDeptId = allUsers.filter(u => u.department && !u.departmentId)
    const usersWithoutBoth = allUsers.filter(u => !u.department && !u.departmentId)

    console.log(`\n❌ Users with department name but no departmentId: ${usersWithDeptButNoDeptId.length}`)
    console.log(`⚠️ Users without department or departmentId: ${usersWithoutBoth.length}`)

    // 4. Fix users with department name but no departmentId
    if (usersWithDeptButNoDeptId.length > 0) {
      console.log('\n🔧 Fixing users with department name but no departmentId:')
      
      for (const user of usersWithDeptButNoDeptId) {
        const departmentId = deptNameToId.get(user.department)
        
        if (departmentId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { departmentId }
          })
          console.log(`   ✅ Fixed ${user.name} (${user.email}) - ${user.department} -> ${departmentId}`)
        } else {
          console.log(`   ❌ Could not find department ID for ${user.name} - department: ${user.department}`)
        }
      }
    }

    // 5. Check if there are any old users that need to be assigned to departments
    if (usersWithoutBoth.length > 0) {
      console.log('\n⚠️ Users without any department assignment:')
      for (const user of usersWithoutBoth) {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
      }
      
      // For demonstration, let's assign them to IT department
      const itDepartment = departments.find(d => d.code === 'IT')
      if (itDepartment && usersWithoutBoth.length > 0) {
        console.log(`\n🔧 Assigning unassigned users to ${itDepartment.name}:`)
        
        for (const user of usersWithoutBoth) {
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              department: itDepartment.name,
              departmentId: itDepartment.id 
            }
          })
          console.log(`   ✅ Assigned ${user.name} to ${itDepartment.name}`)
        }
      }
    }

    // 6. Final verification
    console.log('\n📊 Final verification:')
    const updatedUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        departmentId: true
      },
      orderBy: { department: 'asc' }
    })

    const stillBroken = updatedUsers.filter(u => u.department && !u.departmentId)
    const stillUnassigned = updatedUsers.filter(u => !u.department && !u.departmentId)

    console.log(`   Users still with department but no departmentId: ${stillBroken.length}`)
    console.log(`   Users still unassigned: ${stillUnassigned.length}`)

    if (stillBroken.length === 0 && stillUnassigned.length === 0) {
      console.log('   ✅ All users properly assigned!')
    }

    // 7. Show final user count per department
    console.log('\n📊 Users per department:')
    for (const dept of departments) {
      const userCount = await prisma.user.count({
        where: { departmentId: dept.id }
      })
      console.log(`   ${dept.name}: ${userCount} users`)
    }

    console.log('\n🎉 User department fix completed!')

  } catch (error) {
    console.error('❌ Error fixing user departments:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUserDepartments()
