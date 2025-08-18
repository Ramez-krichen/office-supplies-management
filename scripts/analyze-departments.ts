import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeDepartments() {
  try {
    console.log('🏢 Analyzing Department Structure...\n')

    // 1. Get all unique departments from users
    const userDepartments = await prisma.user.findMany({
      select: { department: true },
      distinct: ['department']
    })

    console.log('📊 DEPARTMENTS FROM USERS:')
    const uniqueUserDepts = userDepartments
      .map(u => u.department)
      .filter(d => d !== null)
      .sort()
    
    uniqueUserDepts.forEach(dept => {
      console.log(`   - ${dept}`)
    })

    // 2. Get all unique departments from requests
    const requestDepartments = await prisma.request.findMany({
      include: {
        requester: { select: { department: true } }
      },
      distinct: ['requesterId']
    })

    const uniqueRequestDepts = [...new Set(
      requestDepartments
        .map(r => r.requester?.department)
        .filter(d => d !== null)
    )].sort()

    console.log('\n📊 DEPARTMENTS FROM REQUESTS:')
    uniqueRequestDepts.forEach(dept => {
      console.log(`   - ${dept}`)
    })

    // 3. Get all unique departments from purchase orders
    const poDepartments = await prisma.purchaseOrder.findMany({
      include: {
        createdBy: { select: { department: true } }
      },
      distinct: ['createdById']
    })

    const uniquePODepts = [...new Set(
      poDepartments
        .map(po => po.createdBy?.department)
        .filter(d => d !== null)
    )].sort()

    console.log('\n📊 DEPARTMENTS FROM PURCHASE ORDERS:')
    uniquePODepts.forEach(dept => {
      console.log(`   - ${dept}`)
    })

    // 4. Check hardcoded departments in frontend
    const hardcodedDepts = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales']
    console.log('\n📊 HARDCODED DEPARTMENTS IN FRONTEND:')
    hardcodedDepts.forEach(dept => {
      console.log(`   - ${dept}`)
    })

    // 5. Find missing departments
    const allActualDepts = [...new Set([...uniqueUserDepts, ...uniqueRequestDepts, ...uniquePODepts])].sort()
    const missingFromFrontend = allActualDepts.filter(dept => !hardcodedDepts.includes(dept))

    console.log('\n❌ DEPARTMENTS MISSING FROM FRONTEND DROPDOWN:')
    if (missingFromFrontend.length > 0) {
      missingFromFrontend.forEach(dept => {
        console.log(`   - ${dept}`)
      })
    } else {
      console.log('   None - all departments are included')
    }

    // 6. Count users per department
    console.log('\n👥 USERS PER DEPARTMENT:')
    for (const dept of allActualDepts) {
      const userCount = await prisma.user.count({
        where: { department: dept }
      })
      console.log(`   - ${dept}: ${userCount} users`)
    }

    // 7. Count requests per department
    console.log('\n📋 REQUESTS PER DEPARTMENT:')
    for (const dept of allActualDepts) {
      const requestCount = await prisma.request.count({
        where: { requester: { department: dept } }
      })
      console.log(`   - ${dept}: ${requestCount} requests`)
    }

    // 8. Count purchase orders per department
    console.log('\n🛒 PURCHASE ORDERS PER DEPARTMENT:')
    for (const dept of allActualDepts) {
      const poCount = await prisma.purchaseOrder.count({
        where: { createdBy: { department: dept } }
      })
      console.log(`   - ${dept}: ${poCount} purchase orders`)
    }

    // 9. Check current month spending per department
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    console.log('\n💰 CURRENT MONTH SPENDING PER DEPARTMENT:')
    for (const dept of allActualDepts) {
      // Requests spending
      const requests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          requester: { department: dept }
        },
        include: {
          items: { include: { item: true } }
        }
      })

      const requestSpending = requests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0)

      // PO spending
      const poSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          createdBy: { department: dept }
        },
        _sum: { totalAmount: true }
      })

      const totalSpending = requestSpending + (poSpending._sum.totalAmount || 0)
      console.log(`   - ${dept}: $${totalSpending.toFixed(2)} (Requests: $${requestSpending.toFixed(2)}, POs: $${(poSpending._sum.totalAmount || 0).toFixed(2)})`)
    }

    console.log('\n✅ Department analysis completed!')

  } catch (error) {
    console.error('❌ Error during analysis:', error)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeDepartments()
