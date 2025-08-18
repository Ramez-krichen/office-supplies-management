const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testPurchaseOrderData() {
  try {
    console.log('🔍 Testing Purchase Order Data Integrity...\n')
    
    // 1. Check suppliers
    console.log('1️⃣ Checking suppliers...')
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        contactPerson: true
      }
    })
    
    console.log(`   📊 Found ${suppliers.length} suppliers:`)
    suppliers.forEach(supplier => {
      console.log(`     - ${supplier.name} (${supplier.id})`)
      console.log(`       Contact: ${supplier.contactPerson}`)
      console.log(`       Email: ${supplier.email || 'N/A'}`)
    })

    if (suppliers.length === 0) {
      console.log('   ❌ No suppliers found! This will cause purchase order creation to fail.')
      return
    }

    // 2. Check items
    console.log('\n2️⃣ Checking items...')
    const items = await prisma.item.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        reference: true,
        price: true,
        unit: true,
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 10
    })
    
    console.log(`   📊 Found ${items.length} active items (showing first 10):`)
    items.forEach(item => {
      console.log(`     - ${item.name} (${item.reference})`)
      console.log(`       Price: $${item.price} per ${item.unit}`)
      console.log(`       Supplier: ${item.supplier?.name || 'N/A'}`)
    })

    if (items.length === 0) {
      console.log('   ❌ No active items found! This will cause purchase order creation to fail.')
      return
    }

    // 3. Check for potential data issues
    console.log('\n3️⃣ Checking for data issues...')

    // Check for items with invalid prices
    const itemsWithInvalidPrices = await prisma.item.count({
      where: {
        isActive: true,
        price: {
          lte: 0
        }
      }
    })

    if (itemsWithInvalidPrices > 0) {
      console.log(`   ⚠️  Warning: ${itemsWithInvalidPrices} active items have invalid prices (≤ 0)`)
    } else {
      console.log(`   ✅ All active items have valid prices`)
    }

    // 4. Test a sample purchase order creation data
    console.log('\n4️⃣ Testing sample purchase order data...')
    
    const sampleSupplier = suppliers[0]
    const sampleItem = items.find(item => item.supplier?.id === sampleSupplier.id) || items[0]
    
    if (!sampleItem) {
      console.log('   ❌ No items found for the first supplier')
      return
    }

    const sampleOrderData = {
      supplierId: sampleSupplier.id,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      notes: 'Test order data validation',
      items: [
        {
          itemId: sampleItem.id,
          quantity: 5,
          unitPrice: sampleItem.price
        }
      ]
    }

    console.log('   📋 Sample order data:')
    console.log(`     Supplier: ${sampleSupplier.name}`)
    console.log(`     Item: ${sampleItem.name}`)
    console.log(`     Quantity: ${sampleOrderData.items[0].quantity}`)
    console.log(`     Unit Price: $${sampleOrderData.items[0].unitPrice}`)
    console.log(`     Total: $${sampleOrderData.items[0].quantity * sampleOrderData.items[0].unitPrice}`)

    // 5. Validate the data structure
    console.log('\n5️⃣ Validating data structure...')
    
    const validationErrors = []
    
    if (!sampleOrderData.supplierId) {
      validationErrors.push('Supplier ID is missing')
    }
    
    if (!sampleOrderData.items || sampleOrderData.items.length === 0) {
      validationErrors.push('No items provided')
    }
    
    sampleOrderData.items.forEach((item, index) => {
      if (!item.itemId) {
        validationErrors.push(`Item ${index + 1}: Item ID is missing`)
      }
      if (!item.quantity || item.quantity <= 0) {
        validationErrors.push(`Item ${index + 1}: Invalid quantity`)
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        validationErrors.push(`Item ${index + 1}: Invalid unit price`)
      }
    })

    if (validationErrors.length > 0) {
      console.log('   ❌ Validation errors found:')
      validationErrors.forEach(error => console.log(`     - ${error}`))
    } else {
      console.log('   ✅ Sample data validation passed')
    }

    // 6. Check recent purchase orders
    console.log('\n6️⃣ Checking recent purchase orders...')
    const recentOrders = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        supplier: {
          select: { name: true }
        }
      }
    })

    console.log(`   📊 Found ${recentOrders.length} recent purchase orders:`)
    recentOrders.forEach(order => {
      console.log(`     - ${order.orderNumber} (${order.status})`)
      console.log(`       Supplier: ${order.supplier.name}`)
      console.log(`       Total: $${order.totalAmount}`)
      console.log(`       Created: ${order.createdAt.toISOString()}`)
    })

    console.log('\n✅ Purchase order data check completed!')
    
    if (validationErrors.length === 0 && suppliers.length > 0 && items.length > 0) {
      console.log('\n💡 Data appears to be in good condition for purchase order creation.')
      console.log('   If you\'re still experiencing errors, please check:')
      console.log('   - User authentication and permissions')
      console.log('   - Network connectivity')
      console.log('   - Browser console for detailed error messages')
    }

  } catch (error) {
    console.error('❌ Error during data check:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPurchaseOrderData()
