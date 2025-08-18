const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixAllIssues() {
  try {
    console.log('🔧 Fixing all department and notification issues...')
    
    // 1. Clean up test departments and managers
    console.log('\n1️⃣ Cleaning up test data...')
    
    // Delete test managers
    const testManagers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } }
        ]
      }
    })
    
    for (const manager of testManagers) {
      console.log(`   🗑️  Deleting test manager: ${manager.name} (${manager.email})`)
      await prisma.user.delete({ where: { id: manager.id } })
    }
    
    // Delete test departments
    const testDepartments = await prisma.department.findMany({
      where: {
        OR: [
          { code: { contains: 'TEST' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'test' } }
        ]
      }
    })
    
    for (const dept of testDepartments) {
      console.log(`   🗑️  Deleting test department: ${dept.name} (${dept.code})`)
      await prisma.department.delete({ where: { id: dept.id } })
    }
    
    // 2. Fix department duplicates and standardize names
    console.log('\n2️⃣ Fixing department duplicates and standardizing names...')
    
    const allDepartments = await prisma.department.findMany({
      include: {
        users: true,
        manager: true
      }
    })
    
    console.log(`   📊 Found ${allDepartments.length} departments`)
    
    // Define the correct department structure
    const standardDepartments = {
      'HR': { name: 'Human Resources', code: 'HR' },
      'IT': { name: 'Information Technology', code: 'IT' },
      'FINANCE': { name: 'Finance', code: 'FINANCE' },
      'OPS': { name: 'Operations', code: 'OPS' },
      'MKT': { name: 'Marketing', code: 'MKT' },
      'SALES': { name: 'Sales', code: 'SALES' },
      'LEGAL': { name: 'Legal', code: 'LEGAL' },
      'PROC': { name: 'Procurement', code: 'PROC' },
      'IT_DEV': { name: 'Software Development', code: 'IT_DEV' }
    }
    
    // Group departments by their intended standard
    const departmentGroups = {}
    
    for (const dept of allDepartments) {
      let standardKey = null
      
      // Map departments to their standard equivalents
      if (dept.code === 'HR' || dept.name === 'Human Resources' || dept.name === 'HR') {
        standardKey = 'HR'
      } else if (dept.code === 'IT' || dept.name === 'Information Technology' || dept.name === 'IT') {
        standardKey = 'IT'
      } else if (dept.code === 'FINANCE' || dept.name === 'Finance') {
        standardKey = 'FINANCE'
      } else if (dept.code === 'OPS' || dept.name === 'Operations') {
        standardKey = 'OPS'
      } else if (dept.code === 'MKT' || dept.name === 'Marketing') {
        standardKey = 'MKT'
      } else if (dept.code === 'SALES' || dept.name === 'Sales') {
        standardKey = 'SALES'
      } else if (dept.code === 'LEGAL' || dept.name === 'Legal') {
        standardKey = 'LEGAL'
      } else if (dept.code === 'PROC' || dept.name === 'Procurement') {
        standardKey = 'PROC'
      } else if (dept.code === 'IT_DEV' || dept.name === 'Software Development') {
        standardKey = 'IT_DEV'
      }
      
      if (standardKey) {
        if (!departmentGroups[standardKey]) {
          departmentGroups[standardKey] = []
        }
        departmentGroups[standardKey].push(dept)
      }
    }
    
    // Process each department group
    for (const [standardKey, deptGroup] of Object.entries(departmentGroups)) {
      const standard = standardDepartments[standardKey]
      
      if (deptGroup.length > 1) {
        console.log(`\n   ⚠️  Found ${deptGroup.length} departments for ${standard.name}:`)
        deptGroup.forEach(d => console.log(`      - ${d.code}: ${d.name}`))
        
        // Choose primary department (prefer one with correct code)
        let primaryDept = deptGroup.find(d => d.code === standard.code) || deptGroup[0]
        const duplicates = deptGroup.filter(d => d.id !== primaryDept.id)
        
        console.log(`   ✅ Primary: ${primaryDept.code}: ${primaryDept.name}`)
        
        // Merge users from duplicates to primary
        for (const duplicate of duplicates) {
          console.log(`   🔄 Merging users from ${duplicate.name}...`)
          
          // Update users to point to primary department
          await prisma.user.updateMany({
            where: { departmentId: duplicate.id },
            data: { 
              departmentId: primaryDept.id,
              department: standard.name
            }
          })
          
          // Delete duplicate department
          await prisma.department.delete({ where: { id: duplicate.id } })
          console.log(`   🗑️  Deleted duplicate: ${duplicate.name}`)
        }
        
        // Update primary department to have correct name
        await prisma.department.update({
          where: { id: primaryDept.id },
          data: {
            name: standard.name,
            code: standard.code
          }
        })
        console.log(`   ✅ Updated primary to: ${standard.code}: ${standard.name}`)
        
      } else if (deptGroup.length === 1) {
        // Single department - just ensure it has the correct name
        const dept = deptGroup[0]
        if (dept.name !== standard.name || dept.code !== standard.code) {
          await prisma.department.update({
            where: { id: dept.id },
            data: {
              name: standard.name,
              code: standard.code
            }
          })
          console.log(`   ✅ Standardized: ${dept.name} → ${standard.name}`)
        }
      }
    }
    
    // 3. Update all users to have correct department names
    console.log('\n3️⃣ Updating user department references...')
    
    const finalDepartments = await prisma.department.findMany()
    for (const dept of finalDepartments) {
      const userCount = await prisma.user.updateMany({
        where: { departmentId: dept.id },
        data: { department: dept.name }
      })
      console.log(`   ✅ Updated ${userCount.count} users in ${dept.name}`)
    }
    
    console.log('\n🎉 All issues fixed successfully!')
    
    // 4. Show final department status
    console.log('\n📊 Final Department Status:')
    const finalDepts = await prisma.department.findMany({
      include: {
        manager: { select: { name: true } },
        _count: { select: { users: true } }
      },
      orderBy: { code: 'asc' }
    })
    
    finalDepts.forEach(dept => {
      const managerStatus = dept.manager ? `✅ ${dept.manager.name}` : '❌ No manager'
      console.log(`   ${dept.code}: ${dept.name} - ${managerStatus} (${dept._count.users} users)`)
    })
    
  } catch (error) {
    console.error('❌ Error fixing issues:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAllIssues()
