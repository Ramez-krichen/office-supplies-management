const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixDepartmentDuplicates() {
  try {
    console.log('🔍 Checking for department duplicates...')
    
    // Get all departments
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log(`📊 Found ${departments.length} departments:`)
    departments.forEach(dept => {
      console.log(`  - ${dept.code}: ${dept.name}`)
    })
    
    // Check for potential duplicates
    const duplicateMap = new Map()
    
    // Define department mappings (old name -> new standardized name)
    const departmentMappings = {
      'Human Resources': 'Human Resources',
      'HR': 'Human Resources',
      'Information Technology': 'Information Technology', 
      'IT': 'Information Technology',
      'Finance': 'Finance',
      'Operations': 'Operations',
      'Marketing': 'Marketing',
      'Sales': 'Sales',
      'Legal': 'Legal',
      'Procurement': 'Procurement',
      'Software Development': 'Software Development'
    }
    
    // Group departments by standardized name
    const groupedDepartments = {}
    departments.forEach(dept => {
      const standardName = departmentMappings[dept.name] || dept.name
      if (!groupedDepartments[standardName]) {
        groupedDepartments[standardName] = []
      }
      groupedDepartments[standardName].push(dept)
    })
    
    console.log('\n🔍 Analyzing department groups...')
    
    for (const [standardName, deptGroup] of Object.entries(groupedDepartments)) {
      if (deptGroup.length > 1) {
        console.log(`\n⚠️  Found duplicate departments for "${standardName}":`)
        deptGroup.forEach(dept => {
          console.log(`   - ${dept.code}: ${dept.name} (ID: ${dept.id})`)
        })
        
        // Choose the primary department (prefer the one with the standard name)
        let primaryDept = deptGroup.find(d => d.name === standardName)
        if (!primaryDept) {
          // If no exact match, prefer the one with more standard code
          primaryDept = deptGroup.find(d => d.code === 'HR' && standardName === 'Human Resources') ||
                       deptGroup.find(d => d.code === 'IT' && standardName === 'Information Technology') ||
                       deptGroup[0] // fallback to first one
        }
        
        const duplicateDepts = deptGroup.filter(d => d.id !== primaryDept.id)
        
        console.log(`   ✅ Primary department: ${primaryDept.code}: ${primaryDept.name}`)
        console.log(`   🗑️  Duplicates to merge: ${duplicateDepts.map(d => `${d.code}: ${d.name}`).join(', ')}`)
        
        // Merge duplicates into primary department
        for (const duplicateDept of duplicateDepts) {
          await mergeDepartments(duplicateDept, primaryDept)
        }
      }
    }
    
    console.log('\n✅ Department duplicate fix completed!')
    
  } catch (error) {
    console.error('❌ Error fixing department duplicates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function mergeDepartments(fromDept, toDept) {
  console.log(`\n🔄 Merging "${fromDept.name}" into "${toDept.name}"...`)
  
  try {
    // 1. Update users from old department to new department
    const usersToUpdate = await prisma.user.findMany({
      where: {
        OR: [
          { departmentId: fromDept.id },
          { department: fromDept.name }
        ]
      }
    })
    
    console.log(`   👥 Updating ${usersToUpdate.length} users...`)
    
    for (const user of usersToUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          departmentId: toDept.id,
          department: toDept.name
        }
      })
    }
    
    // 2. Update requests that reference the old department
    const requestsToUpdate = await prisma.request.count({
      where: {
        requester: {
          OR: [
            { departmentId: fromDept.id },
            { department: fromDept.name }
          ]
        }
      }
    })
    
    console.log(`   📋 Found ${requestsToUpdate} requests to update...`)
    
    // 3. Update any other references (purchase orders, etc.)
    const purchaseOrdersToUpdate = await prisma.purchaseOrder.count({
      where: {
        requester: {
          OR: [
            { departmentId: fromDept.id },
            { department: fromDept.name }
          ]
        }
      }
    })
    
    console.log(`   🛒 Found ${purchaseOrdersToUpdate} purchase orders to update...`)
    
    // 4. Delete the duplicate department
    await prisma.department.delete({
      where: { id: fromDept.id }
    })
    
    console.log(`   ✅ Successfully merged and deleted duplicate department "${fromDept.name}"`)
    
  } catch (error) {
    console.error(`   ❌ Error merging department "${fromDept.name}":`, error)
  }
}

// Run the fix
fixDepartmentDuplicates()
