import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function verifySpending() {
  try {
    let output = '💰 Spending Verification Report\n\n'

    // Check current month
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Count requests
    const totalRequests = await prisma.request.count()
    const currentMonthRequests = await prisma.request.count({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth }
      }
    })

    // Count purchase orders
    const totalPOs = await prisma.purchaseOrder.count()
    const currentMonthPOs = await prisma.purchaseOrder.count({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth }
      }
    })

    // Count items and suppliers
    const items = await prisma.item.count()
    const suppliers = await prisma.supplier.count()

    output += `Total Requests: ${totalRequests}\n`
    output += `Current Month Approved Requests: ${currentMonthRequests}\n`
    output += `Total Purchase Orders: ${totalPOs}\n`
    output += `Current Month Active POs: ${currentMonthPOs}\n`
    output += `Items: ${items}\n`
    output += `Suppliers: ${suppliers}\n\n`

    // Calculate spending by department
    const departments = await prisma.department.findMany()
    
    output += 'Department Spending (Current Month):\n'
    for (const dept of departments) {
      // Get requests for this department
      const deptRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
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

      // Get POs for this department
      const deptPOs = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const poSpending = deptPOs._sum.totalAmount || 0
      const totalSpending = requestSpending + poSpending

      output += `${dept.name}: $${totalSpending.toFixed(2)} (Requests: $${requestSpending.toFixed(2)}, POs: $${poSpending.toFixed(2)})\n`
    }

    console.log(output)
    fs.writeFileSync('spending-verification.txt', output)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifySpending()
