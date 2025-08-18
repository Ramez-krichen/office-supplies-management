import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function verifyDecemberSpending() {
  try {
    let output = '💰 DECEMBER 2025 SPENDING VERIFICATION\n'
    output += '=====================================\n\n'

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    output += `Verification Period: ${currentMonth.toLocaleDateString()} to ${new Date(nextMonth.getTime() - 1).toLocaleDateString()}\n\n`

    // Get all departments
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    })

    output += '🏢 DEPARTMENT SPENDING BREAKDOWN:\n'
    output += '================================\n\n'

    let totalSystemSpending = 0
    let departmentsMeetingTarget = 0
    const targetSpending = 3000

    for (const dept of departments) {
      // Calculate request spending
      const deptRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          requester: { departmentId: dept.id }
        },
        include: {
          items: { include: { item: true } }
        }
      })

      const requestSpending = deptRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0)

      // Calculate PO spending
      const deptPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const poSpending = deptPOs._sum.totalAmount || 0
      const totalSpending = requestSpending + poSpending
      const budgetUtilization = dept.budget ? (totalSpending / dept.budget) * 100 : 0
      const meetsTarget = totalSpending >= targetSpending

      if (meetsTarget) departmentsMeetingTarget++
      totalSystemSpending += totalSpending

      const status = meetsTarget ? '✅' : '❌'
      
      output += `${status} ${dept.name} (${dept.code}):\n`
      output += `   Total Spending: $${totalSpending.toLocaleString()}\n`
      output += `   Request Spending: $${requestSpending.toLocaleString()}\n`
      output += `   PO Spending: $${poSpending.toLocaleString()}\n`
      output += `   Budget: $${dept.budget?.toLocaleString() || 'N/A'}\n`
      output += `   Budget Utilization: ${budgetUtilization.toFixed(1)}%\n`
      output += `   Requests Count: ${deptRequests.length}\n`
      output += `   Target Met: ${meetsTarget ? 'YES' : 'NO'}\n\n`
    }

    // Summary statistics
    output += '📊 SUMMARY STATISTICS:\n'
    output += '=====================\n\n'
    output += `Total Departments: ${departments.length}\n`
    output += `Departments Meeting $3,000 Target: ${departmentsMeetingTarget}\n`
    output += `Departments Below Target: ${departments.length - departmentsMeetingTarget}\n`
    output += `Success Rate: ${((departmentsMeetingTarget / departments.length) * 100).toFixed(1)}%\n`
    output += `Total System Spending (December): $${totalSystemSpending.toLocaleString()}\n`
    output += `Average Department Spending: $${(totalSystemSpending / departments.length).toLocaleString()}\n\n`

    // Monthly breakdown for the year
    output += '📅 MONTHLY SPENDING OVERVIEW (2025):\n'
    output += '===================================\n\n'

    for (let month = 0; month <= now.getMonth(); month++) {
      const monthStart = new Date(now.getFullYear(), month, 1)
      const monthEnd = new Date(now.getFullYear(), month + 1, 1)
      const monthName = monthStart.toLocaleString('default', { month: 'long' })

      const monthlyRequests = await prisma.request.aggregate({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: monthStart, lt: monthEnd }
        },
        _sum: { totalAmount: true }
      })

      const monthlyPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: monthStart, lt: monthEnd }
        },
        _sum: { totalAmount: true }
      })

      const monthlyTotal = (monthlyRequests._sum.totalAmount || 0) + (monthlyPOs._sum.totalAmount || 0)
      
      output += `${monthName}: $${monthlyTotal.toLocaleString()}\n`
    }

    // Top spending items this month
    output += '\n🔝 TOP SPENDING ITEMS (December 2025):\n'
    output += '====================================\n\n'

    const topItems = await prisma.requestItem.groupBy({
      by: ['itemId'],
      where: {
        request: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth, lt: nextMonth }
        }
      },
      _sum: { totalPrice: true },
      _count: { itemId: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 10
    })

    for (const itemGroup of topItems) {
      const item = await prisma.item.findUnique({
        where: { id: itemGroup.itemId }
      })
      if (item) {
        output += `${item.name}: $${(itemGroup._sum.totalPrice || 0).toLocaleString()} (${itemGroup._count.itemId} orders)\n`
      }
    }

    if (departmentsMeetingTarget === departments.length) {
      output += '\n🎉 SUCCESS! All departments meet the $3,000 minimum spending requirement!\n'
    } else {
      output += `\n⚠️ ${departments.length - departmentsMeetingTarget} departments still below $3,000 target.\n`
    }

    console.log(output)
    fs.writeFileSync('december-spending-verification.txt', output)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDecemberSpending()
