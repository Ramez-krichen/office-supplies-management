import { db as prisma } from './src/lib/db.js'
import { parseSupplierCategoriesEnhanced } from './src/lib/supplier-category-detection.js'

async function debugCategoriesIssue() {
  try {
    console.log('🔍 Debugging Categories Issue...\n')

    // 1. Check if Clean & Fresh Supplies exists and has categories
    const cleanSupplier = await prisma.supplier.findFirst({
      where: {
        name: {
          contains: 'Clean',
          mode: 'insensitive'
        }
      }
    })

    if (!cleanSupplier) {
      console.log('❌ Clean & Fresh Supplies not found in database')
      return
    }

    console.log('✅ Found Clean & Fresh Supplies:')
    console.log(`   ID: ${cleanSupplier.id}`)
    console.log(`   Name: ${cleanSupplier.name}`)
    console.log(`   Raw categories field: "${cleanSupplier.categories}"`)
    console.log(`   Categories detected at: ${cleanSupplier.categoriesDetectedAt}`)

    // 2. Test parsing the categories
    if (cleanSupplier.categories) {
      console.log('\n📊 Testing category parsing...')
      
      try {
        const rawParsed = JSON.parse(cleanSupplier.categories)
        console.log('   Raw JSON parse result:', rawParsed)
        
        const enhancedParsed = parseSupplierCategoriesEnhanced(cleanSupplier.categories)
        console.log('   Enhanced parse result:', enhancedParsed)
        
        if (enhancedParsed.categories.length === 0) {
          console.log('   ⚠️ Categories array is empty after parsing!')
        } else {
          console.log('   ✅ Categories parsed successfully:', enhancedParsed.categories)
        }
      } catch (parseError) {
        console.log('   ❌ Parse error:', parseError.message)
      }
    } else {
      console.log('\n❌ No categories stored in database for this supplier')
    }

    // 3. Test the API route transformation logic
    console.log('\n🌐 Testing API transformation logic...')
    
    let categoryData = { categories: [], confidence: 0, detectionMethods: [] }
    
    if (cleanSupplier.categories) {
      const parsed = parseSupplierCategoriesEnhanced(cleanSupplier.categories)
      categoryData = {
        categories: parsed.categories,
        confidence: parsed.confidence || 0,
        detectionMethods: parsed.detectionMethods || []
      }
    }
    
    console.log('   Final category data that would be sent to frontend:', categoryData)

    // 4. Check recent suppliers to see if any have categories
    console.log('\n📋 Checking all suppliers for categories...')
    
    const allSuppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        categories: true,
        categoriesDetectedAt: true
      },
      take: 10
    })

    let suppliersWithCategories = 0
    allSuppliers.forEach((supplier, i) => {
      if (supplier.categories) {
        suppliersWithCategories++
        console.log(`   ${i + 1}. ${supplier.name}: HAS categories`)
        try {
          const parsed = parseSupplierCategoriesEnhanced(supplier.categories)
          console.log(`      → Parsed: [${parsed.categories.join(', ')}]`)
        } catch (e) {
          console.log(`      → Parse error: ${e.message}`)
        }
      } else {
        console.log(`   ${i + 1}. ${supplier.name}: NO categories`)
      }
    })

    console.log(`\n📊 Summary: ${suppliersWithCategories}/${allSuppliers.length} suppliers have categories`)

    // 5. Test auto-detection to see if it would work
    console.log('\n🚀 Testing auto-detection...')
    try {
      const { detectSupplierCategoriesEnhanced } = await import('./src/lib/supplier-category-detection.js')
      const detection = await detectSupplierCategoriesEnhanced(cleanSupplier.id)
      
      if (detection) {
        console.log('   ✅ Auto-detection successful:')
        console.log(`      Categories: [${detection.categories.join(', ')}]`)
        console.log(`      Confidence: ${(detection.confidence * 100).toFixed(1)}%`)
        console.log(`      Methods: [${detection.detectionMethods.join(', ')}]`)
      } else {
        console.log('   ❌ Auto-detection failed')
      }
    } catch (detectionError) {
      console.log('   ❌ Auto-detection error:', detectionError.message)
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugCategoriesIssue()