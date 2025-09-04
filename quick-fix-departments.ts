import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickFixDepartments() {
  console.log('🔧 Quick Fix: Department Codes Issue...\n');

  try {
    // Step 1: Clear existing department references
    console.log('1. Clearing department references...');
    await prisma.user.updateMany({
      data: { departmentId: null }
    });

    // Step 2: Delete existing departments
    await prisma.department.deleteMany();
    console.log('   ✅ Cleared existing departments');

    // Step 3: Create proper departments
    console.log('2. Creating standardized departments...');
    const departmentData = [
      { code: 'IT', name: 'Information Technology', description: 'Technology infrastructure and support' },
      { code: 'HR', name: 'Human Resources', description: 'Human resources management' },
      { code: 'FINANCE', name: 'Finance', description: 'Financial planning and accounting' },
      { code: 'OPS', name: 'Operations', description: 'Daily business operations' },
      { code: 'MKT', name: 'Marketing', description: 'Marketing and communications' },
      { code: 'SALES', name: 'Sales', description: 'Sales and customer relations' },
      { code: 'LEGAL', name: 'Legal', description: 'Legal affairs and compliance' },
      { code: 'PROC', name: 'Procurement', description: 'Procurement and vendor management' }
    ];

    const createdDepartments = [];
    for (const dept of departmentData) {
      const created = await prisma.department.create({
        data: {
          ...dept,
          status: 'ACTIVE',
          budget: 100000 // Default budget
        }
      });
      createdDepartments.push(created);
      console.log(`   ✅ Created: ${dept.name} (${dept.code})`);
    }

    // Step 4: Update users with proper department assignments
    console.log('3. Assigning users to departments...');
    
    // Mapping from old department names to new ones
    const departmentMapping = {
      'IT': 'Information Technology',
      'Information Technology': 'Information Technology',
      'HR': 'Human Resources',
      'Human Resources': 'Human Resources',
      'Finance': 'Finance',
      'Operations': 'Operations',
      'Marketing': 'Marketing',
      'Sales': 'Sales',
      'Legal': 'Legal',
      'Procurement': 'Procurement'
    };

    let totalUpdated = 0;
    for (const [oldName, newName] of Object.entries(departmentMapping)) {
      const targetDept = createdDepartments.find(d => d.name === newName);
      if (targetDept) {
        const result = await prisma.user.updateMany({
          where: { department: oldName },
          data: { 
            departmentId: targetDept.id,
            department: targetDept.name
          }
        });
        if (result.count > 0) {
          console.log(`   ✅ Updated ${result.count} users from "${oldName}" to "${newName}"`);
          totalUpdated += result.count;
        }
      }
    }

    // Assign remaining users without departments to IT
    const itDept = createdDepartments.find(d => d.code === 'IT');
    if (itDept) {
      const remainingResult = await prisma.user.updateMany({
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
      
      if (remainingResult.count > 0) {
        console.log(`   ✅ Assigned ${remainingResult.count} remaining users to IT`);
        totalUpdated += remainingResult.count;
      }
    }

    // Step 5: Verify the fix
    console.log('4. Verifying fix...');
    const finalDepartments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { code: 'asc' }
    });

    console.log('\n📊 Final Department Structure:');
    finalDepartments.forEach(dept => {
      console.log(`   ${dept.code}: ${dept.name} (${dept._count.users} users)`);
    });

    const usersWithoutDept = await prisma.user.count({
      where: { departmentId: null }
    });

    console.log('\n🎉 Fix Complete!');
    console.log(`   - Created ${createdDepartments.length} departments with proper codes`);
    console.log(`   - Updated ${totalUpdated} user assignments`);
    console.log(`   - ${usersWithoutDept} users without department (should be 0)`);

    if (usersWithoutDept === 0) {
      console.log('   ✅ All department code issues have been resolved!');
    } else {
      console.log('   ⚠️ Some users still need department assignment');
    }

  } catch (error) {
    console.error('❌ Error during fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickFixDepartments();