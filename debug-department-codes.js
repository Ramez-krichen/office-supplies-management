const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDepartmentCodes() {
  console.log('🔍 Department Code Analysis...\n');
  
  try {
    // 1. Check departments table
    console.log('1. Checking departments table...');
    const departments = await prisma.department.findMany({
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
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 Found ${departments.length} departments in departments table:`);
    if (departments.length === 0) {
      console.log('❌ NO DEPARTMENTS FOUND! This is the root cause.');
    } else {
      departments.forEach((dept, i) => {
        console.log(`   ${i + 1}. ${dept.name} (${dept.code}) - ID: ${dept.id} - Users: ${dept._count.users} - Status: ${dept.status}`);
      });
    }
    console.log();
    
    // 2. Check users and their department assignments
    console.log('2. Checking user department assignments...');
    const userDepartmentData = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentId: true,
        role: true
      },
      where: {
        OR: [
          { department: { not: null } },
          { departmentId: { not: null } }
        ]
      },
      orderBy: { department: 'asc' }
    });
    
    console.log(`📊 Found ${userDepartmentData.length} users with department assignments:`);
    
    // Group by department
    const groupedByDept = {};
    userDepartmentData.forEach(user => {
      const deptName = user.department || 'No Department Name';
      if (!groupedByDept[deptName]) {
        groupedByDept[deptName] = [];
      }
      groupedByDept[deptName].push(user);
    });
    
    Object.keys(groupedByDept).sort().forEach(deptName => {
      const users = groupedByDept[deptName];
      console.log(`   📁 ${deptName}: ${users.length} users`);
      users.forEach(user => {
        console.log(`      - ${user.name} (${user.role}) - DeptID: ${user.departmentId || 'NULL'}`);
      });
    });
    console.log();
    
    // 3. Check for mismatch between department names and IDs
    console.log('3. Checking for department ID/name mismatches...');
    const usersWithDeptIdButNoMatch = [];
    
    for (const user of userDepartmentData) {
      if (user.departmentId) {
        const dept = departments.find(d => d.id === user.departmentId);
        if (!dept) {
          usersWithDeptIdButNoMatch.push({
            user: user.name,
            departmentId: user.departmentId,
            departmentName: user.department
          });
        } else if (dept.name !== user.department) {
          console.log(`   ⚠️ MISMATCH: ${user.name} has departmentId pointing to "${dept.name}" but department field says "${user.department}"`);
        }
      }
    }
    
    if (usersWithDeptIdButNoMatch.length > 0) {
      console.log('   ❌ Users with invalid departmentId references:');
      usersWithDeptIdButNoMatch.forEach(item => {
        console.log(`      - ${item.user}: departmentId "${item.departmentId}" (dept name: "${item.departmentName}")`);
      });
    }
    
    // 4. Identify the core issue
    console.log('\n🎯 DIAGNOSIS:');
    if (departments.length === 0) {
      console.log('❌ ROOT CAUSE: No departments exist in the departments table!');
      console.log('   The system is trying to reference department codes/IDs that don\'t exist.');
      console.log('   Solution: Run department seeding script or create departments manually.');
    } else {
      console.log('✅ Departments table has data');
      if (usersWithDeptIdButNoMatch.length > 0) {
        console.log('❌ Some users have invalid departmentId references');
        console.log('   Solution: Fix user department assignments');
      }
    }
    
    // 5. Show expected vs actual department codes
    console.log('\n📋 Expected department codes vs what we have:');
    const expectedDepts = ['IT', 'HR', 'FINANCE', 'OPS', 'MKT', 'SALES', 'LEGAL', 'PROC'];
    const actualCodes = departments.map(d => d.code);
    
    console.log('   Expected:', expectedDepts.join(', '));
    console.log('   Actual:  ', actualCodes.join(', '));
    
    const missing = expectedDepts.filter(code => !actualCodes.includes(code));
    const extra = actualCodes.filter(code => !expectedDepts.includes(code));
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing: ${missing.join(', ')}`);
    }
    if (extra.length > 0) {
      console.log(`   ⚠️ Extra: ${extra.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDepartmentCodes();