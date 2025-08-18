const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugUpdateRequest() {
  console.log('🔍 Debugging Update Request Functionality...')
  
  try {
    // Get a sample request to test with
    const sampleRequest = await prisma.request.findFirst({
      include: {
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                reference: true,
                unit: true,
                price: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })
    
    if (!sampleRequest) {
      console.log('❌ No requests found in database')
      return
    }
    
    console.log('📋 Sample Request Details:')
    console.log('- ID:', sampleRequest.id)
    console.log('- Title:', sampleRequest.title)
    console.log('- Status:', sampleRequest.status)
    console.log('- Department:', sampleRequest.department)
    console.log('- Priority:', sampleRequest.priority)
    console.log('- Total Amount:', sampleRequest.totalAmount)
    console.log('- Requester:', sampleRequest.requester.name, `(${sampleRequest.requester.role})`)
    console.log('- Items Count:', sampleRequest.items.length)
    
    console.log('\n📦 Request Items:')
    sampleRequest.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.item.name}`)
      console.log(`   - Item ID: ${item.itemId}`)
      console.log(`   - Quantity: ${item.quantity}`)
      console.log(`   - Unit Price: $${item.unitPrice}`)
      console.log(`   - Total Price: $${item.totalPrice}`)
      console.log(`   - Unit: ${item.item.unit}`)
      console.log(`   - Category: ${item.item.category.name}`)
      console.log(`   - Notes: ${item.notes || 'None'}`)
    })
    
    // Test the update data structure
    console.log('\n🔧 Testing Update Data Structure:')
    const updateData = {
      title: sampleRequest.title + ' (Updated)',
      description: sampleRequest.description || 'Updated description',
      department: sampleRequest.department,
      priority: sampleRequest.priority,
      totalAmount: sampleRequest.items.reduce((sum, item) => sum + item.totalPrice, 0),
      items: sampleRequest.items.map(item => ({
        itemId: item.itemId,
        name: item.item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes
      }))
    }
    
    console.log('Update Data:')
    console.log('- Title:', updateData.title)
    console.log('- Department:', updateData.department)
    console.log('- Priority:', updateData.priority)
    console.log('- Total Amount:', updateData.totalAmount)
    console.log('- Items:', updateData.items.length)
    
    // Validate each item
    console.log('\n✅ Validating Items:')
    for (let i = 0; i < updateData.items.length; i++) {
      const item = updateData.items[i]
      console.log(`Item ${i + 1}:`)
      console.log(`  - ItemId: ${item.itemId} (${item.itemId ? '✅' : '❌'})`)
      console.log(`  - Quantity: ${item.quantity} (${item.quantity > 0 ? '✅' : '❌'})`)
      console.log(`  - UnitPrice: ${item.unitPrice} (${item.unitPrice >= 0 ? '✅' : '❌'})`)
      
      // Check if item exists in database
      const itemExists = await prisma.item.findUnique({
        where: { id: item.itemId }
      })
      console.log(`  - Item exists: ${itemExists ? '✅' : '❌'}`)
    }
    
    // Test authorization scenarios
    console.log('\n👤 Authorization Test:')
    const testUsers = await prisma.user.findMany({
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
      },
      take: 5
    })
    
    console.log('Users who can update this request:')
    testUsers.forEach(user => {
      const canUpdate = user.id === sampleRequest.requesterId || 
                       user.role === 'ADMIN' || 
                       user.role === 'MANAGER'
      console.log(`- ${user.name} (${user.role}): ${canUpdate ? '✅' : '❌'}`)
    })
    
    // Test if we can manually update the request
    console.log('\n🧪 Testing Manual Update:')
    try {
      const updatedRequest = await prisma.request.update({
        where: { id: sampleRequest.id },
        data: {
          title: sampleRequest.title + ' (Test Update)',
          description: 'Test update description'
        }
      })
      console.log('✅ Manual update successful')
      
      // Revert the change
      await prisma.request.update({
        where: { id: sampleRequest.id },
        data: {
          title: sampleRequest.title,
          description: sampleRequest.description
        }
      })
      console.log('✅ Reverted changes')
      
    } catch (error) {
      console.log('❌ Manual update failed:', error.message)
    }
    
    console.log('\n✅ Debug completed!')
    
  } catch (error) {
    console.error('❌ Error during debug:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugUpdateRequest()
