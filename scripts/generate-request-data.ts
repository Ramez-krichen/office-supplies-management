import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

async function generateRequestData() {
  try {
    console.log('🚀 Starting request data generation...')

    // Get existing users and items
    const users = await prisma.user.findMany()
    const items = await prisma.item.findMany()
    
    if (users.length === 0 || items.length === 0) {
      console.log('❌ No users or items found. Please run the seed script first.')
      return
    }

    const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Facilities']
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED']

    // Generate 50 requests over the last 6 months
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 6)
    const endDate = new Date()

    for (let i = 0; i < 50; i++) {
      const requestDate = randomDate(startDate, endDate)
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const department = departments[Math.floor(Math.random() * departments.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Create request
      const request = await prisma.request.create({
        data: {
          title: `${department} Supply Request ${i + 1}`,
          description: `Office supplies request for ${department} department - ${requestDate.toLocaleDateString()}`,
          priority: priority as any,
          status: status as any,
          requesterId: randomUser.id,
          totalAmount: 0, // Will be calculated after adding items
          createdAt: requestDate,
          updatedAt: requestDate
        }
      })

      // Add 1-5 random items to each request
      const itemsCount = Math.floor(Math.random() * 5) + 1
      let totalAmount = 0
      const usedItems = new Set()

      for (let j = 0; j < itemsCount; j++) {
        let randomItem
        let attempts = 0
        
        // Find an item that hasn't been used in this request
        do {
          randomItem = items[Math.floor(Math.random() * items.length)]
          attempts++
        } while (usedItems.has(randomItem.id) && attempts < 10)
        
        // If we couldn't find a unique item after 10 attempts, skip
        if (usedItems.has(randomItem.id)) continue
        
        usedItems.add(randomItem.id)
        const quantity = Math.floor(Math.random() * 10) + 1
        const unitPrice = randomAmount(randomItem.price * 0.9, randomItem.price * 1.1) // Slight price variation
        const itemTotal = quantity * unitPrice
        totalAmount += itemTotal
        
        await prisma.requestItem.create({
          data: {
            requestId: request.id,
            itemId: randomItem.id,
            quantity,
            unitPrice,
            totalPrice: itemTotal,
            notes: `Requested for ${department} department use`
          }
        })
      }

      // Update request total amount
      await prisma.request.update({
        where: { id: request.id },
        data: { totalAmount }
      })

      console.log(`✅ Created request ${i + 1}/50: ${request.title} - $${totalAmount.toFixed(2)}`)
    }

    console.log('🎉 Request data generation completed successfully!')
    
  } catch (error) {
    console.error('❌ Error generating request data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateRequestData()