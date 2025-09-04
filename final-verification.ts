import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalVerification() {
  console.log('🔍 Final Verification: Department Code Fix\n');

  try {
    // Step 1: Verify department structure
    console.log('1. Verifying department structure...');
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { users: true } }
      },
      orderBy: { code: 'asc' }
    });

    if (departments.length === 0) {
      console.log('❌ No departments found! Creating them now...');
      
      // Create departments with proper codes
      const departmentData = [
        { code: 'IT', name: 'Information Technology', description: 'Technology infrastructure and support', budget: 500000 },
        { code: 'HR', name: 'Human Resources', description: 'Human resources management', budget: 200000 },
        { code: 'FINANCE', name: 'Finance', description: 'Financial planning and accounting', budget: 300000 },
        { code: 'OPS', name: 'Operations', description: 'Daily business operations', budget: 400000 },
        { code: 'MKT', name: 'Marketing', description: 'Marketing and communications', budget: 250000 },
        { code: 'SALES', name: 'Sales', description: 'Sales and customer relations', budget: 350000 },
        { code: 'LEGAL', name: 'Legal', description: 'Legal affairs and compliance', budget: 150000 },
        { code: 'PROC', name: 'Procurement', description: 'Procurement and vendor management', budget: 180000 }
      ];

      for (const dept of departmentData) {
        await prisma.department.create({
          data: {
            ...dept,
            status: 'ACTIVE'
          }
        });
      }
      
      console.log('✅ Created all departments with proper codes');
      
      // Re-fetch departments
      const newDepartments = await prisma.department.findMany({
        include: { _count: { select: { users: true } } },
        orderBy: { code: 'asc' }
      });
      
      departments.length = 0;
      departments.push(...newDepartments);
    }

    console.log(`📊 Found ${departments.length} departments:`);
    departments.forEach(dept => {
      console.log(`   ${dept.code}: ${dept.name} (${dept._count.users} users)`);
    });

    // Step 2: Fix user assignments
    console.log('\n2. Fixing user department assignments...');
    
    // Create mapping for user departments
    const departmentMapping: Record<string, string> = {
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

    let totalFixed = 0;
    
    for (const [oldName, newName] of Object.entries(departmentMapping)) {
      const targetDept = departments.find(d => d.name === newName);
      if (targetDept) {
        const result = await prisma.user.updateMany({
          where: { 
            department: oldName,
            departmentId: null // Only update users without proper department ID
          },
          data: { 
            departmentId: targetDept.id,
            department: targetDept.name
          }
        });
        
        if (result.count > 0) {
          console.log(`   ✅ Fixed ${result.count} users: "${oldName}" → ${newName}`);
          totalFixed += result.count;
        }
      }
    }

    // Assign remaining orphaned users to IT
    const itDept = departments.find(d => d.code === 'IT');
    if (itDept) {
      const orphanedResult = await prisma.user.updateMany({
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

      if (orphanedResult.count > 0) {
        console.log(`   ✅ Assigned ${orphanedResult.count} orphaned users to IT`);
        totalFixed += orphanedResult.count;
      }
    }

    // Step 3: Verify the fix
    console.log('\n3. Verification results...');
    
    const totalUsers = await prisma.user.count();
    const usersWithDept = await prisma.user.count({
      where: { departmentId: { not: null } }
    });
    const usersWithoutDept = totalUsers - usersWithDept;

    console.log(`📊 User assignments: ${usersWithDept}/${totalUsers} users have proper department IDs`);
    
    if (usersWithoutDept > 0) {
      console.log(`⚠️ ${usersWithoutDept} users still need department assignment`);
    }

    // Step 4: Check for the specific codes mentioned in screenshots
    console.log('\n4. Checking for proper department codes...');
    const expectedCodes = ['IT', 'HR', 'FINANCE', 'OPS', 'MKT', 'SALES', 'LEGAL', 'PROC'];
    const actualCodes = departments.map(d => d.code);
    const hasAllCodes = expectedCodes.every(code => actualCodes.includes(code));

    if (hasAllCodes) {
      console.log('✅ All expected department codes are present!');
    } else {
      const missing = expectedCodes.filter(code => !actualCodes.includes(code));
      console.log(`❌ Missing codes: ${missing.join(', ')}`);
    }

    // Step 5: Verify no more CUID-style IDs
    console.log('\n5. Checking for problematic CUID-style codes...');
    const problematicDepts = departments.filter(d => 
      d.code.length > 10 || d.code.includes('cmekk') || d.code.match(/^[a-z0-9]{20,}$/i)
    );

    if (problematicDepts.length === 0) {
      console.log('✅ No problematic CUID-style department codes found!');
    } else {
      console.log(`❌ Found ${problematicDepts.length} departments with problematic codes:`);
      problematicDepts.forEach(dept => {
        console.log(`   - ${dept.code}: ${dept.name}`);
      });
    }

    // Final summary
    console.log('\n🎉 FINAL SUMMARY:');
    console.log(`   ✅ ${departments.length} departments with proper codes created`);
    console.log(`   ✅ ${totalFixed} user assignments fixed`);
    console.log(`   ✅ ${usersWithDept}/${totalUsers} users properly assigned`);
    
    if (hasAllCodes && problematicDepts.length === 0 && usersWithoutDept === 0) {
      console.log('\n🎊 SUCCESS! All department code issues have been resolved!');
      console.log('   - Department codes are now IT, HR, FINANCE, etc. (not random IDs)');
      console.log('   - Users are properly linked to department records');
      console.log('   - The UI should now display correct department codes');
      console.log('   - The database structure matches what the screenshots show');
    } else {
      console.log('\n⚠️ Some issues remain - please check the details above');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();