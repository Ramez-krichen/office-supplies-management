import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('👥 Checking Users in Database...\n')

    // Get all users
    const users = await prisma.user.findMany({
      orderBy: [
        { role: 'asc' },
        { department: 'asc' },
        { name: 'asc' }
      ]
    })

    console.log(`Total users: ${users.length}\n`)

    // Group users by their issues
    const usersWithDeptButNoDeptId = users.filter(u => u.department && !u.departmentId)
    const usersWithDeptIdButNoDept = users.filter(u => !u.department && u.departmentId)
    const usersWithBoth = users.filter(u => u.department && u.departmentId)
    const usersWithNeither = users.filter(u => !u.department && !u.departmentId)

    console.log('📊 User Analysis:')
    console.log(`   Users with department but NO departmentId: ${usersWithDeptButNoDeptId.length}`)
    console.log(`   Users with departmentId but NO department: ${usersWithDeptIdButNoDept.length}`)
    console.log(`   Users with BOTH department and departmentId: ${usersWithBoth.length}`)
    console.log(`   Users with NEITHER department nor departmentId: ${usersWithNeither.length}`)

    if (usersWithDeptButNoDeptId.length > 0) {
      console.log('\n❌ Users with department but NO departmentId:')
      for (const user of usersWithDeptButNoDeptId) {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role} - Dept: ${user.department}`)
      }
    }

    if (usersWithDeptIdButNoDept.length > 0) {
      console.log('\n❌ Users with departmentId but NO department:')
      for (const user of usersWithDeptIdButNoDept) {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role} - DeptId: ${user.departmentId}`)
      }
    }

    if (usersWithBoth.length > 0) {
      console.log('\n✅ Users with BOTH department and departmentId:')
      for (const user of usersWithBoth) {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role} - Dept: ${user.department}`)
      }
    }

    if (usersWithNeither.length > 0) {
      console.log('\n⚠️ Users with NEITHER department nor departmentId:')
      for (const user of usersWithNeither) {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`)
      }
    }

    // Get all departments for reference
    console.log('\n🏢 Available Departments:')
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    })
    
    for (const dept of departments) {
      console.log(`   - ${dept.name} (${dept.code}) - ID: ${dept.id}`)
    }

  } catch (error) {
    console.error('❌ Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
