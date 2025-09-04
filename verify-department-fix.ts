import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDepartmentFix() {
  console.log('🔍 Verifying Department Fix...\n');
  
  try {
    // Check departments
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });
    
    console.log(`📊 Departments (${departments.length}):`);
    departments.forEach(dept => {
      console.log(`   ${dept.code}: ${dept.name} (${dept._count.users} users)`);
    });
    
    // Check users
    const totalUsers = await prisma.user.count();
    const usersWithDept = await prisma.user.count({
      where: { departmentId: { not: null } }
    });
    
    console.log(`\n👥 Users: ${usersWithDept}/${totalUsers} have department assignments`);
    
    // Check if codes are proper
    const properCodes = ['IT', 'HR', 'FINANCE', 'OPS', 'MKT', 'SALES', 'LEGAL', 'PROC', 'EXE'];
    const actualCodes = departments.map(d => d.code);
    const hasProperCodes = properCodes.every(code => actualCodes.includes(code));
    
    console.log(`\n✅ Department codes are ${hasProperCodes ? 'FIXED' : 'STILL BROKEN'}`);
    
    if (!hasProperCodes) {
      console.log('Missing codes:', properCodes.filter(code => !actualCodes.includes(code)));
      console.log('Unexpected codes:', actualCodes.filter(code => !properCodes.includes(code)));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDepartmentFix();