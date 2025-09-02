const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== OLD SYSTEM (User.department) ===');
    const oldDepts = await prisma.user.findMany({
      where: { department: { not: null } },
      select: { department: true }
    });
    const uniqueOld = [...new Set(oldDepts.map(u => u.department))];
    console.log('Unique departments from User.department:', uniqueOld);
    console.log('Count:', uniqueOld.length);
    
    console.log('\n=== NEW SYSTEM (Department table) ===');
    const newDepts = await prisma.department.findMany({
      select: { id: true, code: true, name: true, budget: true }
    });
    console.log('Departments in Department table:');
    newDepts.forEach(d => console.log(`- ${d.code}: ${d.name} (Budget: ${d.budget || 'No budget'})`));
    console.log('Count:', newDepts.length);
    
    console.log('\n=== USERS WITH departmentId ===');
    const usersWithDeptId = await prisma.user.count({
      where: { departmentId: { not: null } }
    });
    console.log('Users with departmentId:', usersWithDeptId);
    
    console.log('\n=== SAMPLE BUDGET USAGE DATA ===');
    const sampleDept = newDepts[0];
    if (sampleDept) {
      console.log(`Checking budget usage for ${sampleDept.name} (Budget: ${sampleDept.budget})`);
      
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const monthlyRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          requester: { departmentId: sampleDept.id }
        },
        include: {
          items: { include: { item: true } }
        }
      });
      
      const spending = monthlyRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0);
      
      const utilization = sampleDept.budget ? (spending / sampleDept.budget) * 100 : 0;
      console.log(`Monthly spending: $${spending.toFixed(2)}`);
      console.log(`Budget utilization: ${utilization.toFixed(1)}%`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();