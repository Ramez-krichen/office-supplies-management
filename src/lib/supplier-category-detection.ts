import { db as prisma } from '@/lib/db'

export interface SupplierCategoryDetection {
  supplierId: string
  categories: string[]
  detectedAt: Date
  itemCount: number
  categoryCount: number
  confidence?: number
  detectionMethods: string[]
  suggestions: CategorySuggestion[]
}

export interface CategorySuggestion {
  category: string
  confidence: number
  method: string
  reasoning: string
}

export interface CategoryPattern {
  keywords: string[]
  category: string
  weight: number
}

// Enhanced category patterns for office supplies
const CATEGORY_PATTERNS: CategoryPattern[] = [
  // Office Furniture
  { keywords: ['desk', 'chair', 'table', 'cabinet', 'shelf', 'furniture'], category: 'Office Furniture', weight: 0.9 },
  { keywords: ['ergonomic', 'adjustable', 'swivel', 'executive'], category: 'Office Furniture', weight: 0.8 },
  
  // Technology & Electronics
  { keywords: ['computer', 'laptop', 'monitor', 'printer', 'scanner', 'projector', 'tablet'], category: 'Technology & Electronics', weight: 0.95 },
  { keywords: ['cable', 'adapter', 'charger', 'wireless', 'bluetooth', 'usb', 'hdmi'], category: 'Technology & Electronics', weight: 0.85 },
  { keywords: ['software', 'license', 'subscription', 'cloud'], category: 'Technology & Electronics', weight: 0.8 },
  
  // Stationery & Writing
  { keywords: ['pen', 'pencil', 'marker', 'highlighter', 'eraser', 'ruler'], category: 'Stationery & Writing', weight: 0.9 },
  { keywords: ['notebook', 'notepad', 'diary', 'planner', 'calendar'], category: 'Stationery & Writing', weight: 0.85 },
  { keywords: ['stapler', 'clips', 'binder', 'folder', 'envelope'], category: 'Stationery & Writing', weight: 0.8 },
  
  // Printing & Paper
  { keywords: ['paper', 'cardstock', 'letterhead', 'envelope', 'label'], category: 'Printing & Paper', weight: 0.9 },
  { keywords: ['ink', 'toner', 'cartridge', 'ribbon'], category: 'Printing & Paper', weight: 0.95 },
  
  // Cleaning & Maintenance
  { keywords: ['cleaning', 'sanitizer', 'disinfectant', 'wipes', 'soap', 'detergent'], category: 'Cleaning & Maintenance', weight: 0.9 },
  { keywords: ['vacuum', 'mop', 'broom', 'trash', 'recycling'], category: 'Cleaning & Maintenance', weight: 0.85 },
  
  // Catering & Refreshments
  { keywords: ['coffee', 'tea', 'water', 'snacks', 'cups', 'plates'], category: 'Catering & Refreshments', weight: 0.85 },
  { keywords: ['refrigerator', 'microwave', 'kitchen', 'catering'], category: 'Catering & Refreshments', weight: 0.8 },
  
  // Safety & Security
  { keywords: ['safety', 'security', 'fire', 'alarm', 'lock', 'camera'], category: 'Safety & Security', weight: 0.9 },
  { keywords: ['protective', 'helmet', 'vest', 'emergency'], category: 'Safety & Security', weight: 0.85 }
]

/**
 * Analyzes supplier name and contact information for category hints
 */
