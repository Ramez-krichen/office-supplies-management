import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSpendingData() {
  try {
    console.log('💰 Checking Spending Data...\n')

    // Check requests
    const totalRequests = await prisma.request.count()
    const approvedRequests = await prisma.request.count({
      where: { status: { in: ['APPROVED', 'COMPLETED'] } }
    })
    
    console.log(`📋 Requests:`)
    console.log(`   Total requests: ${totalRequests}`)
    console.log(`   Approved/Completed requests: ${approvedRequests}`)

    // Check purchase orders
    const totalPOs = await prisma.purchaseOrder.count()
    const activePOs = await prisma.purchaseOrder.count({
      where: { status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] } }
    })

    console.log(`\n📦 Purchase Orders:`)
    console.log(`   Total purchase orders: ${totalPOs}`)
    console.log(`   Active purchase orders: ${activePOs}`)

    // Check items
    const totalItems = await prisma.item.count()
    console.log(`\n📦 Items:`)
    console.log(`   Total items: ${totalItems}`)

    // Check suppliers
    const totalSuppliers = await prisma.supplier.count()
    console.log(`\n🏢 Suppliers:`)
    console.log(`   Total suppliers: ${totalSuppliers}`)

    // Check categories
    const totalCategories = await prisma.category.count()
    console.log(`\n📂 Categories:`)
    console.log(`   Total categories: ${totalCategories}`)

    // Current month calculation
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const currentMonthRequests = await prisma.request.count({
      where: {
        status: { in: ['APPROVED', 'COMPLETED'] },
        createdAt: { gte: currentMonth }
      }
    })

    const currentMonthPOs = await prisma.purchaseOrder.count({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'RECEIVED'] },
        createdAt: { gte: currentMonth }
      }
    })

    console.log(`\n📅 Current Month (${currentMonth.toISOString().slice(0, 7)}):`)
    console.log(`   Approved requests this month: ${currentMonthRequests}`)
    console.log(`   Active POs this month: ${currentMonthPOs}`)

    if (totalRequests === 0 && totalPOs === 0) {
      console.log('\n❌ No spending data found! This explains why monthly spending is $0.00')
      console.log('   Need to create sample requests and purchase orders.')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSpendingData()
