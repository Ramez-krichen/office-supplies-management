import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugDepartmentSpending() {
  try {
    console.log('🔍 Debugging department spending...\n')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    console.log(`📅 Current month start: ${currentMonth.toISOString()}\n`)

    // Check HR department specifically
    console.log('🏢 HR DEPARTMENT ANALYSIS:')
    
    // 1. HR Requests this month
    const hrRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth },
        requester: { department: 'HR' }
      },
      include: {
        requester: { select: { name: true, department: true } },
        items: { include: { item: true } }
      }
    })

    let hrRequestSpending = 0
    hrRequests.forEach(request => {
      const requestTotal = request.items.reduce((total, item) => {
        return total + (item.totalPrice || (item.item.price * item.quantity))
      }, 0)
      hrRequestSpending += requestTotal
      console.log(`   - Request ${request.id}: $${requestTotal.toFixed(2)} by ${request.requester?.name}`)
    })

    console.log(`   Total HR requests spending: $${hrRequestSpending.toFixed(2)}`)

    // 2. HR Purchase Orders this month
    const hrPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth },
        createdBy: { department: 'HR' }
      },
      include: {
        createdBy: { select: { name: true, department: true } }
      }
    })

    let hrPOSpending = 0
    hrPurchaseOrders.forEach(po => {
      hrPOSpending += po.totalAmount
      console.log(`   - PO ${po.id}: $${po.totalAmount.toFixed(2)} by ${po.createdBy?.name}`)
    })

    console.log(`   Total HR purchase orders spending: $${hrPOSpending.toFixed(2)}`)
    console.log(`   Combined HR spending: $${(hrRequestSpending + hrPOSpending).toFixed(2)}`)

    // 3. Check what the old department dashboard would show (30 days ago)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const hrOldSpending = await prisma.request.aggregate({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: lastMonth },
        requester: { department: 'HR' }
      },
      _sum: { totalAmount: true }
    })

    console.log(`   Old calculation (30 days ago): $${(hrOldSpending._sum.totalAmount || 0).toFixed(2)}`)

    // 4. Check all departments with purchase orders this month
    console.log('\n📊 ALL DEPARTMENTS WITH PURCHASE ORDERS THIS MONTH:')
    const allPOs = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth }
      },
      include: {
        createdBy: { select: { name: true, department: true } }
      }
    })

    const departmentPOSpending: Record<string, number> = {}
    allPOs.forEach(po => {
      const dept = po.createdBy?.department || 'Unknown'
      departmentPOSpending[dept] = (departmentPOSpending[dept] || 0) + po.totalAmount
    })

    Object.entries(departmentPOSpending).forEach(([dept, amount]) => {
      console.log(`   - ${dept}: $${amount.toFixed(2)}`)
    })

    // 5. Check all departments with requests this month
    console.log('\n📊 ALL DEPARTMENTS WITH REQUESTS THIS MONTH:')
    const allRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth }
      },
      include: {
        requester: { select: { department: true } },
        items: { include: { item: true } }
      }
    })

    const departmentRequestSpending: Record<string, number> = {}
    allRequests.forEach(request => {
      const dept = request.requester?.department || 'Unknown'
      const requestTotal = request.items.reduce((total, item) => {
        return total + (item.totalPrice || (item.item.price * item.quantity))
      }, 0)
      departmentRequestSpending[dept] = (departmentRequestSpending[dept] || 0) + requestTotal
    })

    Object.entries(departmentRequestSpending).forEach(([dept, amount]) => {
      console.log(`   - ${dept}: $${amount.toFixed(2)}`)
    })

    // 6. Combined department spending
    console.log('\n💰 COMBINED DEPARTMENT SPENDING THIS MONTH:')
    const allDepartments = new Set([
      ...Object.keys(departmentPOSpending),
      ...Object.keys(departmentRequestSpending)
    ])

    allDepartments.forEach(dept => {
      const requestSpending = departmentRequestSpending[dept] || 0
      const poSpending = departmentPOSpending[dept] || 0
      const total = requestSpending + poSpending
      console.log(`   - ${dept}: $${total.toFixed(2)} (Requests: $${requestSpending.toFixed(2)}, POs: $${poSpending.toFixed(2)})`)
    })

  } catch (error) {
    console.error('❌ Error during debugging:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugDepartmentSpending()
