const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testSpecificDetection() {
  try {
    console.log('🔍 Testing specific detection for Clean & Fresh Supplies...\n')

    // Find Clean & Fresh Supplies
    const supplier = await prisma.supplier.findFirst({
      where: {
        name: {
          contains: 'Clean',
          mode: 'insensitive'
        }
      },
      include: {
        items: {
          include: {
            category: true
          },
          take: 10
        }
      }
    })

    if (!supplier) {
      console.log('❌ Clean & Fresh Supplies not found')
      return
    }

    console.log(`✅ Found supplier: ${supplier.name}`)
    console.log(`📊 Current data:`)
    console.log(`   - ID: ${supplier.id}`)
    console.log(`   - Raw categories: ${supplier.categories}`)
    console.log(`   - Detection date: ${supplier.categoriesDetectedAt}`)
    console.log(`   - Items count: ${supplier.items.length}`)

    if (supplier.items.length > 0) {
      console.log(`   - Sample items:`)
      supplier.items.slice(0, 5).forEach((item, i) => {
        console.log(`     ${i + 1}. ${item.name} (Category: ${item.category.name})`)
      })
    }

    // Parse existing categories if they exist
    if (supplier.categories) {
      console.log('\n📋 Parsing existing categories...')
      try {
        const parsed = JSON.parse(supplier.categories)
        console.log('   - Parsed result:', parsed)
        
        if (Array.isArray(parsed)) {
          console.log(`   - Simple array: [${parsed.join(', ')}]`)
        } else if (parsed.categories) {
          console.log(`   - Enhanced object:`)
          console.log(`     - Categories: [${parsed.categories.join(', ')}]`)
          console.log(`     - Confidence: ${parsed.confidence || 'N/A'}`)
          console.log(`     - Methods: [${parsed.detectionMethods?.join(', ') || 'N/A'}]`)
        }
      } catch (parseError) {
        console.log(`   ❌ Parse error: ${parseError.message}`)
      }
    } else {
      console.log('\n❌ No categories stored yet')
    }

    // Import and test detection functions
    console.log('\n🚀 Running fresh detection...')
    
    const { 
      detectSupplierCategoriesEnhanced, 
      detectAndUpdateSupplierCategoriesEnhanced 
    } = require('./src/lib/supplier-category-detection')

    // Test enhanced detection (without update)
    const detection = await detectSupplierCategoriesEnhanced(supplier.id)
    
    if (detection) {
      console.log('✅ Enhanced detection successful:')
      console.log(`   - Categories: [${detection.categories.join(', ')}]`)
      console.log(`   - Confidence: ${(detection.confidence * 100).toFixed(1)}%`)
      console.log(`   - Methods: [${detection.detectionMethods.join(', ')}]`)
      console.log(`   - Items analyzed: ${detection.itemCount}`)
      
      if (detection.suggestions.length > 0) {
        console.log('   - Top suggestions:')
        detection.suggestions.slice(0, 3).forEach((suggestion, i) => {
          console.log(`     ${i + 1}. ${suggestion.category} (${(suggestion.confidence * 100).toFixed(1)}% via ${suggestion.method})`)
        })
      }
    } else {
      console.log('❌ Enhanced detection failed')
    }

    // Test detection with update
    console.log('\n💾 Running detection with update...')
    const updateResult = await detectAndUpdateSupplierCategoriesEnhanced(supplier.id)
    
    if (updateResult) {
      console.log('✅ Detection with update successful:')
      console.log(`   - Categories: [${updateResult.categories.join(', ')}]`)
      console.log(`   - Confidence: ${(updateResult.confidence * 100).toFixed(1)}%`)
      
      // Check what was actually saved to database
      const updatedSupplier = await prisma.supplier.findUnique({
        where: { id: supplier.id },
        select: { categories: true, categoriesDetectedAt: true }
      })
      
      console.log('\n💽 Database after update:')
      console.log(`   - Raw categories: ${updatedSupplier.categories}`)
      console.log(`   - Detection date: ${updatedSupplier.categoriesDetectedAt}`)
      
      if (updatedSupplier.categories) {
        try {
          const parsed = JSON.parse(updatedSupplier.categories)
          console.log('   - Parsed categories:', parsed)
        } catch (e) {
          console.log(`   - Parse error: ${e.message}`)
        }
      }
    } else {
      console.log('❌ Detection with update failed')
    }

    console.log('\n🎯 Summary:')
    console.log(`   The supplier ${supplier.items.length > 0 ? 'HAS' : 'DOES NOT HAVE'} items for detection`)
    console.log(`   Detection ${detection ? 'SUCCEEDED' : 'FAILED'}`)
    console.log(`   Update ${updateResult ? 'SUCCEEDED' : 'FAILED'}`)

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSpecificDetection()