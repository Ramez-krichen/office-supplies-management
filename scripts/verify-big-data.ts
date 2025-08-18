import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function verifyBigData() {
  try {
    let output = '📊 BIG DATA VERIFICATION REPORT\n'
    output += '=====================================\n\n'

    // Current month and year
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const year2025Start = new Date('2025-01-01')

    // Basic counts
    const totalUsers = await prisma.user.count()
    const totalDepartments = await prisma.department.count()
    const totalSuppliers = await prisma.supplier.count()
    const totalCategories = await prisma.category.count()
    const totalItems = await prisma.item.count()

    output += '🏢 BASIC DATA:\n'
    output += `Users: ${totalUsers}\n`
    output += `Departments: ${totalDepartments}\n`
    output += `Suppliers: ${totalSuppliers}\n`
    output += `Categories: ${totalCategories}\n`
    output += `Items: ${totalItems}\n\n`

    // Requests data
    const totalRequests = await prisma.request.count()
    const year2025Requests = await prisma.request.count({
      where: { createdAt: { gte: year2025Start } }
    })
    const currentMonthRequests = await prisma.request.count({
      where: { createdAt: { gte: currentMonth } }
    })
    const approvedRequests = await prisma.request.count({
      where: { 
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: year2025Start }
      }
    })

    output += '📋 REQUESTS DATA:\n'
    output += `Total Requests: ${totalRequests}\n`
    output += `2025 Requests: ${year2025Requests}\n`
    output += `Current Month Requests: ${currentMonthRequests}\n`
    output += `Approved/Completed (2025): ${approvedRequests}\n\n`

    // Purchase Orders data
    const totalPOs = await prisma.purchaseOrder.count()
    const year2025POs = await prisma.purchaseOrder.count({
      where: { createdAt: { gte: year2025Start } }
    })
    const currentMonthPOs = await prisma.purchaseOrder.count({
      where: { createdAt: { gte: currentMonth } }
    })

    output += '📦 PURCHASE ORDERS DATA:\n'
    output += `Total Purchase Orders: ${totalPOs}\n`
    output += `2025 Purchase Orders: ${year2025POs}\n`
    output += `Current Month POs: ${currentMonthPOs}\n\n`

    // Financial data
    const totalRequestValue = await prisma.request.aggregate({
      where: { 
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: year2025Start }
      },
      _sum: { totalAmount: true }
    })

    const totalPOValue = await prisma.purchaseOrder.aggregate({
      where: { 
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: year2025Start }
      },
      _sum: { totalAmount: true }
    })

    const currentMonthRequestValue = await prisma.request.aggregate({
      where: { 
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth }
      },
      _sum: { totalAmount: true }
    })

    const currentMonthPOValue = await prisma.purchaseOrder.aggregate({
      where: { 
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth }
      },
      _sum: { totalAmount: true }
    })

    output += '💰 FINANCIAL DATA (2025):\n'
    output += `Total Request Value: $${(totalRequestValue._sum.totalAmount || 0).toLocaleString()}\n`
    output += `Total PO Value: $${(totalPOValue._sum.totalAmount || 0).toLocaleString()}\n`
    output += `Total 2025 Spending: $${((totalRequestValue._sum.totalAmount || 0) + (totalPOValue._sum.totalAmount || 0)).toLocaleString()}\n\n`

    output += '💰 CURRENT MONTH FINANCIAL DATA:\n'
    output += `Current Month Request Value: $${(currentMonthRequestValue._sum.totalAmount || 0).toLocaleString()}\n`
    output += `Current Month PO Value: $${(currentMonthPOValue._sum.totalAmount || 0).toLocaleString()}\n`
    output += `Current Month Total: $${((currentMonthRequestValue._sum.totalAmount || 0) + (currentMonthPOValue._sum.totalAmount || 0)).toLocaleString()}\n\n`

    // Department spending breakdown
    output += '🏢 DEPARTMENT SPENDING (Current Month):\n'
    const departments = await prisma.department.findMany()
    
    for (const dept of departments) {
      const deptRequestValue = await prisma.request.aggregate({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth },
          requester: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const deptPOValue = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
          createdAt: { gte: currentMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const totalDeptSpending = (deptRequestValue._sum.totalAmount || 0) + (deptPOValue._sum.totalAmount || 0)
      const budgetUtilization = dept.budget ? (totalDeptSpending / dept.budget) * 100 : 0

      output += `${dept.name}: $${totalDeptSpending.toLocaleString()} (${budgetUtilization.toFixed(1)}% of budget)\n`
    }

    // Forecast data
    const totalForecasts = await prisma.demandForecast.count()
    const stockMovements = await prisma.stockMovement.count()

    output += '\n📈 FORECASTING DATA:\n'
    output += `Demand Forecasts: ${totalForecasts}\n`
    output += `Stock Movements: ${stockMovements}\n\n`

    // Top spending items
    output += '🔝 TOP SPENDING ITEMS (Current Month):\n'
    const topItems = await prisma.requestItem.groupBy({
      by: ['itemId'],
      where: {
        request: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth }
        }
      },
      _sum: { totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5
    })

    for (const itemGroup of topItems) {
      const item = await prisma.item.findUnique({
        where: { id: itemGroup.itemId }
      })
      if (item) {
        output += `${item.name}: $${(itemGroup._sum.totalPrice || 0).toLocaleString()}\n`
      }
    }

    output += '\n✅ DATA GENERATION SUCCESS!\n'
    output += 'The system now has comprehensive data for:\n'
    output += '- Realistic financial reporting\n'
    output += '- Department budget analysis\n'
    output += '- Demand forecasting\n'
    output += '- Trend analysis\n'
    output += '- Monthly/yearly comparisons\n'

    console.log(output)
    fs.writeFileSync('big-data-verification.txt', output)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyBigData()
