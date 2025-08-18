const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking database...');

    // Check departments
    const departments = await prisma.department.findMany();
    console.log(`Departments found: ${departments.length}`);
    departments.forEach(dept => {
      console.log(`- ${dept.name} (${dept.code})`);
    });

    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, name: true, department: true, departmentId: true, role: true }
    });
    console.log(`\nUsers found: ${users.length}`);
    users.slice(0, 5).forEach(user => {
      console.log(`- ${user.name} (${user.role}) - Dept: ${user.department || 'None'} - DeptId: ${user.departmentId || 'None'}`);
    });

    // Check requests with department info
    const requests = await prisma.request.findMany({
      take: 5,
      include: {
        requester: {
          select: {
            name: true,
            department: true,
            departmentId: true,
            departmentRef: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      }
    });
    console.log(`\nRequests found: ${requests.length}`);
    requests.forEach(req => {
      console.log(`- Request ${req.id} by ${req.requester?.name} - Old Dept: ${req.requester?.department || 'None'} - New Dept: ${req.requester?.departmentRef?.name || 'None'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
