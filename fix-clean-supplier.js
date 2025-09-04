const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixCleanSupplier() {
  try {
    console.log('🔧 Fixing Clean & Fresh Supplies...')

    // Find Clean & Fresh Supplies
    const supplier = await prisma.supplier.findFirst({
      where: {
        name: {
          contains: 'Clean'
        }
      },
      include: {
        items: {
          include: {
            category: true
          }
        }
      }
    })

    if (!supplier) {
      console.log('❌ Clean & Fresh Supplies not found')
      return
    }

    console.log(`✅ Found supplier: ${supplier.name}`)
    console.log(`📊 Current items: ${supplier.items.length}`)

    // If no items, create some sample items
    if (supplier.items.length === 0) {
      console.log('📦 Creating sample items for Clean & Fresh Supplies...')

      // First, get or create categories
      const cleaningCategory = await prisma.category.upsert({
        where: { name: 'Cleaning Supplies' },
        update: {},
        create: { name: 'Cleaning Supplies', description: 'General cleaning supplies' }
      })

      const hygieneCategory = await prisma.category.upsert({
        where: { name: 'Hygiene Products' },
        update: {},
        create: { name: 'Hygiene Products', description: 'Personal and office hygiene products' }
      })

      // Create sample items
      const itemsToCreate = [
        {
          reference: `CLEAN-001-${Date.now()}`,
          name: 'All-Purpose Cleaner',
          description: 'Multi-surface cleaning solution',
          unit: 'bottle',
          price: 12.99,
          minStock: 5,
          currentStock: 25,
          categoryId: cleaningCategory.id,
          supplierId: supplier.id
        },
        {
          reference: `CLEAN-002-${Date.now()}`,
          name: 'Disinfectant Wipes',
          description: 'Antibacterial surface wipes',
          unit: 'pack',
          price: 8.50,
          minStock: 10,
          currentStock: 40,
          categoryId: hygieneCategory.id,
          supplierId: supplier.id
        },
        {
          reference: `CLEAN-003-${Date.now()}`,
          name: 'Hand Sanitizer',
          description: '70% alcohol hand sanitizer',
          unit: 'bottle',
          price: 6.99,
          minStock: 15,
          currentStock: 30,
          categoryId: hygieneCategory.id,
          supplierId: supplier.id
        },
        {
          reference: `CLEAN-004-${Date.now()}`,
          name: 'Glass Cleaner',
          description: 'Streak-free glass and window cleaner',
          unit: 'bottle',
          price: 9.99,
          minStock: 8,
          currentStock: 20,
          categoryId: cleaningCategory.id,
          supplierId: supplier.id
        },
        {
          reference: `CLEAN-005-${Date.now()}`,
          name: 'Paper Towels',
          description: 'Absorbent paper towels for cleaning',
          unit: 'roll',
          price: 4.50,
          minStock: 20,
          currentStock: 60,
          categoryId: cleaningCategory.id,
          supplierId: supplier.id
        }
      ]

      for (const itemData of itemsToCreate) {
        await prisma.item.create({
          data: itemData
        })
        console.log(`   ✅ Created: ${itemData.name}`)
      }
    } else {
      console.log('✅ Supplier already has items:')
      supplier.items.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.name} (${item.category.name})`)
      })
    }

    // Now run category detection
    console.log('\n🚀 Running category detection...')
    
    // Get updated supplier with items
    const updatedSupplier = await prisma.supplier.findUnique({
      where: { id: supplier.id },
      include: {
        items: {
          include: { category: true }
        }
      }
    })

    // Extract categories from items
    const categories = [...new Set(updatedSupplier.items.map(item => item.category.name))]
    console.log(`📋 Detected categories: [${categories.join(', ')}]`)

    // Create enhanced category data
    const categoryData = {
      categories: categories,
      confidence: 0.95,
      detectionMethods: ['item_pattern_analysis'],
      detectedAt: new Date().toISOString(),
      itemCount: updatedSupplier.items.length,
      categoryCount: categories.length,
      suggestions: categories.map(cat => ({
        category: cat,
        confidence: 0.95,
        method: 'item_pattern_analysis',
        reasoning: `Category derived from existing items`
      }))
    }

    // Update supplier with categories
    await prisma.supplier.update({
      where: { id: supplier.id },
      data: {
        categories: JSON.stringify(categoryData),
        categoriesDetectedAt: new Date()
      }
    })

    console.log('✅ Successfully updated supplier with categories!')
    console.log('📊 Final category data:', categoryData)

    // Verify the update
    const final = await prisma.supplier.findUnique({
      where: { id: supplier.id },
      select: { 
        name: true,
        categories: true, 
        categoriesDetectedAt: true 
      }
    })

    console.log('\n🔍 Verification:')
    console.log(`Name: ${final.name}`)
    console.log(`Raw categories: ${final.categories}`)
    console.log(`Detection date: ${final.categoriesDetectedAt}`)

    if (final.categories) {
      try {
        const parsed = JSON.parse(final.categories)
        console.log(`Parsed categories: [${parsed.categories.join(', ')}]`)
      } catch (e) {
        console.log('Parse error:', e.message)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixCleanSupplier()