const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDepartments() {
  console.log('🔧 Fixing department dashboard issue...\n');

  try {
    // 1. Create departments
    console.log('1. Creating departments...');
    const departmentData = [
      { code: 'IT', name: 'Information Technology', description: 'IT and technical support department' },
      { code: 'HR', name: 'Human Resources', description: 'Human resources and personnel management' },
      { code: 'FIN', name: 'Finance', description: 'Financial planning and accounting' },
      { code: 'OPS', name: 'Operations', description: 'Operations and business processes' },
      { code: 'MKT', name: 'Marketing', description: 'Marketing and communications' },
      { code: 'SLS', name: 'Sales', description: 'Sales and customer relations' },
      { code: 'LGL', name: 'Legal', description: 'Legal and compliance' },
      { code: 'PROC', name: 'Procurement', description: 'Procurement and supply chain' }
    ];

    const departments = [];
    for (const deptData of departmentData) {
      const department = await prisma.department.create({
        data: {
          ...deptData,
          status: 'ACTIVE',
          createdAt: new Date()
        }
      });
      departments.push(department);
      console.log(`   ✅ Created department: ${department.name} (${department.code})`);
    }

    console.log(`\n✅ Created ${departments.length} departments`);

    // 2. Update existing users to link to departments
    console.log('\n2. Linking users to departments...');

    // Map department names to department records
    const deptMap = {
      'IT': departments.find(d => d.code === 'IT'),
      'HR': departments.find(d => d.code === 'HR'),
      'Finance': departments.find(d => d.code === 'FIN'),
      'Operations': departments.find(d => d.code === 'OPS'),
      'Marketing': departments.find(d => d.code === 'MKT'),
      'Sales': departments.find(d => d.code === 'SLS'),
      'Legal': departments.find(d => d.code === 'LGL'),
      'Procurement': departments.find(d => d.code === 'PROC')
    };

    // Get all users
    const users = await prisma.user.findMany();

    let updatedCount = 0;
    for (const user of users) {
      const department = deptMap[user.department];
      if (department && !user.departmentId) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            departmentId: department.id,
            department: department.name // Update to full name
          }
        });
        updatedCount++;
        console.log(`   ✅ Linked ${user.name} to ${department.name}`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} users with department links`);

    // 3. Verify the fix
    console.log('\n3. Verifying the fix...');

    const deptCount = await prisma.department.count();
    const usersWithDept = await prisma.user.count({
      where: { departmentId: { not: null } }
    });

    console.log(`   Departments: ${deptCount}`);
    console.log(`   Users with departments: ${usersWithDept}`);

    if (deptCount > 0 && usersWithDept > 0) {
      console.log('\n🎉 Department dashboard issue has been fixed!');
      console.log('   The API should now work correctly.');
    } else {
      console.log('\n❌ Something went wrong. Please check the database.');
    }

  } catch (error) {
    console.error('❌ Error fixing departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDepartments();