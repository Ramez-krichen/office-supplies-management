const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugSupplierCategories() {
  try {
    console.log('Checking suppliers and their categories...')
    
    const suppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        categories: true,
        categoriesDetectedAt: true,
        items: {
          take: 3,
          select: {
            name: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      take: 5
    })

    console.log(`Found ${suppliers.length} suppliers:`)
    console.log('='.repeat(80))

    suppliers.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.name}`)
      console.log(`   ID: ${supplier.id}`)
      console.log(`   Categories (raw): ${supplier.categories}`)
      console.log(`   Categories Detected At: ${supplier.categoriesDetectedAt}`)
      
      // Parse categories if they exist
      if (supplier.categories) {
        try {
          const parsed = JSON.parse(supplier.categories)
          if (Array.isArray(parsed)) {
            console.log(`   Parsed Categories: [${parsed.join(', ')}]`)
          } else if (parsed.categories) {
            console.log(`   Parsed Categories: [${parsed.categories.join(', ')}]`)
            console.log(`   Confidence: ${parsed.confidence || 'N/A'}`)
            console.log(`   Detection Methods: ${parsed.detectionMethods?.join(', ') || 'N/A'}`)
          }
        } catch (e) {
          console.log(`   Parse Error: ${e.message}`)
        }
      } else {
        console.log(`   Parsed Categories: None`)
      }
      
      console.log(`   Sample Items:`)
      supplier.items.forEach((item, idx) => {
        console.log(`     ${idx + 1}. ${item.name} (Category: ${item.category?.name || 'No category'})`)
      })
      console.log('-'.repeat(60))
    })

    // Check specific supplier from screenshot
    const cleanSupplier = await prisma.supplier.findFirst({
      where: {
        name: {
          contains: 'Clean',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        categories: true,
        categoriesDetectedAt: true,
        items: {
          select: {
            id: true,
            name: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (cleanSupplier) {
      console.log('\nSpecific Analysis - Clean & Fresh Supplies:')
      console.log('='.repeat(80))
      console.log(`Name: ${cleanSupplier.name}`)
      console.log(`ID: ${cleanSupplier.id}`)
      console.log(`Raw Categories: ${cleanSupplier.categories}`)
      console.log(`Detection Date: ${cleanSupplier.categoriesDetectedAt}`)
      console.log(`Items Count: ${cleanSupplier.items.length}`)
      
      if (cleanSupplier.categories) {
        try {
          const parsed = JSON.parse(cleanSupplier.categories)
          console.log(`Parsed Categories:`, parsed)
        } catch (e) {
          console.log(`Parse Error: ${e.message}`)
        }
      }
      
      console.log('Items:')
      cleanSupplier.items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (Category: ${item.category?.name || 'No category'})`)
      })
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSupplierCategories()