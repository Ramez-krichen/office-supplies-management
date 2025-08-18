import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDepartmentAPI() {
  try {
    console.log('🧪 Testing Department Dashboard API Logic...\n')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const targetDepartment = 'HR'

    console.log(`📅 Current month start: ${currentMonth.toISOString()}`)
    console.log(`🏢 Target department: ${targetDepartment}\n`)

    // Replicate the exact logic from the department dashboard API
    
    // 1. Monthly Request Spending (using item calculation like analytics)
    const monthlyRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth },
        requester: { department: targetDepartment }
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const monthlyRequestSpending = monthlyRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    console.log(`📊 Monthly Request Spending: $${monthlyRequestSpending.toFixed(2)}`)

    // 2. Monthly Purchase Orders Spending
    const monthlyPOSpending = await prisma.purchaseOrder.aggregate({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth },
        createdBy: { department: targetDepartment }
      },
      _sum: { totalAmount: true }
    })

    console.log(`📊 Monthly PO Spending: $${(monthlyPOSpending._sum.totalAmount || 0).toFixed(2)}`)

    // 3. Combined Monthly Spending (as calculated in the API)
    const combinedMonthlySpending = monthlyRequestSpending + (monthlyPOSpending._sum.totalAmount || 0)
    
    console.log(`💰 Combined Monthly Spending: $${combinedMonthlySpending.toFixed(2)}`)

    // 4. Test the stats array format
    const stats = [
      {
        name: 'Monthly Spending',
        value: `$${combinedMonthlySpending.toFixed(2)}`,
        change: `Includes requests and purchase orders`,
        changeType: 'neutral' as const
      }
    ]

    console.log('\n📋 Department Dashboard Stats Format:')
    stats.forEach(stat => {
      console.log(`   - ${stat.name}: ${stat.value}`)
      console.log(`     ${stat.change}`)
    })

    // 5. Compare with analytics API calculation
    console.log('\n🔍 COMPARISON WITH ANALYTICS:')
    
    // Analytics calculation for all departments
    const allRequestSpending = await prisma.request.findMany({
      where: {
        createdAt: { gte: currentMonth },
        status: 'APPROVED'
      },
      include: {
        items: { include: { item: true } }
      }
    })

    const totalRequestSpending = allRequestSpending.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    const allPOSpending = await prisma.purchaseOrder.aggregate({
      where: {
        createdAt: { gte: currentMonth },
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] }
      },
      _sum: { totalAmount: true }
    })

    const totalCombinedSpending = totalRequestSpending + (allPOSpending._sum.totalAmount || 0)

    console.log(`   Analytics Total: $${totalCombinedSpending.toFixed(2)}`)
    console.log(`   HR Department: $${combinedMonthlySpending.toFixed(2)}`)
    console.log(`   HR Percentage: ${((combinedMonthlySpending / totalCombinedSpending) * 100).toFixed(2)}%`)

    console.log('\n✅ Department API test completed!')

  } catch (error) {
    console.error('❌ Error during API test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDepartmentAPI()
