import { db as prisma } from '@/lib/db'

export interface SupplierCategoryDetection {
  supplierId: string
  categories: string[]
  detectedAt: Date
  itemCount: number
  categoryCount: number
}

/**
 * Detects categories for a specific supplier based on their items
 */
export async function detectSupplierCategories(supplierId: string): Promise<SupplierCategoryDetection | null> {
  try {
    // Get all items for this supplier with their categories
    const supplierItems = await prisma.item.findMany({
      where: {
        supplierId: supplierId,
        isActive: true
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    if (supplierItems.length === 0) {
      return null
    }

    // Extract unique categories
    const uniqueCategories = [...new Set(supplierItems.map(item => item.category.name))]
    
    const detection: SupplierCategoryDetection = {
      supplierId,
      categories: uniqueCategories.sort(),
      detectedAt: new Date(),
      itemCount: supplierItems.length,
      categoryCount: uniqueCategories.length
    }

    return detection
  } catch (error) {
    console.error(`Error detecting categories for supplier ${supplierId}:`, error)
    return null
  }
}

/**
 * Updates supplier categories in the database
 */
export async function updateSupplierCategories(supplierId: string, categories: string[]): Promise<boolean> {
  try {
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        categories: JSON.stringify(categories),
        categoriesDetectedAt: new Date()
      }
    })
    return true
  } catch (error) {
    console.error(`Error updating categories for supplier ${supplierId}:`, error)
    return false
  }
}

/**
 * Detects and updates categories for a specific supplier
 */
export async function detectAndUpdateSupplierCategories(supplierId: string): Promise<SupplierCategoryDetection | null> {
  const detection = await detectSupplierCategories(supplierId)
  
  if (detection) {
    const updated = await updateSupplierCategories(supplierId, detection.categories)
    if (!updated) {
      return null
    }
  }
  
  return detection
}

/**
 * Detects and updates categories for all suppliers
 */
export async function detectAndUpdateAllSupplierCategories(): Promise<{
  processed: number
  updated: number
  errors: number
  results: SupplierCategoryDetection[]
}> {
  const results = {
    processed: 0,
    updated: 0,
    errors: 0,
    results: [] as SupplierCategoryDetection[]
  }

  try {
    // Get all active suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true }
    })

    for (const supplier of suppliers) {
      results.processed++
      
      try {
        const detection = await detectAndUpdateSupplierCategories(supplier.id)
        
        if (detection) {
          results.updated++
          results.results.push(detection)
          console.log(`Updated categories for supplier ${supplier.name}: ${detection.categories.join(', ')}`)
        }
      } catch (error) {
        results.errors++
        console.error(`Error processing supplier ${supplier.name}:`, error)
      }
    }

    console.log(`Category detection completed: ${results.updated}/${results.processed} suppliers updated, ${results.errors} errors`)
    return results
  } catch (error) {
    console.error('Error in bulk category detection:', error)
    throw error
  }
}

/**
 * Gets supplier categories from database (parsed from JSON)
 */
export function parseSupplierCategories(categoriesJson: string | null): string[] {
  if (!categoriesJson) return []
  
  try {
    const parsed = JSON.parse(categoriesJson)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Error parsing supplier categories:', error)
    return []
  }
}

/**
 * Formats category detection results for display
 */
export function formatCategoryDetectionSummary(detection: SupplierCategoryDetection): string {
  const { categories, itemCount, categoryCount } = detection
  
  if (categoryCount === 0) {
    return 'No categories detected'
  }
  
  if (categoryCount === 1) {
    return `1 category detected from ${itemCount} items: ${categories[0]}`
  }
  
  return `${categoryCount} categories detected from ${itemCount} items: ${categories.join(', ')}`
}
