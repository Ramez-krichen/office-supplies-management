const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDepartmentDashboard() {
  console.log('=== Department Dashboard Debug ===\n');
  
  try {
    // 1. Check database connection
    console.log('1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful\n');
    
    // 2. Check if departments exist
    console.log('2. Checking departments...');
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    
    if (departments.length === 0) {
      console.log('❌ No departments found in database!');
      console.log('This is likely the cause of the error.\n');
    } else {
      console.log(`✅ Found ${departments.length} departments:`);
      departments.forEach(dept => {
        console.log(`   - ${dept.name} (${dept.code}): ${dept._count.users} users`);
      });
      console.log();
    }
    
    // 3. Check users with departments
    console.log('3. Checking users with department assignments...');
    const usersWithDept = await prisma.user.count({
      where: {
        departmentId: { not: null }
      }
    });
    
    const totalUsers = await prisma.user.count();
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with department: ${usersWithDept}`);
    console.log(`   Users without department: ${totalUsers - usersWithDept}\n`);
    
    // 4. Check for orphaned department references
    console.log('4. Checking for orphaned department references in users...');
    const usersWithDeptString = await prisma.user.findMany({
      where: {
        department: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentId: true
      }
    });
    
    if (usersWithDeptString.length > 0) {
      console.log(`Found ${usersWithDeptString.length} users with department string field:`);
      usersWithDeptString.slice(0, 5).forEach(user => {
        console.log(`   - ${user.name}: department="${user.department}", departmentId=${user.departmentId}`);
      });
      console.log();
    }
    
    // 5. Check for requests
    console.log('5. Checking requests data...');
    const requestCount = await prisma.request.count();
    const requestsWithDept = await prisma.request.count({
      where: {
        requester: {
          departmentId: { not: null }
        }
      }
    });
    
    console.log(`   Total requests: ${requestCount}`);
    console.log(`   Requests from users with departments: ${requestsWithDept}\n`);
    
    // 6. Check for purchase orders
    console.log('6. Checking purchase orders...');
    const poCount = await prisma.purchaseOrder.count();
    const posWithDept = await prisma.purchaseOrder.count({
      where: {
        createdBy: {
          departmentId: { not: null }
        }
      }
    });
    
    console.log(`   Total purchase orders: ${poCount}`);
    console.log(`   POs from users with departments: ${posWithDept}\n`);
    
    // 7. Test a specific department query (like the API does)
    console.log('7. Testing department query (simulating API call)...');
    if (departments.length > 0) {
      const testDept = departments[0];
      console.log(`   Testing with department: ${testDept.name}`);
      
      // Try to find department by name or code
      const foundDept = await prisma.department.findFirst({
        where: {
          OR: [
            { name: testDept.name },
            { code: testDept.name }
          ]
        }
      });
      
      if (foundDept) {
        console.log(`   ✅ Successfully found department by name/code`);
        
        // Test request count for this department
        const deptRequests = await prisma.request.count({
          where: {
            requester: { departmentId: foundDept.id }
          }
        });
        console.log(`   Department has ${deptRequests} requests`);
      } else {
        console.log(`   ❌ Could not find department by name/code`);
      }
    }
    
    console.log('\n=== Diagnosis Summary ===');
    if (departments.length === 0) {
      console.log('❌ CRITICAL: No departments exist in the database.');
      console.log('   Solution: Run the seed script to create departments.');
      console.log('   Command: npx prisma db seed');
    } else if (usersWithDept === 0) {
      console.log('⚠️ WARNING: Departments exist but no users are assigned to them.');
      console.log('   Solution: Update users to assign them to departments.');
    } else {
      console.log('✅ Basic data structure looks correct.');
      console.log('   The issue might be with session/authentication or access control.');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
    console.error('\nError details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

debugDepartmentDashboard();