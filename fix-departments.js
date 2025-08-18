const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDepartments() {
  console.log('=== Fixing Department Data ===\n');
  
  try {
    // 1. Get all unique department names from users
    console.log('1. Collecting department names from users...');
    const users = await prisma.user.findMany({
      where: {
        department: { not: null }
      },
      select: {
        department: true
      }
    });
    
    const uniqueDepartments = [...new Set(users.map(u => u.department).filter(d => d))];
    console.log(`Found ${uniqueDepartments.length} unique department names:`, uniqueDepartments);
    
    // 2. Create department records
    console.log('\n2. Creating department records...');
    const departmentMap = new Map();
    
    for (const deptName of uniqueDepartments) {
      // Generate a code from the department name
      const code = deptName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10) || 'DEPT';
      
      try {
        const department = await prisma.department.create({
          data: {
            name: deptName,
            code: code,
            description: `${deptName} Department`,
            budget: 50000, // Default budget
            status: 'ACTIVE'
          }
        });
        
        departmentMap.set(deptName, department.id);
        console.log(`✅ Created department: ${deptName} (${code})`);
      } catch (error) {
        // Check if department already exists
        const existing = await prisma.department.findFirst({
          where: {
            OR: [
              { name: deptName },
              { code: code }
            ]
          }
        });
        
        if (existing) {
          departmentMap.set(deptName, existing.id);
          console.log(`ℹ️ Department already exists: ${deptName}`);
        } else {
          console.error(`❌ Failed to create department ${deptName}:`, error.message);
        }
      }
    }
    
    // 3. Update users with departmentId
    console.log('\n3. Updating users with department IDs...');
    const usersToUpdate = await prisma.user.findMany({
      where: {
        department: { not: null },
        departmentId: null
      }
    });
    
    let updateCount = 0;
    for (const user of usersToUpdate) {
      const deptId = departmentMap.get(user.department);
      if (deptId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { departmentId: deptId }
        });
        updateCount++;
        console.log(`✅ Updated user ${user.name} -> ${user.department}`);
      }
    }
    
    console.log(`\nUpdated ${updateCount} users with department IDs`);
    
    // 4. Verify the fix
    console.log('\n4. Verifying the fix...');
    const departmentCount = await prisma.department.count();
    const usersWithDeptId = await prisma.user.count({
      where: { departmentId: { not: null } }
    });
    
    console.log(`✅ Total departments: ${departmentCount}`);
    console.log(`✅ Users with department ID: ${usersWithDeptId}`);
    
    // 5. Show department statistics
    console.log('\n5. Department Statistics:');
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    
    for (const dept of departments) {
      console.log(`   ${dept.name} (${dept.code}): ${dept._count.users} users`);
    }
    
    // 6. Calculate and update spending for each department
    console.log('\n6. Calculating department spending...');
    for (const dept of departments) {
      // Calculate spending from requests
      const requests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          requester: { departmentId: dept.id }
        },
        include: {
          items: {
            include: {
              item: true
            }
          }
        }
      });
      
      const requestSpending = requests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity));
        }, 0);
      }, 0);
      
      // Calculate spending from purchase orders
      const poSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      });
      
      const totalSpending = requestSpending + (poSpending._sum.totalAmount || 0);
      
      console.log(`   ${dept.name}: $${totalSpending.toFixed(2)} spent (Budget: $${dept.budget || 0})`);
    }
    
    console.log('\n✅ Department data has been fixed successfully!');
    console.log('The department dashboard should now work correctly.');
    
  } catch (error) {
    console.error('❌ Error fixing departments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDepartments();