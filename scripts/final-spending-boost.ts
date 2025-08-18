import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function finalSpendingBoost() {
  try {
    console.log('🚀 FINAL SPENDING BOOST - Ensuring ALL departments spend $3,000+\n')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Get all departments
    const departments = await prisma.department.findMany()
    const users = await prisma.user.findMany()

    // Create high-value items if needed
    let items = await prisma.item.findMany()
    if (items.length < 5) {
      console.log('Creating high-value items...')
      
      let supplier = await prisma.supplier.findFirst()
      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: { name: 'Premium Supplies', email: 'orders@premium.com', status: 'ACTIVE' }
        })
      }

      let category = await prisma.category.findFirst()
      if (!category) {
        category = await prisma.category.create({
          data: { name: 'Premium Equipment', description: 'High-value equipment' }
        })
      }

      const highValueItems = [
        { reference: 'PREMIUM001', name: 'Executive Laptop Pro', price: 2499.99, unit: 'each' },
        { reference: 'PREMIUM002', name: 'Conference Room System', price: 1899.99, unit: 'each' },
        { reference: 'PREMIUM003', name: 'Professional Workstation', price: 1599.99, unit: 'each' },
        { reference: 'PREMIUM004', name: 'Enterprise Software Suite', price: 999.99, unit: 'license' },
        { reference: 'PREMIUM005', name: 'Premium Office Furniture Set', price: 799.99, unit: 'set' }
      ]

      for (const item of highValueItems) {
        const existing = await prisma.item.findFirst({ where: { reference: item.reference } })
        if (!existing) {
          await prisma.item.create({
            data: {
              ...item,
              currentStock: 50,
              minStock: 5,
              categoryId: category.id,
              supplierId: supplier.id
            }
          })
        }
      }
      
      items = await prisma.item.findMany()
      console.log(`Now have ${items.length} items available`)
    }

    // Process each department
    for (const dept of departments) {
      console.log(`\n💰 Processing ${dept.name}...`)

      // Calculate exact current spending
      const currentRequests = await prisma.request.findMany({
        where: {
          status: { in: ['APPROVED', 'COMPLETED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          requester: { departmentId: dept.id }
        },
        include: { items: true }
      })

      const requestSpending = currentRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, item) => itemTotal + item.totalPrice, 0)
      }, 0)

      const poSpending = await prisma.purchaseOrder.aggregate({
        where: {
          status: { in: ['APPROVED', 'ORDERED', 'RECEIVED'] },
          createdAt: { gte: currentMonth, lt: nextMonth },
          createdBy: { departmentId: dept.id }
        },
        _sum: { totalAmount: true }
      })

      const totalSpending = requestSpending + (poSpending._sum.totalAmount || 0)
      console.log(`  Current spending: $${totalSpending.toFixed(2)}`)

      if (totalSpending < 3000) {
        const exactlyNeeded = 3000 - totalSpending
        console.log(`  Exactly need: $${exactlyNeeded.toFixed(2)}`)

        // Get a user from this department
        const deptUser = users.find(u => u.departmentId === dept.id) || users[0]

        // Create ONE big request to reach exactly $3,000
        const requestDate = new Date(currentMonth.getTime() + Math.random() * (now.getTime() - currentMonth.getTime()))

        const request = await prisma.request.create({
          data: {
            title: `${dept.name} December Equipment Procurement`,
            description: `Essential equipment procurement to meet ${dept.name} department operational requirements`,
            priority: 'HIGH',
            status: 'APPROVED',
            requesterId: deptUser.id,
            department: dept.name,
            totalAmount: exactlyNeeded,
            createdAt: requestDate,
            updatedAt: requestDate
          }
        })

        // Add items to reach the exact amount needed
        let addedAmount = 0
        const usedItemIds = new Set()
        const availableItems = [...items] // Copy array

        while (addedAmount < exactlyNeeded - 50 && availableItems.length > 0) { // Leave small buffer
          const randomIndex = Math.floor(Math.random() * availableItems.length)
          const randomItem = availableItems[randomIndex]

          // Remove item from available list to avoid duplicates
          availableItems.splice(randomIndex, 1)

          const maxQuantity = Math.floor((exactlyNeeded - addedAmount) / randomItem.price)
          const quantity = Math.max(1, Math.min(maxQuantity, 5))
          const unitPrice = randomItem.price
          const itemTotal = quantity * unitPrice

          if (addedAmount + itemTotal <= exactlyNeeded + 100) { // Allow some overage
            await prisma.requestItem.create({
              data: {
                requestId: request.id,
                itemId: randomItem.id,
                quantity,
                unitPrice,
                totalPrice: itemTotal,
                notes: `Essential procurement for ${dept.name} operations`
              }
            })
            addedAmount += itemTotal
            console.log(`    Added ${quantity}x ${randomItem.name}: $${itemTotal.toFixed(2)} (Total: $${addedAmount.toFixed(2)})`)
          }

          if (addedAmount >= exactlyNeeded - 50) break
        }

        // If we're still short, add a final adjustment item (only if not already used)
        if (addedAmount < exactlyNeeded - 10) {
          const remaining = exactlyNeeded - addedAmount
          const adjustmentItem = availableItems.find(item => item.price <= remaining) ||
                                 items.find(item => !usedItemIds.has(item.id)) ||
                                 items[0]

          if (adjustmentItem && !usedItemIds.has(adjustmentItem.id)) {
            await prisma.requestItem.create({
              data: {
                requestId: request.id,
                itemId: adjustmentItem.id,
                quantity: 1,
                unitPrice: remaining,
                totalPrice: remaining,
                notes: `Final adjustment to meet spending target`
              }
            })
            addedAmount += remaining
            console.log(`    Final adjustment: $${remaining.toFixed(2)}`)
          }
        }

        // Update request with actual total
        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount: addedAmount }
        })

        console.log(`  ✅ ${dept.name} added $${addedAmount.toFixed(2)} - New total: $${(totalSpending + addedAmount).toFixed(2)}`)
      } else {
        console.log(`  ✅ ${dept.name} already meets target`)
      }
    }

    console.log('\n🎉 FINAL SPENDING BOOST COMPLETED!')
    console.log('Every department should now have at least $3,000 in monthly spending.')

  } catch (error) {
    console.error('❌ Error in final spending boost:', error)
  } finally {
    await prisma.$disconnect()
  }
}

finalSpendingBoost()
