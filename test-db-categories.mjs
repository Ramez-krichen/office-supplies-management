import { db as prisma } from './src/lib/db.js'

async function main() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const supplierCount = await prisma.supplier.count()
    console.log(`Found ${supplierCount} suppliers in database`)
    
    // Get Clean & Fresh Supplies specifically 
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
            name: true,
            category: {
              select: {
                name: true
              }
            }
          },
          take: 5
        }
      }
    })

    if (cleanSupplier) {
      console.log('\n=== Clean & Fresh Supplies Analysis ===')
      console.log(`ID: ${cleanSupplier.id}`)
      console.log(`Name: ${cleanSupplier.name}`)
      console.log(`Categories (raw): ${cleanSupplier.categories}`)
      console.log(`Categories detected at: ${cleanSupplier.categoriesDetectedAt}`)
      console.log(`Items count: ${cleanSupplier.items.length}`)
      
      if (cleanSupplier.categories) {
        try {
          const parsed = JSON.parse(cleanSupplier.categories)
          console.log('Parsed categories:', parsed)
        } catch (e) {
          console.log('Parse error:', e.message)
        }
      } else {
        console.log('No categories stored in database')
      }
      
      console.log('\nItems:')
      cleanSupplier.items.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.name} - Category: ${item.category?.name || 'N/A'}`)
      })
    } else {
      console.log('Clean & Fresh Supplies not found')
    }

    // Get all suppliers with their categories
    const allSuppliers = await prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        categories: true,
        categoriesDetectedAt: true
      },
      take: 10
    })

    console.log('\n=== All Suppliers Categories ===')
    allSuppliers.forEach((supplier, i) => {
      console.log(`${i + 1}. ${supplier.name}`)
      console.log(`   Raw categories: ${supplier.categories || 'null'}`)
      if (supplier.categories) {
        try {
          const parsed = JSON.parse(supplier.categories)
          if (Array.isArray(parsed)) {
            console.log(`   Parsed: [${parsed.join(', ')}]`)
          } else {
            console.log(`   Parsed: [${parsed.categories?.join(', ') || 'none'}] (confidence: ${parsed.confidence || 'N/A'})`)
          }
        } catch (e) {
          console.log(`   Parse error: ${e.message}`)
        }
      } else {
        console.log(`   No categories`)
      }
      console.log('')
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()