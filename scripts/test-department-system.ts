import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDepartmentSystem() {
  try {
    console.log('🧪 Testing Department Management System...\n')

    // 1. Check if departments exist
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        parent: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            status: true
          }
        },
        _count: {
          select: {
            users: true,
            children: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    console.log(`📊 Found ${departments.length} departments:`)
    departments.forEach(dept => {
      console.log(`   - ${dept.name} (${dept.code})`)
      console.log(`     Budget: $${dept.budget?.toLocaleString() || 'Not set'}`)
      console.log(`     Manager: ${dept.manager?.name || 'Not assigned'}`)
      console.log(`     Users: ${dept._count.users}`)
      console.log(`     Sub-departments: ${dept._count.children}`)
      console.log('')
    })

    // 2. Test department hierarchy
    console.log('🏗️ Testing Department Hierarchy...')
    
    // Create a sub-department for IT
    const itDept = departments.find(d => d.code === 'IT')
    if (itDept) {
      try {
        const subDept = await prisma.department.create({
          data: {
            code: 'IT_DEV',
            name: 'Software Development',
            description: 'Software development and engineering team',
            parentId: itDept.id,
            budget: 200000
          }
        })
        console.log(`   ✅ Created sub-department: ${subDept.name} under ${itDept.name}`)
      } catch (error) {
        console.log(`   ℹ️ Sub-department might already exist`)
      }
    }

    // 3. Test budget calculations
    console.log('\n💰 Testing Budget Calculations...')
    
    for (const dept of departments.slice(0, 3)) { // Test first 3 departments
      const now = new Date()
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      // Calculate monthly spending
      const monthlyRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          OR: [
            { requester: { departmentId: dept.id } },
            { requester: { department: dept.name } }
          ]
        },
        include: {
          items: { include: { item: true } }
        }
      })

      const monthlyRequestSpending = monthlyRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0)

      const monthlyPOSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          OR: [
            { createdBy: { departmentId: dept.id } },
            { createdBy: { department: dept.name } }
          ]
        },
        _sum: { totalAmount: true }
      })

      const totalMonthlySpending = monthlyRequestSpending + (monthlyPOSpending._sum.totalAmount || 0)
      const budgetUtilization = dept.budget ? (totalMonthlySpending / dept.budget) * 100 : 0

      console.log(`   ${dept.name}:`)
      console.log(`     Monthly Spending: $${totalMonthlySpending.toFixed(2)}`)
      console.log(`     Budget: $${dept.budget?.toLocaleString() || 'Not set'}`)
      console.log(`     Utilization: ${budgetUtilization.toFixed(2)}%`)
      console.log('')
    }

    // 4. Test manager assignments
    console.log('👥 Testing Manager Assignments...')
    
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        managedDepartments: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    console.log(`   Found ${managers.length} managers:`)
    managers.forEach(manager => {
      console.log(`     - ${manager.name} (${manager.email})`)
      console.log(`       Department: ${manager.department || 'Not assigned'}`)
      console.log(`       Managing: ${manager.managedDepartments.map(d => d.name).join(', ') || 'No departments'}`)
    })

    // 5. Test department user assignments
    console.log('\n👨‍💼 Testing User Assignments...')
    
    const usersWithDeptRef = await prisma.user.count({
      where: { departmentId: { not: null } }
    })
    
    const usersWithDeptString = await prisma.user.count({
      where: { department: { not: null } }
    })

    console.log(`   Users with departmentId: ${usersWithDeptRef}`)
    console.log(`   Users with department string: ${usersWithDeptString}`)

    console.log('\n✅ Department system test completed!')

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDepartmentSystem()