function analyzeSupplierProfile(supplier: {
  name: string
  website?: string | null
  contactTitle?: string | null
  notes?: string | null
}): CategorySuggestion[] {
  const suggestions: CategorySuggestion[] = []
  const textToAnalyze = [
    supplier.name,
    supplier.website || '',
    supplier.contactTitle || '',
    supplier.notes || ''
  ].join(' ').toLowerCase()

  for (const pattern of CATEGORY_PATTERNS) {
    const matchedKeywords = pattern.keywords.filter(keyword => 
      textToAnalyze.includes(keyword.toLowerCase())
    )
    
    if (matchedKeywords.length > 0) {
      const confidence = Math.min(0.95, pattern.weight * (matchedKeywords.length / pattern.keywords.length))
      
      suggestions.push({
        category: pattern.category,
        confidence,
        method: 'supplier_profile_analysis',
        reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`
      })
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Analyzes item names and descriptions for category patterns
 */
function analyzeItemPatterns(items: Array<{
  name: string
  description?: string | null
  category: { name: string }
}>): CategorySuggestion[] {
  const suggestions: CategorySuggestion[] = []
  const categoryFrequency: Map<string, number> = new Map()
  const patternMatches: Map<string, { count: number, keywords: Set<string> }> = new Map()

  // Count existing categories from items
  items.forEach(item => {
    categoryFrequency.set(item.category.name, (categoryFrequency.get(item.category.name) || 0) + 1)
  })

  // Analyze item names and descriptions for patterns
  items.forEach(item => {
    const textToAnalyze = [item.name, item.description || ''].join(' ').toLowerCase()
    
    for (const pattern of CATEGORY_PATTERNS) {
      const matchedKeywords = pattern.keywords.filter(keyword => 
        textToAnalyze.includes(keyword.toLowerCase())
      )
      
      if (matchedKeywords.length > 0) {
        const existing = patternMatches.get(pattern.category) || { count: 0, keywords: new Set() }
        existing.count++
        matchedKeywords.forEach(kw => existing.keywords.add(kw))
        patternMatches.set(pattern.category, existing)
      }
    }
  })

  // Generate suggestions from existing categories
  categoryFrequency.forEach((count, category) => {
    const confidence = Math.min(0.95, count / items.length)
    suggestions.push({
      category,
      confidence,
      method: 'item_category_analysis',
      reasoning: `${count} items already in this category`
    })
  })

  // Generate suggestions from pattern matches
  patternMatches.forEach((data, category) => {
    const patternWeight = CATEGORY_PATTERNS.find(p => p.category === category)?.weight || 0.5
    const confidence = Math.min(0.9, patternWeight * (data.count / items.length))
    
    suggestions.push({
      category,
      confidence,
      method: 'item_pattern_analysis',
      reasoning: `Pattern match in ${data.count} items: ${Array.from(data.keywords).join(', ')}`
    })
  })

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

/**
 * Analyzes historical purchase patterns for category insights
 */
async function analyzeHistoricalPatterns(supplierId: string): Promise<CategorySuggestion[]> {
  try {
    const suggestions: CategorySuggestion[] = []
    
    // Get purchase order history with items
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        status: { in: ['COMPLETED', 'RECEIVED'] }
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' },
      take: 20 // Last 20 orders
    })

    const categorySpending: Map<string, { amount: number, frequency: number }> = new Map()
    let totalSpending = 0

    orders.forEach(order => {
      order.items.forEach(orderItem => {
        const category = orderItem.item.category.name
        const amount = orderItem.totalPrice
        
        const existing = categorySpending.get(category) || { amount: 0, frequency: 0 }
        existing.amount += amount
        existing.frequency += 1
        categorySpending.set(category, existing)
        totalSpending += amount
      })
    })

    // Generate suggestions based on spending patterns
    categorySpending.forEach((data, category) => {
      const spendingRatio = data.amount / totalSpending
      const confidence = Math.min(0.9, spendingRatio * 2) // Boost confidence for high-spending categories
      
      suggestions.push({
        category,
        confidence,
        method: 'historical_spending_analysis',
        reasoning: `${data.frequency} purchases, ${(spendingRatio * 100).toFixed(1)}% of spending`
      })
    })

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    console.error('Error analyzing historical patterns:', error)
    return []
  }
}

/**
 * Consolidates suggestions from multiple detection methods
 */
function consolidateSuggestions(allSuggestions: CategorySuggestion[]): {
  categories: string[]
  suggestions: CategorySuggestion[]
  confidence: number
} {
  const categoryScores: Map<string, { 
    totalConfidence: number
    methods: Set<string>
    bestReasoning: string
    maxConfidence: number
  }> = new Map()

  // Aggregate suggestions by category
  allSuggestions.forEach(suggestion => {
    const existing = categoryScores.get(suggestion.category) || {
      totalConfidence: 0,
      methods: new Set(),
      bestReasoning: '',
      maxConfidence: 0
    }
    
    existing.totalConfidence += suggestion.confidence
    existing.methods.add(suggestion.method)
    
    if (suggestion.confidence > existing.maxConfidence) {
      existing.maxConfidence = suggestion.confidence
      existing.bestReasoning = suggestion.reasoning
    }
    
    categoryScores.set(suggestion.category, existing)
  })

  // Create consolidated suggestions
  const consolidatedSuggestions: CategorySuggestion[] = []
  categoryScores.forEach((data, category) => {
    // Boost confidence for categories detected by multiple methods
    const methodBoost = data.methods.size > 1 ? 0.2 : 0
    const finalConfidence = Math.min(0.95, data.maxConfidence + methodBoost)
    
    consolidatedSuggestions.push({
      category,
      confidence: finalConfidence,
      method: Array.from(data.methods).join(', '),
      reasoning: data.bestReasoning
    })
  })

  // Sort by confidence and take top suggestions
  consolidatedSuggestions.sort((a, b) => b.confidence - a.confidence)
  
  // Extract high-confidence categories (>= 0.6)
  const categories = consolidatedSuggestions
    .filter(s => s.confidence >= 0.6)
    .map(s => s.category)
    .slice(0, 8) // Limit to 8 categories

  const overallConfidence = consolidatedSuggestions.length > 0 
    ? consolidatedSuggestions[0].confidence 
    : 0

  return {
    categories,
    suggestions: consolidatedSuggestions.slice(0, 10), // Top 10 suggestions
    confidence: overallConfidence
  }
}

/**
 * Enhanced supplier category detection with multiple analysis methods
 */
export async function detectSupplierCategoriesEnhanced(supplierId: string): Promise<SupplierCategoryDetection | null> {
  try {
    // Get supplier details and items
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        items: {
          where: { isActive: true },
          include: {
            category: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!supplier) {
      return null
    }

    const allSuggestions: CategorySuggestion[] = []
    const detectionMethods: string[] = []

    // Method 1: Supplier profile analysis
    const profileSuggestions = analyzeSupplierProfile(supplier)
    if (profileSuggestions.length > 0) {
      allSuggestions.push(...profileSuggestions)
      detectionMethods.push('supplier_profile_analysis')
    }

    // Method 2: Item pattern analysis (if items exist)
    if (supplier.items.length > 0) {
      const itemSuggestions = analyzeItemPatterns(supplier.items)
      allSuggestions.push(...itemSuggestions)
      detectionMethods.push('item_pattern_analysis')
    }

    // Method 3: Historical purchase pattern analysis
    const historicalSuggestions = await analyzeHistoricalPatterns(supplierId)
    if (historicalSuggestions.length > 0) {
      allSuggestions.push(...historicalSuggestions)
      detectionMethods.push('historical_spending_analysis')
    }

    // Consolidate all suggestions
    const consolidated = consolidateSuggestions(allSuggestions)

    const detection: SupplierCategoryDetection = {
      supplierId,
      categories: consolidated.categories,
      detectedAt: new Date(),
      itemCount: supplier.items.length,
      categoryCount: consolidated.categories.length,
      confidence: consolidated.confidence,
      detectionMethods,
      suggestions: consolidated.suggestions
    }

    return detection
  } catch (error) {
    console.error(`Error detecting enhanced categories for supplier ${supplierId}:`, error)
    return null
  }
}

// Keep existing functions for backward compatibility
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
      categoryCount: uniqueCategories.length,
      detectionMethods: ['basic_item_analysis'],
      suggestions: uniqueCategories.map(cat => ({
        category: cat,
        confidence: 1.0,
        method: 'basic_item_analysis',
        reasoning: 'Existing item category'
      }))
    }

    return detection
  } catch (error) {
    console.error(`Error detecting categories for supplier ${supplierId}:`, error)
    return null
  }
}

/**
 * Updates supplier categories in the database with enhanced metadata
 */
export async function updateSupplierCategoriesEnhanced(
  supplierId: string, 
  detection: SupplierCategoryDetection
): Promise<boolean> {
  try {
    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        categories: JSON.stringify({
          categories: detection.categories,
          confidence: detection.confidence,
          detectionMethods: detection.detectionMethods,
          suggestions: detection.suggestions.slice(0, 5), // Store top 5 suggestions
          detectedAt: detection.detectedAt.toISOString()
        }),
        categoriesDetectedAt: detection.detectedAt
      }
    })
    return true
  } catch (error) {
    console.error(`Error updating enhanced categories for supplier ${supplierId}:`, error)
    return false
  }
}

/**
 * Updates supplier categories in the database (backward compatibility)
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
 * Enhanced detect and update function
 */
export async function detectAndUpdateSupplierCategoriesEnhanced(supplierId: string): Promise<SupplierCategoryDetection | null> {
  const detection = await detectSupplierCategoriesEnhanced(supplierId)
  
  if (detection) {
    const updated = await updateSupplierCategoriesEnhanced(supplierId, detection)
    if (!updated) {
      return null
    }
  }
  
  return detection
}

/**
 * Detects and updates categories for a specific supplier (backward compatibility)
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
 * Enhanced bulk detection for all suppliers
 */
export async function detectAndUpdateAllSupplierCategoriesEnhanced(): Promise<{
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
        const detection = await detectAndUpdateSupplierCategoriesEnhanced(supplier.id)
        
        if (detection) {
          results.updated++
          results.results.push(detection)
          console.log(`Enhanced detection for ${supplier.name}: ${detection.categories.join(', ')} (confidence: ${detection.confidence?.toFixed(2)})`)
        }
      } catch (error) {
        results.errors++
        console.error(`Error processing supplier ${supplier.name}:`, error)
      }
    }

    console.log(`Enhanced category detection completed: ${results.updated}/${results.processed} suppliers updated, ${results.errors} errors`)
    return results
  } catch (error) {
    console.error('Error in bulk enhanced category detection:', error)
    throw error
  }
}

// Keep existing bulk function for backward compatibility
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
 * Enhanced function to parse supplier categories with metadata
 */
export function parseSupplierCategoriesEnhanced(categoriesJson: string | null): {
  categories: string[]
  confidence?: number
  detectionMethods?: string[]
  suggestions?: CategorySuggestion[]
  detectedAt?: string
} {
  if (!categoriesJson) return { categories: [] }
  
  try {
    const parsed = JSON.parse(categoriesJson)
    
    // Handle both old format (array) and new format (object)
    if (Array.isArray(parsed)) {
      return { categories: parsed }
    }
    
    return {
      categories: parsed.categories || [],
      confidence: parsed.confidence,
      detectionMethods: parsed.detectionMethods,
      suggestions: parsed.suggestions,
      detectedAt: parsed.detectedAt
    }
  } catch (error) {
    console.error('Error parsing enhanced supplier categories:', error)
    return { categories: [] }
  }
}

/**
 * Gets supplier categories from database (parsed from JSON) - backward compatibility
 */
export function parseSupplierCategories(categoriesJson: string | null): string[] {
  if (!categoriesJson) return []
  
  try {
    const parsed = JSON.parse(categoriesJson)
    
    // Handle both old format (array) and new format (object)
    if (Array.isArray(parsed)) {
      return parsed
    }
    
    return parsed.categories || []
  } catch (error) {
    console.error('Error parsing supplier categories:', error)
    return []
  }
}

/**
 * Enhanced formatting for category detection results
 */
export function formatCategoryDetectionSummaryEnhanced(detection: SupplierCategoryDetection): string {
  const { categories, itemCount, categoryCount, confidence, detectionMethods } = detection
  
  if (categoryCount === 0) {
    return 'No categories detected'
  }
  
  const confidenceText = confidence ? ` (${(confidence * 100).toFixed(0)}% confidence)` : ''
  const methodsText = detectionMethods?.length ? ` via ${detectionMethods.join(', ')}` : ''
  
  if (categoryCount === 1) {
    return `1 category detected from ${itemCount} items${confidenceText}: ${categories[0]}${methodsText}`
  }
  
  return `${categoryCount} categories detected from ${itemCount} items${confidenceText}: ${categories.join(', ')}${methodsText}`
}

/**
 * Formats category detection results for display (backward compatibility)
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
