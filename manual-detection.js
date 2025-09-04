const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function manualDetection() {
  try {
    // Find Clean & Fresh Supplies
    const supplier = await prisma.supplier.findFirst({
      where: {
        name: {
          contains: 'Clean',
          mode: 'insensitive'
        }
      }
    })

    if (!supplier) {
      console.log('Supplier not found')
      process.exit(1)
    }

    console.log(`Found supplier: ${supplier.name} (ID: ${supplier.id})`)
    console.log(`Current categories: ${supplier.categories}`)

    // Get items for this supplier
    const items = await prisma.item.findMany({
      where: {
        supplierId: supplier.id,
        isActive: true
      },
      include: {
        category: true
      }
    })

    console.log(`Found ${items.length} items for this supplier`)
    
    if (items.length > 0) {
      // Get unique categories from items
      const categories = [...new Set(items.map(item => item.category.name))]
      console.log(`Item categories: [${categories.join(', ')}]`)

      // Create enhanced category data
      const categoryData = {
        categories: categories,
        confidence: 1.0,
        detectionMethods: ['manual_item_analysis'],
        detectedAt: new Date().toISOString(),
        itemCount: items.length,
        categoryCount: categories.length
      }

      // Update the supplier with categories
      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          categories: JSON.stringify(categoryData),
          categoriesDetectedAt: new Date()
        }
      })

      console.log('✅ Updated supplier with categories:', categories)
      console.log('Enhanced data stored:', categoryData)
    } else {
      console.log('No items found - creating sample categories')
      
      // Create sample categories based on supplier name
      const sampleCategories = ['Cleaning Supplies', 'Hygiene Products']
      const categoryData = {
        categories: sampleCategories,
        confidence: 0.8,
        detectionMethods: ['supplier_name_analysis'],
        detectedAt: new Date().toISOString(),
        itemCount: 0,
        categoryCount: sampleCategories.length
      }

      await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
          categories: JSON.stringify(categoryData),
          categoriesDetectedAt: new Date()
        }
      })

      console.log('✅ Updated supplier with sample categories:', sampleCategories)
    }

    // Verify the update
    const updated = await prisma.supplier.findUnique({
      where: { id: supplier.id },
      select: { categories: true, categoriesDetectedAt: true }
    })

    console.log('🔍 Verification:')
    console.log(`Stored categories: ${updated.categories}`)
    console.log(`Detection date: ${updated.categoriesDetectedAt}`)

    try {
      const parsed = JSON.parse(updated.categories)
      console.log('Parsed categories:', parsed.categories)
    } catch (e) {
      console.log('Parse error:', e.message)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

manualDetection()