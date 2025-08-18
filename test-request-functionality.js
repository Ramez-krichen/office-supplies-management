const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testRequestFunctionality() {
  console.log('🧪 Testing Request Functionality...')
  
  try {
    // Test 1: Check if requests exist in database
    console.log('\n1. Checking existing requests...')
    const requests = await prisma.request.findMany({
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                reference: true,
                unit: true,
                price: true,
                category: true
              }
            }
          }
        }
      }
    })
    
    console.log(`Found ${requests.length} requests in database`)
    
    if (requests.length > 0) {
      console.log('\nFirst request details:')
      console.log('- ID:', requests[0].id)
      console.log('- Title:', requests[0].title)
      console.log('- Status:', requests[0].status)
      console.log('- Requester:', requests[0].requester?.name)
      console.log('- Items count:', requests[0].items.length)
      
      if (requests[0].items.length > 0) {
        console.log('\nFirst item details:')
        const firstItem = requests[0].items[0]
        console.log('- Item ID:', firstItem.itemId)
        console.log('- Item Name:', firstItem.item?.name)
        console.log('- Quantity:', firstItem.quantity)
        console.log('- Unit Price:', firstItem.unitPrice)
        console.log('- Total Price:', firstItem.totalPrice)
      }
    }
    
    // Test 2: Check if users exist
    console.log('\n2. Checking users...')
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    console.log(`Found ${users.length} users`)
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`)
    })
    
    // Test 3: Check if items exist
    console.log('\n3. Checking items...')
    const items = await prisma.item.findMany({
      include: {
        category: true,
        supplier: true
      },
      take: 5
    })
    
    console.log(`Found ${items.length} items (showing first 5)`)
    items.forEach(item => {
      console.log(`- ${item.name} (${item.reference}) - Price: $${item.price} - Unit: ${item.unit}`)
    })
    
    // Test 4: Test data integrity
    console.log('\n4. Testing data integrity...')
    const requestsWithMissingData = await prisma.request.findMany({
      where: {
        OR: [
          { title: { equals: null } },
          { title: { equals: '' } },
          { requesterId: { equals: null } }
        ]
      }
    })

    if (requestsWithMissingData.length > 0) {
      console.log(`⚠️  Found ${requestsWithMissingData.length} requests with missing data`)
    } else {
      console.log('✅ All requests have required data')
    }
    
    // Test 5: Check request items integrity
    const requestItemsWithMissingData = await prisma.requestItem.findMany({
      where: {
        OR: [
          { itemId: { equals: null } },
          { quantity: { lte: 0 } },
          { unitPrice: { lt: 0 } }
        ]
      }
    })

    if (requestItemsWithMissingData.length > 0) {
      console.log(`⚠️  Found ${requestItemsWithMissingData.length} request items with invalid data`)
    } else {
      console.log('✅ All request items have valid data')
    }
    
    console.log('\n✅ Request functionality test completed!')
    
  } catch (error) {
    console.error('❌ Error testing request functionality:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testRequestFunctionality()
