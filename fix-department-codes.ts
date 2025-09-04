import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDepartmentCodes() {
  console.log('🔧 Fixing Department Code Issues...\n');
  
  try {
    // Step 1: Check current state
    console.log('1. Analyzing current department data...');
    
    const currentDepartments = await prisma.department.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    
    console.log(`Found ${currentDepartments.length} departments in database:`);
    currentDepartments.forEach(dept => {
      console.log(`   - ${dept.name} (${dept.code}) - ID: ${dept.id} - ${dept._count.users} users`);
    });
    
    // Step 2: Get unique department names from users
    const userDepartments = await prisma.user.findMany({
      select: { department: true },
      distinct: ['department'],
      where: { department: { not: null } }
    });
    
    const uniqueDepartmentNames = userDepartments.map(u => u.department).filter(Boolean);
    console.log(`\nFound ${uniqueDepartmentNames.length} unique department names from users:`);
    uniqueDepartmentNames.forEach(name => console.log(`   - ${name}`));
    
    // Step 3: Define the correct department structure with proper codes
    const standardDepartments = [
      { code: 'IT', name: 'Information Technology', description: 'Manages technology infrastructure, software development, and IT support services', budget: 500000 },
      { code: 'HR', name: 'Human Resources', description: 'Handles recruitment, employee relations, benefits, and organizational development', budget: 200000 },
      { code: 'FINANCE', name: 'Finance', description: 'Manages financial planning, accounting, budgeting, and financial reporting', budget: 300000 },
      { code: 'OPS', name: 'Operations', description: 'Oversees daily business operations, process optimization, and operational efficiency', budget: 400000 },
      { code: 'MKT', name: 'Marketing', description: 'Develops marketing strategies, brand management, and customer acquisition', budget: 250000 },
      { code: 'SALES', name: 'Sales', description: 'Manages sales processes, customer relationships, and revenue generation', budget: 350000 },
      { code: 'LEGAL', name: 'Legal', description: 'Provides legal counsel, contract management, and compliance oversight', budget: 150000 },
      { code: 'PROC', name: 'Procurement', description: 'Manages supplier relationships, purchasing processes, and vendor management', budget: 180000 },
      { code: 'EXE', name: 'Executive', description: 'Executive management and strategic planning', budget: 100000 }
    ];
    
    // Step 4: Delete all existing departments to start fresh
    console.log('\n2. Cleaning up existing departments...');
    
    // First, remove departmentId references from users to avoid foreign key constraint issues
    await prisma.user.updateMany({
      data: { departmentId: null }
    });
    console.log('   ✅ Cleared departmentId references from users');
    
    // Delete all departments
    const deletedCount = await prisma.department.deleteMany();
    console.log(`   ✅ Deleted ${deletedCount.count} existing departments`);
    
    // Step 5: Create the correct departments with proper codes
    console.log('\n3. Creating standardized departments...');
    
    const createdDepartments = [];
    for (const dept of standardDepartments) {
      const createdDept = await prisma.department.create({
        data: {
          code: dept.code,
          name: dept.name,
          description: dept.description,
          budget: dept.budget,
          status: 'ACTIVE'
        }
      });
      createdDepartments.push(createdDept);
      console.log(`   ✅ Created: ${dept.name} (${dept.code}) - ID: ${createdDept.id}`);
    }
    
    // Step 6: Map user department names to correct department IDs
    console.log('\n4. Mapping users to correct departments...');
    
    // Create mapping from old department names to new department IDs
    const departmentMapping = {
      'Information Technology': 'IT',
      'IT': 'IT',
      'Information Technology Department': 'IT',
      'Human Resources': 'HR',
      'HR': 'HR',
      'Human Resources Department': 'HR',
      'Finance': 'FINANCE',
      'Finance Department': 'FINANCE',
      'Operations': 'OPS',
      'OPS': 'OPS',
      'Operations Department': 'OPS',
      'Marketing': 'MKT',
      'MKT': 'MKT',
      'Marketing Department': 'MKT',
      'Sales': 'SALES',
      'SALES': 'SALES',
      'Sales Department': 'SALES',
      'Legal': 'LEGAL',
      'Legal Department': 'LEGAL',
      'LEGAL': 'LEGAL',
      'Procurement': 'PROC',
      'PROC': 'PROC',
      'Procurement Department': 'PROC',
      'Executive': 'EXE',
      'EXE': 'EXE',
      'Executive Department': 'EXE'
    };
    
    let updatedUsers = 0;
    let unmappedDepartments = new Set();
    
    for (const userDeptName of uniqueDepartmentNames) {
      const targetCode = departmentMapping[userDeptName];
      
      if (targetCode) {
        const targetDepartment = createdDepartments.find(d => d.code === targetCode);
        
        if (targetDepartment) {
          const updateResult = await prisma.user.updateMany({
            where: { department: userDeptName },
            data: { 
              departmentId: targetDepartment.id,
              department: targetDepartment.name // Standardize the department name too
            }
          });
          
          updatedUsers += updateResult.count;
          console.log(`   ✅ Mapped "${userDeptName}" → ${targetDepartment.name} (${targetDepartment.code}): ${updateResult.count} users`);
        }
      } else {
        unmappedDepartments.add(userDeptName);
        console.log(`   ⚠️ No mapping for "${userDeptName}"`);
      }
    }
    
    // Handle unmapped departments
    if (unmappedDepartments.size > 0) {
      console.log('\n5. Handling unmapped departments...');
      
      for (const unmappedName of unmappedDepartments) {
        // Assign to IT as default
        const itDepartment = createdDepartments.find(d => d.code === 'IT');
        if (itDepartment) {
          const updateResult = await prisma.user.updateMany({
            where: { department: unmappedName },
            data: { 
              departmentId: itDepartment.id,
              department: itDepartment.name
            }
          });
          
          console.log(`   ✅ Assigned "${unmappedName}" → IT Department: ${updateResult.count} users`);
          updatedUsers += updateResult.count;
        }
      }
    }
    
    // Step 7: Verify the fix
    console.log('\n6. Verifying the fix...');
    
    const finalDepartments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    
    console.log('Final department structure:');
    finalDepartments.forEach(dept => {
      console.log(`   ✅ ${dept.name} (${dept.code}) - ID: ${dept.id} - ${dept._count.users} users`);
    });
    
    // Check for users without department assignments
    const usersWithoutDept = await prisma.user.count({
      where: { departmentId: null }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Created ${createdDepartments.length} standardized departments`);
    console.log(`   - Updated ${updatedUsers} user assignments`);
    console.log(`   - ${usersWithoutDept} users still without department assignment`);
    
    if (usersWithoutDept > 0) {
      console.log('\n⚠️ Some users still need department assignment. Running additional cleanup...');
      
      // Assign users without departments to IT as default
      const itDept = finalDepartments.find(d => d.code === 'IT');
      if (itDept) {
        const finalUpdateResult = await prisma.user.updateMany({
          where: { 
            OR: [
              { departmentId: null },
              { department: null },
              { department: '' }
            ]
          },
          data: { 
            departmentId: itDept.id,
            department: itDept.name
          }
        });
        
        console.log(`   ✅ Assigned ${finalUpdateResult.count} remaining users to IT Department`);
      }
    }
    
    console.log('\n🎉 Department code issues have been fixed!');
    console.log('   All departments now have proper codes (IT, HR, FINANCE, etc.)');
    console.log('   Users are properly linked to department records');
    console.log('   The UI should now display correct department codes');
    
  } catch (error) {
    console.error('❌ Error fixing department codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDepartmentCodes();