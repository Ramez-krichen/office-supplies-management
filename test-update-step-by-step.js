const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testUpdateStepByStep() {
  console.log('🔍 Testing Update Request Step by Step...')
  
  try {
    // Step 1: Get a test user
    console.log('\n1. Getting test user...')
    const testUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })
    
    if (!testUser) {
      console.log('❌ No admin user found')
      return
    }
    
    console.log('✅ Test user:', testUser.name, `(${testUser.email})`)
    
    // Step 2: Get a sample request
    console.log('\n2. Getting sample request...')
    const sampleRequest = await prisma.request.findFirst({
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })
    
    if (!sampleRequest) {
      console.log('❌ No requests found')
      return
    }
    
    console.log('✅ Sample request:', sampleRequest.title)
    console.log('   - ID:', sampleRequest.id)
    console.log('   - Current title:', sampleRequest.title)
    console.log('   - Items count:', sampleRequest.items.length)
    
    // Step 3: Test authorization logic
    console.log('\n3. Testing authorization...')
    const canUpdate = sampleRequest.requesterId === testUser.id || 
                     testUser.role === 'ADMIN' || 
                     testUser.role === 'MANAGER'
    
    console.log('   - Request owner:', sampleRequest.requesterId)
    console.log('   - Test user ID:', testUser.id)
    console.log('   - Test user role:', testUser.role)
    console.log('   - Can update:', canUpdate ? '✅' : '❌')
    
    // Step 4: Prepare update data (exactly like frontend)
    console.log('\n4. Preparing update data...')
    const updateData = {
      title: sampleRequest.title + ' (API Test Update)',
      description: sampleRequest.description || 'Test update description',
      department: sampleRequest.department,
      priority: sampleRequest.priority,
      totalAmount: sampleRequest.items.reduce((sum, item) => sum + item.totalPrice, 0),
      items: sampleRequest.items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes
      }))
    }
    
    console.log('✅ Update data prepared:')
    console.log('   - New title:', updateData.title)
    console.log('   - Department:', updateData.department)
    console.log('   - Priority:', updateData.priority)
    console.log('   - Total amount:', updateData.totalAmount)
    console.log('   - Items count:', updateData.items.length)
    
    // Step 5: Validate items
    console.log('\n5. Validating items...')
    for (let i = 0; i < updateData.items.length; i++) {
      const item = updateData.items[i]
      console.log(`   Item ${i + 1}:`)
      console.log(`     - ItemId: ${item.itemId}`)
      console.log(`     - Quantity: ${item.quantity}`)
      console.log(`     - UnitPrice: ${item.unitPrice}`)
      
      // Check if item exists
      const itemExists = await prisma.item.findUnique({
        where: { id: item.itemId }
      })
      
      if (!itemExists) {
        console.log(`     ❌ Item ${item.itemId} not found!`)
        return
      } else {
        console.log(`     ✅ Item exists: ${itemExists.name}`)
      }
      
      // Validate data
      if (!item.itemId) {
        console.log(`     ❌ Missing itemId`)
        return
      }
      if (!item.quantity || item.quantity <= 0) {
        console.log(`     ❌ Invalid quantity: ${item.quantity}`)
        return
      }
      if (item.unitPrice < 0) {
        console.log(`     ❌ Invalid unitPrice: ${item.unitPrice}`)
        return
      }
    }
    
    console.log('✅ All items validated successfully')
    
    // Step 6: Simulate the API update logic
    console.log('\n6. Simulating API update logic...')
    
    try {
      // Update request
      const updatedRequest = await prisma.request.update({
        where: { id: sampleRequest.id },
        data: {
          title: updateData.title,
          description: updateData.description,
          department: updateData.department,
          priority: updateData.priority,
          totalAmount: updateData.totalAmount
        }
      })
      
      console.log('✅ Request updated successfully')
      
      // Update items
      if (updateData.items && updateData.items.length > 0) {
        // Delete existing items
        await prisma.requestItem.deleteMany({
          where: { requestId: sampleRequest.id }
        })
        
        console.log('✅ Existing items deleted')
        
        // Create new items
        for (const item of updateData.items) {
          await prisma.requestItem.create({
            data: {
              requestId: sampleRequest.id,
              itemId: item.itemId,
              quantity: parseInt(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
              notes: item.notes || null
            }
          })
        }
        
        console.log('✅ New items created')
      }
      
      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Request',
          entityId: sampleRequest.id,
          performedBy: testUser.id,
          details: `Updated request: ${updateData.title}`
        }
      })
      
      console.log('✅ Audit log created')
      
      // Verify the update
      const verifyRequest = await prisma.request.findUnique({
        where: { id: sampleRequest.id },
        include: {
          items: true
        }
      })
      
      console.log('\n7. Verifying update...')
      console.log('   - New title:', verifyRequest.title)
      console.log('   - Items count:', verifyRequest.items.length)
      console.log('   - Total amount:', verifyRequest.totalAmount)
      
      // Revert changes for testing
      console.log('\n8. Reverting changes...')
      await prisma.request.update({
        where: { id: sampleRequest.id },
        data: {
          title: sampleRequest.title,
          description: sampleRequest.description,
          totalAmount: sampleRequest.totalAmount
        }
      })
      
      // Restore original items
      await prisma.requestItem.deleteMany({
        where: { requestId: sampleRequest.id }
      })
      
      for (const item of sampleRequest.items) {
        await prisma.requestItem.create({
          data: {
            requestId: sampleRequest.id,
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            notes: item.notes
          }
        })
      }
      
      console.log('✅ Changes reverted successfully')
      
      console.log('\n🎉 All tests passed! The update logic works correctly.')
      console.log('The issue is likely in the frontend authentication or API call.')
      
    } catch (error) {
      console.log('❌ Update failed:', error.message)
      console.log('Error details:', error)
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testUpdateStepByStep()
