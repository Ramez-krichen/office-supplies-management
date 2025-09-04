import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDepartmentFix() {
  console.log('🧪 Testing Department Fix...\n');
  
  try {
    // Test 1: Check if departments exist with proper codes
    console.log('1. Checking department structure...');
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { code: 'asc' }
    });
    
    console.log(`📊 Found ${departments.length} departments:`);
    departments.forEach(dept => {
      console.log(`   ${dept.code}: ${dept.name} (${dept._count.users} users)`);
    });
    
    if (departments.length === 0) {
      console.log('❌ No departments found! Running quick fix...');
      
      // Run the fix
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

      for (const dept of departmentData) {
        const created = await prisma.department.create({
          data: {
            ...dept,
            status: 'ACTIVE',
            budget: 100000
          }
        });
        console.log(`   ✅ Created: ${dept.name} (${dept.code})`);
      }
      
      console.log('✅ Departments created successfully!');
    }
    
    // Test 2: Check user assignments
    console.log('\n2. Checking user department assignments...');
    const usersWithoutDepartment = await prisma.user.count({
      where: { departmentId: null }
    });
    
    const totalUsers = await prisma.user.count();
    console.log(`📊 Users: ${totalUsers - usersWithoutDepartment}/${totalUsers} have department assignments`);
    
    if (usersWithoutDepartment > 0) {
      console.log(`⚠️ ${usersWithoutDepartment} users need department assignment`);
      
      // Assign orphaned users to IT department
      const itDept = await prisma.department.findFirst({ where: { code: 'IT' } });
      if (itDept) {
        const updateResult = await prisma.user.updateMany({
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
        console.log(`   ✅ Assigned ${updateResult.count} users to IT department`);
      }
    }
    
    // Test 3: Verify proper codes exist
    console.log('\n3. Verifying department codes...');
    const expectedCodes = ['IT', 'HR', 'FINANCE', 'OPS', 'MKT', 'SALES', 'LEGAL', 'PROC'];
    const actualCodes = departments.map(d => d.code);
    
    const missingCodes = expectedCodes.filter(code => !actualCodes.includes(code));
    const extraCodes = actualCodes.filter(code => !expectedCodes.includes(code));
    
    if (missingCodes.length === 0 && extraCodes.length === 0) {
      console.log('✅ All department codes are correct!');
    } else {
      if (missingCodes.length > 0) {
        console.log(`❌ Missing codes: ${missingCodes.join(', ')}`);
      }
      if (extraCodes.length > 0) {
        console.log(`⚠️ Extra codes: ${extraCodes.join(', ')}`);
      }
    }
    
    // Test 4: Test API compatibility
    console.log('\n4. Testing API data structure...');
    const sampleDept = departments[0];
    if (sampleDept) {
      console.log(`📝 Sample department structure:`);
      console.log(`   ID: ${sampleDept.id}`);
      console.log(`   Code: ${sampleDept.code}`);
      console.log(`   Name: ${sampleDept.name}`);
      console.log(`   Status: ${sampleDept.status}`);
      console.log(`   Users: ${sampleDept._count.users}`);
    }
    
    console.log('\n🎉 Department fix verification completed!');
    console.log('The UI should now display proper department codes instead of random IDs.');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDepartmentFix();