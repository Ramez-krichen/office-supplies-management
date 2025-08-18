import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugSpendingDiscrepancy() {
  try {
    console.log('🔍 Debugging spending discrepancy...\n')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    console.log(`📅 Current month start: ${currentMonth.toISOString()}`)
    console.log(`📅 Last month: ${lastMonth.toISOString()}\n`)

    // 1. Check requests spending this month
    console.log('📊 REQUESTS SPENDING THIS MONTH:')
    const currentMonthRequests = await prisma.request.findMany({
      where: {
        createdAt: { gte: currentMonth },
        status: 'APPROVED'
      },
      include: {
        requester: { select: { department: true } },
        items: { include: { item: true } }
      }
    })

    let totalRequestSpending = 0
    const departmentSpending: Record<string, number> = {}

    currentMonthRequests.forEach(request => {
      const dept = request.requester?.department || 'Unknown'
      const requestTotal = request.items.reduce((total, item) => {
        return total + (item.totalPrice || (item.item.price * item.quantity))
      }, 0)
      
      totalRequestSpending += requestTotal
      departmentSpending[dept] = (departmentSpending[dept] || 0) + requestTotal
      
      console.log(`   - Request ${request.id}: $${requestTotal.toFixed(2)} (${dept})`)
    })

    console.log(`\n   Total from requests: $${totalRequestSpending.toFixed(2)}`)
    console.log('\n   By department:')
    Object.entries(departmentSpending).forEach(([dept, amount]) => {
      console.log(`     - ${dept}: $${amount.toFixed(2)}`)
    })

    // 2. Check purchase orders spending this month
    console.log('\n📊 PURCHASE ORDERS SPENDING THIS MONTH:')
    const currentMonthPOs = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: currentMonth },
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
      }
    })

    let totalPOSpending = 0
    currentMonthPOs.forEach(po => {
      totalPOSpending += po.totalAmount
      console.log(`   - PO ${po.id}: $${po.totalAmount.toFixed(2)} (Status: ${po.status})`)
    })

    console.log(`\n   Total from purchase orders: $${totalPOSpending.toFixed(2)}`)

    // 3. Total combined spending
    const combinedSpending = totalRequestSpending + totalPOSpending
    console.log(`\n💰 TOTAL COMBINED SPENDING: $${combinedSpending.toFixed(2)}`)

    // 4. Check what the analytics API would return
    console.log('\n🔍 ANALYTICS API CALCULATION:')
    console.log(`   - Requests: $${totalRequestSpending.toFixed(2)}`)
    console.log(`   - Purchase Orders: $${totalPOSpending.toFixed(2)}`)
    console.log(`   - Combined: $${combinedSpending.toFixed(2)}`)

    // 5. Check department dashboard calculation for HR
    console.log('\n🏢 HR DEPARTMENT SPECIFIC CHECK:')
    const hrSpending = await prisma.request.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: lastMonth },
        requester: { department: 'HR' }
      },
      _sum: { totalAmount: true }
    })

    console.log(`   - HR spending (department dashboard): $${(hrSpending._sum.totalAmount || 0).toFixed(2)}`)
    console.log(`   - HR spending (from requests above): $${(departmentSpending['HR'] || 0).toFixed(2)}`)

    // 6. Check if there are old requests being counted
    console.log('\n📅 CHECKING DATE RANGES:')
    const oldRequests = await prisma.request.count({
      where: {
        status: 'APPROVED',
        createdAt: { lt: currentMonth }
      }
    })
    console.log(`   - Approved requests before current month: ${oldRequests}`)

    const thisMonthRequests = await prisma.request.count({
      where: {
        status: 'APPROVED',
        createdAt: { gte: currentMonth }
      }
    })
    console.log(`   - Approved requests this month: ${thisMonthRequests}`)

  } catch (error) {
    console.error('❌ Error during debugging:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSpendingDiscrepancy()
