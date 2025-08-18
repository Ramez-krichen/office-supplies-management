import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Add process type definition
declare var process: {
  exit: (code: number) => never;
};

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with demo users...')

  // Clear existing users
  await prisma.user.deleteMany()

  // Create single admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Main Admin',
      password: adminPassword,
      role: 'ADMIN',
      department: 'IT',
    },
  })

  // Create manager users
  const managerPassword = await bcrypt.hash('manager123', 12)
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'Mike Manager',
      password: managerPassword,
      role: 'MANAGER',
      department: 'Operations',
    },
  })

  // Create employee users
  const employeePassword = await bcrypt.hash('employee123', 12)
  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@example.com',
      name: 'Alice Employee',
      password: employeePassword,
      role: 'EMPLOYEE',
      department: 'Marketing',
    },
  })

  console.log('✅ Demo users created successfully!')
  console.log('Demo users created:')
  console.log('- Admin: admin@example.com / admin123')
  console.log('- Manager: manager@example.com / manager123')
  console.log('- Employee: employee@example.com / employee123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })