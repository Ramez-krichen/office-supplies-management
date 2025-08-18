import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function updateDepartments() {
  try {
    console.log('🔄 Updating Department Data...\n')

    // 1. Update departments with budgets
    console.log('💰 Updating department budgets...')
    const departmentUpdates = [
      { code: 'IT', budget: 500000 },
      { code: 'HR', budget: 200000 },
      { code: 'FINANCE', budget: 300000 },
      { code: 'OPS', budget: 400000 },
      { code: 'MKT', budget: 250000 },
      { code: 'SALES', budget: 350000 },
      { code: 'LEGAL', budget: 150000 },
      { code: 'PROC', budget: 180000 }
    ]

    for (const update of departmentUpdates) {
      await prisma.department.update({
        where: { code: update.code },
        data: { budget: update.budget }
      })
      console.log(`   ✅ Updated ${update.code} budget: $${update.budget.toLocaleString()}`)
    }

    // 2. Get all departments
    const departments = await prisma.department.findMany()

    // 3. Create admin user if not exists
    console.log('\n👤 Checking admin user...')
    let adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })

    if (!adminUser) {
      const adminPassword = await bcrypt.hash('admin123', 12)
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Main Admin',
          password: adminPassword,
          role: 'ADMIN',
          department: 'Information Technology',
          departmentId: departments.find(d => d.code === 'IT')?.id,
          status: 'ACTIVE'
        }
      })
      console.log(`   ✅ Created admin: ${adminUser.email}`)
    } else {
      console.log(`   ✅ Admin exists: ${adminUser.email}`)
    }

    // 4. Create department managers
    console.log('\n👥 Creating department managers...')
    const managerData = [
      { dept: 'IT', name: 'John Smith', email: 'john.smith@company.com' },
      { dept: 'HR', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
      { dept: 'FINANCE', name: 'Michael Brown', email: 'michael.brown@company.com' },
      { dept: 'OPS', name: 'Emily Davis', email: 'emily.davis@company.com' },
      { dept: 'MKT', name: 'David Wilson', email: 'david.wilson@company.com' },
      { dept: 'SALES', name: 'Lisa Anderson', email: 'lisa.anderson@company.com' },
      { dept: 'LEGAL', name: 'Robert Taylor', email: 'robert.taylor@company.com' },
      { dept: 'PROC', name: 'Jennifer White', email: 'jennifer.white@company.com' }
    ]

    const managers = []
    for (const mgr of managerData) {
      const department = departments.find(d => d.code === mgr.dept)
      if (department) {
        // Check if manager already exists
        let manager = await prisma.user.findUnique({
          where: { email: mgr.email }
        })

        if (!manager) {
          manager = await prisma.user.create({
            data: {
              email: mgr.email,
              name: mgr.name,
              password: await bcrypt.hash('manager123', 12),
              role: 'MANAGER',
              department: department.name,
              departmentId: department.id,
              status: 'ACTIVE'
            }
          })
          console.log(`   ✅ Created manager: ${mgr.name} for ${department.name}`)
        } else {
          // Update existing user to be manager
          manager = await prisma.user.update({
            where: { id: manager.id },
            data: {
              role: 'MANAGER',
              department: department.name,
              departmentId: department.id,
              status: 'ACTIVE'
            }
          })
          console.log(`   ✅ Updated manager: ${mgr.name} for ${department.name}`)
        }
        
        managers.push(manager)
        
        // Update department with manager
        await prisma.department.update({
          where: { id: department.id },
          data: { managerId: manager.id }
        })
      }
    }

    // 5. Create employees for each department
    console.log('\n👨‍💼 Creating employees...')
    const employeeCount = 3 // 3 employees per department
    
    for (const dept of departments) {
      for (let i = 1; i <= employeeCount; i++) {
        const email = `employee.${dept.code.toLowerCase()}.${i}@company.com`
        
        // Check if employee already exists
        let employee = await prisma.user.findUnique({
          where: { email }
        })

        if (!employee) {
          await prisma.user.create({
            data: {
              email,
              name: `Employee ${dept.code} ${i}`,
              password: await bcrypt.hash('employee123', 12),
              role: 'EMPLOYEE',
              department: dept.name,
              departmentId: dept.id,
              status: 'ACTIVE'
            }
          })
        }
      }
      console.log(`   ✅ Ensured ${employeeCount} employees for ${dept.name}`)
    }

    // 6. Summary
    console.log('\n📊 Update Summary:')
    const finalDepartments = await prisma.department.findMany({
      include: {
        manager: true,
        _count: { select: { users: true } }
      }
    })

    for (const dept of finalDepartments) {
      console.log(`   📊 ${dept.name} (${dept.code}):`)
      console.log(`      Budget: $${dept.budget?.toLocaleString() || 'N/A'}`)
      console.log(`      Manager: ${dept.manager?.name || 'Not assigned'}`)
      console.log(`      Users: ${dept._count.users}`)
    }

    console.log('\n🎉 Department update completed successfully!')

  } catch (error) {
    console.error('❌ Error during update:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateDepartments()
