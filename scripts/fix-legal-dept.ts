import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixLegalDept() {
  try {
    console.log('🏛️ Fixing Legal department spending...')

    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get Legal department
    const legalDept = await prisma.department.findFirst({
      where: { code: 'LEGAL' }
    })

    if (!legalDept) {
      console.log('Legal department not found')
      return
    }

    // Get a user from Legal department
    const legalUser = await prisma.user.findFirst({
      where: { departmentId: legalDept.id }
    })

    if (!legalUser) {
      console.log('No user found in Legal department')
      return
    }

    // Get an item
    const item = await prisma.item.findFirst()
    if (!item) {
      console.log('No items found')
      return
    }

    // Create a small request to push Legal over $3,000
    const request = await prisma.request.create({
      data: {
        title: 'Legal Department Final Procurement',
        description: 'Final procurement to meet department targets',
        priority: 'MEDIUM',
        status: 'APPROVED',
        requesterId: legalUser.id,
        department: legalDept.name,
        totalAmount: 10.00,
        createdAt: new Date(currentMonth.getTime() + Math.random() * (now.getTime() - currentMonth.getTime()))
      }
    })

    // Add a small item
    await prisma.requestItem.create({
      data: {
        requestId: request.id,
        itemId: item.id,
        quantity: 1,
        unitPrice: 10.00,
        totalPrice: 10.00,
        notes: 'Final adjustment for Legal department'
      }
    })

    console.log('✅ Added $10.00 to Legal department spending')
    console.log('Legal department should now be over $3,000')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixLegalDept()
