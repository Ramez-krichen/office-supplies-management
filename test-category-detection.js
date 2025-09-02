const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCategoryDetection() {
  try {
    console.log('🧪 Testing Enhanced Supplier Category Detection\n')
    
    // Get a sample supplier
    const supplier = await prisma.supplier.findFirst({
      where: { status: 'ACTIVE' },
      include: { 
        items: { 
          include: { category: true },
          take: 5 
        } 
      }
    })

    if (!supplier) {
      console.log('❌ No active suppliers found')
      return
    }

    console.log(`📦 Testing with supplier: ${supplier.name}`)
    console.log(`📋 Current items: ${supplier.items.length}`)
    
    if (supplier.items.length > 0) {
      console.log('📝 Sample items:')
      supplier.items.slice(0, 3).forEach(item => {
        console.log(`   - ${item.name} (${item.category.name})`)
      })
    }

    console.log('\n🔍 Testing basic detection...')
    
    // Import detection functions
    const { 
      detectSupplierCategories,
      detectSupplierCategoriesEnhanced,
      parseSupplierCategories,
      parseSupplierCategoriesEnhanced
    } = require('./src/lib/supplier-category-detection')

    // Test basic detection
    const basicDetection = await detectSupplierCategories(supplier.id)
    if (basicDetection) {
      console.log('✅ Basic detection successful:')
      console.log(`   Categories: ${basicDetection.categories.join(', ')}`)
      console.log(`   Items analyzed: ${basicDetection.itemCount}`)
      console.log(`   Categories found: ${basicDetection.categoryCount}`)
    } else {
      console.log('❌ Basic detection failed')
    }

    console.log('\n🚀 Testing enhanced detection...')
    
    // Test enhanced detection
    const enhancedDetection = await detectSupplierCategoriesEnhanced(supplier.id)
    if (enhancedDetection) {
      console.log('✅ Enhanced detection successful:')
      console.log(`   Categories: ${enhancedDetection.categories.join(', ')}`)
      console.log(`   Confidence: ${(enhancedDetection.confidence * 100).toFixed(1)}%`)
      console.log(`   Methods: ${enhancedDetection.detectionMethods.join(', ')}`)
      console.log(`   Items analyzed: ${enhancedDetection.itemCount}`)
      
      if (enhancedDetection.suggestions.length > 0) {
        console.log('\n💡 Top suggestions:')
        enhancedDetection.suggestions.slice(0, 3).forEach((suggestion, i) => {
          console.log(`   ${i + 1}. ${suggestion.category} (${(suggestion.confidence * 100).toFixed(1)}% via ${suggestion.method})`)
          console.log(`      Reasoning: ${suggestion.reasoning}`)
        })
      }
    } else {
      console.log('❌ Enhanced detection failed')
    }

    // Test parsing functions
    console.log('\n📊 Testing parsing functions...')
    
    const currentCategories = supplier.categories
    if (currentCategories) {
      console.log('✅ Current categories found in database')
      
      const basicParsed = parseSupplierCategories(currentCategories)
      console.log(`   Basic parsing: ${basicParsed.join(', ')}`)
      
      const enhancedParsed = parseSupplierCategoriesEnhanced(currentCategories)
      console.log(`   Enhanced parsing: ${enhancedParsed.categories.join(', ')}`)
      if (enhancedParsed.confidence) {
        console.log(`   Stored confidence: ${(enhancedParsed.confidence * 100).toFixed(1)}%`)
      }
      if (enhancedParsed.detectionMethods) {
        console.log(`   Stored methods: ${enhancedParsed.detectionMethods.join(', ')}`)
      }
    } else {
      console.log('ℹ️ No categories stored for this supplier yet')
    }

    // Test API endpoint (simulate)
    console.log('\n🌐 Testing API integration...')
    
    try {
      // Test the enhanced detection and update
      const { detectAndUpdateSupplierCategoriesEnhanced } = require('./src/lib/supplier-category-detection')
      const updateResult = await detectAndUpdateSupplierCategoriesEnhanced(supplier.id)
      
      if (updateResult) {
        console.log('✅ API integration successful')
        console.log(`   Updated categories: ${updateResult.categories.join(', ')}`)
        console.log(`   Confidence: ${(updateResult.confidence * 100).toFixed(1)}%`)
      } else {
        console.log('❌ API integration failed')
      }
    } catch (error) {
      console.log('❌ API integration error:', error.message)
    }

    console.log('\n📈 Performance Analysis')
    
    // Test bulk detection on a small set
    const testSuppliers = await prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      take: 3,
      include: { items: true }
    })

    console.log(`🔄 Testing bulk detection on ${testSuppliers.length} suppliers...`)
    
    const start = Date.now()
    let processed = 0
    let successful = 0

    for (const testSupplier of testSuppliers) {
      processed++
      try {
        const result = await detectSupplierCategoriesEnhanced(testSupplier.id)
        if (result) {
          successful++
          console.log(`   ✅ ${testSupplier.name}: ${result.categories.length} categories (${(result.confidence * 100).toFixed(0)}%)`)
        }
      } catch (error) {
        console.log(`   ❌ ${testSupplier.name}: ${error.message}`)
      }
    }

    const duration = Date.now() - start
    console.log(`\n📊 Bulk Detection Results:`)
    console.log(`   Processed: ${processed} suppliers`)
    console.log(`   Successful: ${successful} suppliers`)
    console.log(`   Success Rate: ${((successful / processed) * 100).toFixed(1)}%`)
    console.log(`   Duration: ${duration}ms`)
    console.log(`   Average: ${(duration / processed).toFixed(0)}ms per supplier`)

    console.log('\n🎉 Category Detection Testing Complete!\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testCategoryDetection()