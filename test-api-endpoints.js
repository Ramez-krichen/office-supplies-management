const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAPIEndpoints() {
  console.log('🧪 Testing API Endpoints...')
  
  try {
    // Get a sample request to test with
    const sampleRequest = await prisma.request.findFirst({
      include: {
        items: {
          include: {
            item: true
          }
        },
        requester: true
      }
    })
    
    if (!sampleRequest) {
      console.log('❌ No requests found in database')
      return
    }
    
    console.log('✅ Found sample request:', sampleRequest.title)
    console.log('- ID:', sampleRequest.id)
    console.log('- Status:', sampleRequest.status)
    console.log('- Items:', sampleRequest.items.length)
    console.log('- Requester:', sampleRequest.requester.name)
    
    // Test the data structure that would be sent to the API
    const updateData = {
      title: sampleRequest.title + ' (Updated)',
      description: sampleRequest.description || 'Updated description',
      department: sampleRequest.department,
      priority: sampleRequest.priority,
      items: sampleRequest.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes
      }))
    }
    
    console.log('\n📝 Update data structure:')
    console.log('- Title:', updateData.title)
    console.log('- Items count:', updateData.items.length)
    if (updateData.items.length > 0) {
      console.log('- First item ID:', updateData.items[0].itemId)
      console.log('- First item quantity:', updateData.items[0].quantity)
      console.log('- First item unit price:', updateData.items[0].unitPrice)
    }
    
    // Test if the item IDs are valid
    console.log('\n🔍 Validating item IDs...')
    for (const item of updateData.items) {
      const existingItem = await prisma.item.findUnique({
        where: { id: item.itemId }
      })
      
      if (!existingItem) {
        console.log(`❌ Item ID ${item.itemId} not found in items table`)
      } else {
        console.log(`✅ Item ID ${item.itemId} is valid (${existingItem.name})`)
      }
    }
    
    // Test user permissions
    console.log('\n👤 Testing user permissions...')
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'MANAGER' },
          { id: sampleRequest.requesterId }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    console.log('Users who can edit this request:')
    users.forEach(user => {
      console.log(`- ${user.name} (${user.role})`)
    })
    
    console.log('\n✅ API endpoint test completed!')
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAPIEndpoints()
