import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function quickSpendingCheck() {
  try {
    let output = '💰 Spending Data Check\n\n'

    const requests = await prisma.request.count()
    const pos = await prisma.purchaseOrder.count()
    const items = await prisma.item.count()
    const suppliers = await prisma.supplier.count()

    output += `Requests: ${requests}\n`
    output += `Purchase Orders: ${pos}\n`
    output += `Items: ${items}\n`
    output += `Suppliers: ${suppliers}\n`

    console.log('Check completed!')
    fs.writeFileSync('spending-check.txt', output)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickSpendingCheck()
