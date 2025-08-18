import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testLegalDepartment() {
  try {
    console.log('🧪 Testing Legal Department Dashboard Access...\n')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const targetDepartment = 'Legal'

    console.log(`🏢 Testing department: ${targetDepartment}`)
    console.log(`📅 Current month: ${currentMonth.toISOString()}\n`)

    // Test the exact logic from department dashboard API
    
    // 1. Department requests
    const departmentRequests = await prisma.request.count({
      where: {
        requester: { department: targetDepartment }
      }
    })

    console.log(`📊 Total requests: ${departmentRequests}`)

    // 2. Department users
    const departmentUsers = await prisma.user.findMany({
      where: { department: targetDepartment },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastSignIn: true
      },
      orderBy: { name: 'asc' }
    })

    console.log(`👥 Department users: ${departmentUsers.length}`)
    departmentUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ${user.status}`)
    })

    // 3. Monthly spending calculation
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

    const monthlyPOSpending = await prisma.purchaseOrder.aggregate({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth },
        createdBy: { department: targetDepartment }
      },
      _sum: { totalAmount: true }
    })

    const totalMonthlySpending = monthlyRequestSpending + (monthlyPOSpending._sum.totalAmount || 0)

    console.log(`\n💰 Monthly spending breakdown:`)
    console.log(`   - Requests: $${monthlyRequestSpending.toFixed(2)}`)
    console.log(`   - Purchase Orders: $${(monthlyPOSpending._sum.totalAmount || 0).toFixed(2)}`)
    console.log(`   - Total: $${totalMonthlySpending.toFixed(2)}`)

    // 4. Test if this matches our earlier analysis
    console.log(`\n✅ Expected from analysis: $32,593.53`)
    console.log(`✅ Calculated now: $${totalMonthlySpending.toFixed(2)}`)
    console.log(`✅ Match: ${Math.abs(totalMonthlySpending - 32593.53) < 1 ? 'YES' : 'NO'}`)

    // 5. Test Procurement as well
    console.log(`\n🧪 Testing Procurement Department...\n`)
    
    const procurementRequests = await prisma.request.findMany({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth },
        requester: { department: 'Procurement' }
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const procurementRequestSpending = procurementRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    const procurementPOSpending = await prisma.purchaseOrder.aggregate({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth },
        createdBy: { department: 'Procurement' }
      },
      _sum: { totalAmount: true }
    })

    const totalProcurementSpending = procurementRequestSpending + (procurementPOSpending._sum.totalAmount || 0)

    console.log(`💰 Procurement monthly spending:`)
    console.log(`   - Requests: $${procurementRequestSpending.toFixed(2)}`)
    console.log(`   - Purchase Orders: $${(procurementPOSpending._sum.totalAmount || 0).toFixed(2)}`)
    console.log(`   - Total: $${totalProcurementSpending.toFixed(2)}`)

    console.log(`\n✅ Expected from analysis: $17,715.85`)
    console.log(`✅ Calculated now: $${totalProcurementSpending.toFixed(2)}`)
    console.log(`✅ Match: ${Math.abs(totalProcurementSpending - 17715.85) < 1 ? 'YES' : 'NO'}`)

    console.log('\n✅ Department dashboard test completed!')

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testLegalDepartment()
