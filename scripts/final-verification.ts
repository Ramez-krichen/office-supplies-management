import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function finalVerification() {
  try {
    console.log('🎯 FINAL VERIFICATION - December 2025 Department Spending\n')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    })

    let allMeetTarget = true
    let totalSpending = 0

    console.log('Department Spending Summary:')
    console.log('===========================')

    for (const dept of departments) {
      const deptRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          requester: { departmentId: dept.id }
        },
        include: { items: true }
      })

      const requestSpending = deptRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, item) => itemTotal + item.totalPrice, 0)
      }, 0)

      const deptPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const poSpending = deptPOs._sum.totalAmount || 0
      const totalDeptSpending = requestSpending + poSpending
      const meetsTarget = totalDeptSpending >= 3000

      if (!meetsTarget) allMeetTarget = false
      totalSpending += totalDeptSpending

      const status = meetsTarget ? '✅' : '❌'
      console.log(`${status} ${dept.name}: $${totalDeptSpending.toLocaleString()} ${meetsTarget ? '(TARGET MET)' : '(BELOW TARGET)'}`)
    }

    console.log('\n📊 FINAL RESULTS:')
    console.log(`Total Departments: ${departments.length}`)
    console.log(`All Departments Meet $3,000 Target: ${allMeetTarget ? 'YES ✅' : 'NO ❌'}`)
    console.log(`Total System Spending (December): $${totalSpending.toLocaleString()}`)
    console.log(`Average Department Spending: $${(totalSpending / departments.length).toLocaleString()}`)

    if (allMeetTarget) {
      console.log('\n🎉 SUCCESS! All departments now spend at least $3,000 in December 2025!')
      console.log('The system has substantial data for forecasting and reporting.')
    } else {
      console.log('\n⚠️ Some departments still below target. Additional adjustments needed.')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalVerification()
